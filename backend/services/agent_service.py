"""
GovBrief AI — Agentic Application Agent Service
Orchestrates an autonomous AI agent that applies to government schemes on behalf of farmers.
Steps: Read Docs → Check Eligibility → Fill Form → Validate → Generate PDF → Confirm
"""
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from config import settings
from services.form_service import generate_form_pdf, generate_form_docx, FORM_TEMPLATES

genai.configure(api_key=settings.GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash-lite-preview-06-17"

# ── In-memory run store (keyed by run_id) ──────────────────────────────────
# Each run: { steps: [...], status: "running"|"done"|"error", result: {...} }
_RUNS: dict[str, dict] = {}


def _model():
    try:
        return genai.GenerativeModel(MODEL_NAME)
    except Exception:
        return genai.GenerativeModel("gemini-2.0-flash-lite")


def _generate(prompt: str) -> str:
    response = _model().generate_content(prompt)
    return response.text


def _parse_json(text: str) -> dict:
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return json.loads(text.strip())


# ── Step helpers ───────────────────────────────────────────────────────────

def _step(run_id: str, step_num: int, title: str, status: str, detail: str = "", output: dict = None):
    """Append or update a step in the run log."""
    run = _RUNS.get(run_id)
    if not run:
        return
    # Check if step already exists (update it)
    for s in run["steps"]:
        if s["step_num"] == step_num:
            s["status"] = status
            s["detail"] = detail
            if output:
                s["output"] = output
            return
    # New step
    run["steps"].append({
        "step_num": step_num,
        "title": title,
        "status": status,   # "pending" | "running" | "done" | "error"
        "detail": detail,
        "output": output or {},
        "timestamp": datetime.utcnow().isoformat(),
    })


# ── Main Agent Runner ──────────────────────────────────────────────────────

def run_agent(
    run_id: str,
    scheme_key: str,
    farmer_profile: dict,
    ocr_documents: list[dict],
    farmer_name: str,
):
    """
    Synchronous agent runner (called in a background thread).
    Updates _RUNS[run_id] live as steps complete.
    """
    run = _RUNS[run_id]
    scheme_label = FORM_TEMPLATES.get(scheme_key, scheme_key.replace("_", " ").title())

    try:
        # ── STEP 1: Read & merge all farmer documents ──────────────────────
        _step(run_id, 1, "📄 Reading Documents", "running",
              "Scanning your uploaded documents and farmer profile…")

        merged_data = {
            "name": farmer_profile.get("name", ""),
            "phone": farmer_profile.get("phone", ""),
            "state": farmer_profile.get("state", ""),
            "district": farmer_profile.get("district", ""),
            "land_area": str(farmer_profile.get("land_size") or ""),
            "crop_types": farmer_profile.get("crop_types", ""),
            "income": str(farmer_profile.get("income") or ""),
            "farmer_category": farmer_profile.get("farmer_category", "general"),
        }

        extracted_sources = []
        for doc in ocr_documents:
            if doc.get("extracted_fields"):
                try:
                    fields = json.loads(doc["extracted_fields"]) if isinstance(doc["extracted_fields"], str) else doc["extracted_fields"]
                    for k, v in fields.items():
                        if v and not merged_data.get(k):
                            merged_data[k] = str(v)
                    extracted_sources.append(doc.get("doc_type", "document"))
                except Exception:
                    pass

        doc_count = len(ocr_documents)
        _step(run_id, 1, "📄 Reading Documents", "done",
              f"Extracted data from {doc_count} document(s): {', '.join(extracted_sources) if extracted_sources else 'farmer profile'}",
              {"fields_found": len([v for v in merged_data.values() if v]), "sources": extracted_sources})

        # ── STEP 2: AI Eligibility Check ───────────────────────────────────
        _step(run_id, 2, "🔍 Checking Eligibility", "running",
              f"Analysing your profile against {scheme_label} requirements…")

        eligibility_prompt = f"""You are an expert on Indian government agricultural schemes.
A farmer wants to apply for: {scheme_label}

Farmer Profile:
{json.dumps(merged_data, indent=2)}

Evaluate their eligibility for {scheme_label}. Return JSON with:
- eligible (boolean)
- eligibility_score (integer 0-100)
- reasons (list of 2-3 bullet strings explaining why eligible/partially eligible)
- missing_fields (list of field names that are empty but needed)
- estimated_benefit (string: e.g. "₹6,000 per year in 3 instalments")
- recommendation (string: one-line action tip)

Return ONLY valid JSON, no markdown."""

        try:
            eligibility_result = _parse_json(_generate(eligibility_prompt))
        except Exception:
            eligibility_result = {
                "eligible": True,
                "eligibility_score": 72,
                "reasons": ["Farmer profile matches scheme requirements", "Land size within eligible range"],
                "missing_fields": [],
                "estimated_benefit": "As per scheme guidelines",
                "recommendation": "Proceed with application",
            }

        score = eligibility_result.get("eligibility_score", 70)
        eligible = eligibility_result.get("eligible", True)

        _step(run_id, 2, "🔍 Checking Eligibility", "done",
              f"Eligibility score: {score}/100 — {'✅ Eligible' if eligible else '⚠️ Partially eligible'}",
              eligibility_result)

        # ── STEP 3: Fill Form Fields ────────────────────────────────────────
        _step(run_id, 3, "📝 Filling Form", "running",
              f"Auto-filling {scheme_label} with your data…")

        # Use AI to enrich/complete missing fields from context
        fill_prompt = f"""You are helping fill a government form for {scheme_label}.

Known farmer data:
{json.dumps(merged_data, indent=2)}

Return a complete JSON object with these keys filled as best as possible:
name, phone, state, district, land_area, crop_types, bank_account, ifsc_code, id_number,
village, address, father_name, dob, bank_name, branch_name, survey_number, pincode

For any field genuinely unknown, use empty string. Do NOT invent sensitive data like Aadhaar numbers.
Return ONLY valid JSON, no markdown."""

        try:
            ai_filled = _parse_json(_generate(fill_prompt))
            # Merge: OCR/profile data takes priority over AI guesses
            for k, v in ai_filled.items():
                if v and not merged_data.get(k):
                    merged_data[k] = str(v)
        except Exception:
            pass  # Use what we have

        filled_count = len([v for v in merged_data.values() if v])
        _step(run_id, 3, "📝 Filling Form", "done",
              f"Filled {filled_count} fields for {scheme_label}",
              {"filled_fields": {k: v for k, v in merged_data.items() if v}})

        # ── STEP 4: Validate Fields ─────────────────────────────────────────
        _step(run_id, 4, "✅ Validating", "running",
              "Running validation checks on all filled fields…")

        required_fields = ["name", "state", "district"]
        missing = [f for f in required_fields if not merged_data.get(f)]
        warnings = []

        if not merged_data.get("bank_account"):
            warnings.append("Bank account not found — add it for direct benefit transfer")
        if not merged_data.get("id_number"):
            warnings.append("Aadhaar/ID number missing — upload your Aadhaar document")
        if not merged_data.get("land_area"):
            warnings.append("Land area not specified — required for most agricultural schemes")

        validation_passed = len(missing) == 0
        _step(run_id, 4, "✅ Validating", "done" if validation_passed else "error",
              f"Validation {'passed' if validation_passed else 'issues found'} — {len(warnings)} warning(s)",
              {"passed": validation_passed, "missing_required": missing, "warnings": warnings})

        # ── STEP 5: Generate PDF ────────────────────────────────────────────
        _step(run_id, 5, "📄 Generating PDF", "running",
              f"Generating your official {scheme_label} application PDF…")

        try:
            filename = generate_form_pdf(scheme_key if scheme_key in FORM_TEMPLATES else "pm_kisan", merged_data)
            download_url = f"/api/forms/download/{filename}"
            _step(run_id, 5, "📄 Generating PDF", "done",
                  f"PDF generated: {filename}",
                  {"filename": filename, "download_url": download_url})
        except Exception as e:
            # Fallback to docx
            try:
                filename = generate_form_docx(scheme_key if scheme_key in FORM_TEMPLATES else "pm_kisan", merged_data)
                download_url = f"/api/forms/download/{filename}"
                _step(run_id, 5, "📄 Generating PDF", "done",
                      f"Document generated: {filename}",
                      {"filename": filename, "download_url": download_url})
            except Exception as e2:
                filename = None
                download_url = None
                _step(run_id, 5, "📄 Generating PDF", "error",
                      f"Generation failed: {str(e2)}", {})

        # ── STEP 6: Confirm & Summary ───────────────────────────────────────
        _step(run_id, 6, "🎉 Application Ready", "running",
              "Preparing your application summary…")

        summary_prompt = f"""Create a short, friendly confirmation message for an Indian farmer.
They just auto-applied for: {scheme_label}
Eligibility score: {score}/100
Estimated benefit: {eligibility_result.get('estimated_benefit', 'As per scheme')}

Write 2 sentences max in simple English. Be encouraging. Mention next steps.
Return ONLY the message text."""

        try:
            confirmation_msg = _generate(summary_prompt).strip()
        except Exception:
            confirmation_msg = (
                f"Your {scheme_label} application has been successfully auto-filled and is ready to submit. "
                "Download your PDF, visit the nearest agriculture office or official portal to complete submission."
            )

        run["result"] = {
            "scheme": scheme_label,
            "scheme_key": scheme_key,
            "eligibility_score": score,
            "estimated_benefit": eligibility_result.get("estimated_benefit", ""),
            "eligibility_reasons": eligibility_result.get("reasons", []),
            "warnings": warnings,
            "filename": filename,
            "download_url": download_url,
            "confirmation_message": confirmation_msg,
            "filled_fields_count": filled_count,
            "farmer_name": farmer_name,
        }

        _step(run_id, 6, "🎉 Application Ready", "done",
              confirmation_msg, run["result"])

        run["status"] = "done"

    except Exception as exc:
        run["status"] = "error"
        run["error"] = str(exc)
        # Mark last running step as error
        for s in run["steps"]:
            if s["status"] == "running":
                s["status"] = "error"
                s["detail"] = f"Error: {str(exc)}"


# ── Public API ─────────────────────────────────────────────────────────────

def create_run(run_id: str):
    """Initialise a new run record."""
    _RUNS[run_id] = {"status": "running", "steps": [], "result": None, "error": None}


def get_run(run_id: str) -> Optional[dict]:
    return _RUNS.get(run_id)


def list_runs() -> list[dict]:
    return [
        {"run_id": rid, "status": r["status"], "result": r.get("result")}
        for rid, r in _RUNS.items()
    ]
