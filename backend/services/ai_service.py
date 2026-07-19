"""
GovBrief AI — AI Service (Google Gemini via google-genai SDK)
"""
import json
import re
from config import settings

MODEL_NAME = "gemini-3.1-flash-lite"

import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(MODEL_NAME)


def _parse_json_response(text: str):
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return json.loads(text.strip())


def _generate(prompt: str) -> str:
    """Generate content using Gemini."""
    response = model.generate_content(prompt)
    return response.text


def match_schemes_ai(farmer_profile: dict, schemes: list[dict]) -> list[dict]:
    if not settings.GEMINI_API_KEY:
        return [{"scheme_id": s["id"], "scheme_name": s["name"], "eligibility_score": 70,
                 "reasons_eligible": ["API key not configured"], "documents_needed": s.get("documents_needed", ""),
                 "estimated_benefit": s.get("subsidy_amount", ""), "application_tip": "Visit agriculture office."}
                for s in schemes[:5]]

    schemes_summary = [{"id": s["id"], "name": s["name"], "category": s["category"],
                        "eligibility": s["eligibility"], "min_land": s.get("min_land"),
                        "max_income": s.get("max_income"), "farmer_category": s.get("farmer_category"),
                        "applicable_states": s.get("applicable_states"), "subsidy_amount": s.get("subsidy_amount"),
                        "documents_needed": s.get("documents_needed")} for s in schemes]

    prompt = f"""You are an expert on Indian government agricultural schemes.

Farmer Profile:
{json.dumps(farmer_profile, indent=2)}

Available Schemes:
{json.dumps(schemes_summary, indent=2)}

Return a JSON array of the TOP 5 most relevant schemes with keys:
- scheme_id (integer)
- scheme_name (string)
- eligibility_score (integer 0-100)
- reasons_eligible (list of 2-3 reason strings)
- documents_needed (string)
- estimated_benefit (string)
- application_tip (string)

Return ONLY valid JSON array, no explanation."""

    try:
        return _parse_json_response(_generate(prompt))
    except Exception as e:
        print(f"AI Error in match_schemes_ai: {e}")
        return [{"scheme_id": s["id"], "scheme_name": s["name"], "eligibility_score": 65,
                 "reasons_eligible": ["Based on your profile"], "documents_needed": s.get("documents_needed", ""),
                 "estimated_benefit": s.get("subsidy_amount", ""), "application_tip": "Visit agriculture office."}
                for s in schemes[:5]]


def chat_scheme_matcher(message: str, conversation_history: list, farmer_profile: dict) -> dict:
    if not settings.GEMINI_API_KEY:
        return {"reply": "Please configure your Gemini API key to enable AI chat.", "profile_update": {}}

    history_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in conversation_history[-6:]])

    prompt = f"""You are GovBrief AI, a helpful agricultural advisor for Indian farmers.
Respond in the same language as the farmer. Keep responses under 150 words.

Farmer profile so far: {json.dumps(farmer_profile)}
Conversation: {history_text}
Farmer says: {message}

Return JSON with:
- reply (string): your response
- profile_update (dict): any profile info learned (state, district, land_size, income, crop_types, farmer_category)

Return ONLY valid JSON."""

    try:
        return _parse_json_response(_generate(prompt))
    except Exception as e:
        print(f"AI Error in chat_scheme_matcher: {e}")
        return {"reply": "I'm here to help! Which state are you farming in?", "profile_update": {}}


def summarize_pdf_ai(text: str) -> dict:
    if not settings.GEMINI_API_KEY:
        return {"scheme_name": "Policy Document", "benefits": text[:200], "documents_needed": [],
                "deadline": "Check official portal", "how_to_apply": "Visit official website", "summary": text[:300]}

    text_sample = text[:8000]
    prompt = f"""Analyze this Indian government agricultural policy document and return JSON with:
- scheme_name, ministry, benefits, subsidy_percentage, documents_needed (list), deadline,
  eligibility, how_to_apply, helpline, summary (3 sentences for farmers)

Document:
{text_sample}

Return ONLY valid JSON."""

    try:
        return _parse_json_response(_generate(prompt))
    except Exception:
        return {"scheme_name": "Policy Document", "ministry": "Agriculture", "benefits": "See document",
                "documents_needed": ["Aadhaar", "Land Record"], "deadline": "Check portal",
                "eligibility": "Indian farmers", "how_to_apply": "Visit agriculture office",
                "helpline": "1800-180-1551", "summary": text[:300]}


def structure_ocr_text(raw_text: str, doc_type: str) -> dict:
    if not settings.GEMINI_API_KEY:
        return {"raw_text": raw_text, "doc_type": doc_type, "fields": {}}

    prompt = f"""Extract structured fields from this OCR text of an Indian {doc_type} document.
Return JSON with relevant fields (name, dob, address, id_number, father_name, state, district, pincode,
bank_account, ifsc_code, land_area, survey_number — only include fields found in text).

OCR Text:
{raw_text[:3000]}

Return ONLY valid JSON."""

    try:
        fields = _parse_json_response(_generate(prompt))
        return {"raw_text": raw_text, "doc_type": doc_type, "fields": fields}
    except Exception:
        return {"raw_text": raw_text, "doc_type": doc_type, "fields": {}}


def analyze_rejection_risk(application_data: dict, scheme: dict) -> dict:
    if not settings.GEMINI_API_KEY:
        return {"risk_level": "unknown", "overall_score": 50, "issues": [], "missing_documents": [],
                "field_errors": [], "recommendations": [], "likely_rejection_reasons": []}

    prompt = f"""You are an objective AI Rejection Analyzer for Indian government agricultural schemes.
Analyze this application for rejection risk against the scheme requirements.
Do NOT assume high risk if the application data simply lacks some fields, instead mark them as 'missing_documents' or 'field_errors'.
Score objectively based on eligibility rules.
If the application meets the criteria or only has minor missing fields, risk_level should be 'low' or 'medium'.
Only return 'high' risk if there is a definitive eligibility mismatch (e.g., income too high, land too large).

Scheme: {json.dumps(scheme)}
Application: {json.dumps(application_data)}

Return JSON with: risk_level (low/medium/high), overall_score (0-100), issues (list of strings),
missing_documents (list of strings), field_errors (list of strings), recommendations (list of strings), likely_rejection_reasons (list of strings).
Return ONLY valid JSON without markdown formatting."""

    try:
        return _parse_json_response(_generate(prompt))
    except Exception:
        return {"risk_level": "medium", "overall_score": 50, "issues": [], "missing_documents": [],
                "field_errors": [], "recommendations": ["Verify all documents"], "likely_rejection_reasons": []}
