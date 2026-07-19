"""
GovBrief AI — Admin Scraper Router
Password-protected admin endpoint to scrape government scheme URLs,
save to DB, and broadcast to all community WebSocket clients.
"""
import re
import json
import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

import google.generativeai as genai
from database import get_db
from models.scheme import Scheme
from config import settings
from routers.payouts import manager as ws_manager   # reuse existing WS manager

# ── Config ──────────────────────────────────────────────────────────────────
ADMIN_PASSWORD = "GovBrief@Admin2026"   # Only admin knows this
MODEL_NAME = "gemini-2.5-flash"

genai.configure(api_key=settings.GEMINI_API_KEY)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Schemas ─────────────────────────────────────────────────────────────────
class AdminAuthRequest(BaseModel):
    password: str


class ScrapeRequest(BaseModel):
    admin_password: str
    url: str


class DeleteRequest(BaseModel):
    admin_password: str
    scheme_id: int


# ── Helpers ──────────────────────────────────────────────────────────────────
def _verify_password(pwd: str):
    if pwd != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid admin password")


def _get_model():
    try:
        return genai.GenerativeModel(MODEL_NAME)
    except Exception:
        return genai.GenerativeModel("gemini-2.0-flash-lite")


def _fetch_url(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        with httpx.Client(follow_redirects=True, headers=headers, timeout=20.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        raise HTTPException(400, f"Could not fetch URL: {str(e)}")


def _extract_scheme_ai(html: str, url: str) -> dict:
    sample = html[:40000]
    prompt = f"""You are an expert on Indian government agricultural schemes.
Extract scheme details from the following website content.
Return a strict JSON object with these keys (use null if not found):
- name (string): Full name of the scheme
- short_name (string): Acronym or short name  
- description (string): 2-3 sentence summary
- category (string): e.g. "Crop Insurance", "Irrigation", "Income Support", "Solar", "Credit"
- ministry (string): responsible ministry
- benefits (string): detailed benefits text
- subsidy_amount (string): e.g. "80% subsidy" or "₹6000/year"
- max_benefit (number or null): max benefit in INR
- eligibility (string): eligibility criteria
- min_land (number or null): minimum land in acres
- max_land (number or null): maximum land in acres
- max_income (number or null): max annual income in INR
- farmer_category (string): "small", "marginal", or "all"
- documents_needed (string): comma-separated document list
- deadline (string or null): deadline in YYYY-MM-DD format
- applicable_states (string): "All" or comma-separated states
- apply_url (string): application URL, default "{url}"
- helpline (string or null): helpline number

Content:
{sample}

Return ONLY valid JSON, no markdown."""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        return json.loads(text.strip())
    except Exception as e:
        raise HTTPException(500, f"AI extraction failed: {str(e)}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/verify")
def verify_admin(req: AdminAuthRequest):
    """Verify admin password. Returns success flag."""
    _verify_password(req.password)
    return {"authenticated": True, "message": "Admin access granted"}


@router.post("/scrape")
async def scrape_and_add_scheme(req: ScrapeRequest, db: Session = Depends(get_db)):
    """
    Scrape a government URL, extract scheme with AI, save to DB,
    and broadcast a live announcement to all WebSocket community clients.
    """
    _verify_password(req.admin_password)

    # 1. Fetch the URL
    html = _fetch_url(req.url)

    # 2. AI extraction
    scheme_data = _extract_scheme_ai(html, req.url)

    # 3. Check for duplicate by name
    existing = db.query(Scheme).filter(
        Scheme.name == scheme_data.get("name", "")
    ).first()
    if existing:
        raise HTTPException(409, f"Scheme '{scheme_data['name']}' already exists in database (ID: {existing.id})")

    # 4. Parse deadline
    deadline_date = None
    if scheme_data.get("deadline"):
        try:
            deadline_date = datetime.strptime(str(scheme_data["deadline"]), "%Y-%m-%d")
        except Exception:
            pass

    # 5. Save to DB
    new_scheme = Scheme(
        name=scheme_data.get("name", "Unknown Scheme"),
        short_name=scheme_data.get("short_name"),
        description=scheme_data.get("description", ""),
        category=scheme_data.get("category", "General"),
        ministry=scheme_data.get("ministry"),
        benefits=scheme_data.get("benefits", ""),
        subsidy_amount=scheme_data.get("subsidy_amount"),
        max_benefit=scheme_data.get("max_benefit"),
        eligibility=scheme_data.get("eligibility", ""),
        min_land=scheme_data.get("min_land"),
        max_land=scheme_data.get("max_land"),
        max_income=scheme_data.get("max_income"),
        farmer_category=scheme_data.get("farmer_category", "all"),
        documents_needed=scheme_data.get("documents_needed", "Aadhaar, Land Record"),
        deadline=deadline_date,
        is_active=True,
        applicable_states=scheme_data.get("applicable_states", "All"),
        apply_url=scheme_data.get("apply_url", req.url),
        helpline=scheme_data.get("helpline"),
    )
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)

    # 6. Broadcast to community WebSocket clients
    broadcast_payload = {
        "type": "new_scheme_live",
        "scheme_id": new_scheme.id,
        "scheme_name": new_scheme.name,
        "category": new_scheme.category,
        "benefits": new_scheme.benefits[:150] + "…" if new_scheme.benefits and len(new_scheme.benefits) > 150 else new_scheme.benefits,
        "subsidy_amount": new_scheme.subsidy_amount,
        "applicable_states": new_scheme.applicable_states,
        "source_url": req.url,
        "timestamp": datetime.utcnow().isoformat(),
        "message": f"🆕 New scheme added LIVE: {new_scheme.name}",
    }
    try:
        await ws_manager.broadcast(broadcast_payload)
    except Exception:
        pass   # Don't fail if no WS clients

    return {
        "success": True,
        "scheme_id": new_scheme.id,
        "scheme_name": new_scheme.name,
        "category": new_scheme.category,
        "ministry": new_scheme.ministry,
        "subsidy_amount": new_scheme.subsidy_amount,
        "applicable_states": new_scheme.applicable_states,
        "deadline": scheme_data.get("deadline"),
        "documents_needed": new_scheme.documents_needed,
        "benefits_preview": broadcast_payload["benefits"],
        "broadcast_sent": True,
        "message": f"✅ '{new_scheme.name}' successfully added to database and broadcast to community!",
    }


@router.get("/schemes")
def list_all_schemes(admin_password: str, db: Session = Depends(get_db)):
    """List all schemes in DB (admin view)."""
    _verify_password(admin_password)
    schemes = db.query(Scheme).order_by(Scheme.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "ministry": s.ministry,
            "subsidy_amount": s.subsidy_amount,
            "applicable_states": s.applicable_states,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in schemes
    ]


@router.delete("/scheme")
def delete_scheme(req: DeleteRequest, db: Session = Depends(get_db)):
    """Delete a scheme from the database (admin only)."""
    _verify_password(req.admin_password)
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(404, "Scheme not found")
    name = scheme.name
    db.delete(scheme)
    db.commit()
    return {"success": True, "message": f"'{name}' deleted from database"}
