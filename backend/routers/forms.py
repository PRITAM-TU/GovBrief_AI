"""
GovBrief AI — Forms Router
Auto form filling and rejection analyzer
"""
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.scheme import Scheme
from models.user import User
from models.document import Document
from services.form_service import generate_form_docx, generate_form_pdf, FORM_TEMPLATES
from services.ai_service import analyze_rejection_risk
from routers.auth import get_current_user
from config import settings

router = APIRouter(prefix="/api/forms", tags=["Forms"])


class FormRequest(BaseModel):
    form_type: str
    data: dict
    format: str = "docx"   # "docx" or "pdf"

class RejectionAnalysisRequest(BaseModel):
    scheme_id: int
    application_data: dict


@router.get("/templates")
def list_templates():
    return [{"key": k, "name": v} for k, v in FORM_TEMPLATES.items()]


@router.post("/generate")
def generate_form(req: FormRequest, db: Session = Depends(get_db)):
    """Generate a filled government form."""
    if req.form_type not in FORM_TEMPLATES:
        raise HTTPException(400, f"Unknown form type. Available: {list(FORM_TEMPLATES.keys())}")

    try:
        if req.format == "pdf":
            filename = generate_form_pdf(req.form_type, req.data)
        else:
            filename = generate_form_docx(req.form_type, req.data)
        return {"success": True, "filename": filename, "download_url": f"/api/forms/download/{filename}"}
    except Exception as e:
        raise HTTPException(500, f"Form generation failed: {str(e)}")


@router.post("/auto-fill")
def auto_fill_from_documents(
    form_type: str,
    format: str = "docx",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-fill a form using OCR-extracted data from user's documents."""
    # Gather all document fields
    merged_data = {
        "name": current_user.name,
        "phone": current_user.phone,
        "state": current_user.state or "",
        "district": current_user.district or "",
        "land_area": str(current_user.land_size or ""),
        "crop_types": current_user.crop_types or "",
    }

    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    for doc in docs:
        if doc.extracted_fields:
            try:
                fields = json.loads(doc.extracted_fields)
                merged_data.update({k: v for k, v in fields.items() if v})
            except Exception:
                pass

    try:
        if format == "pdf":
            filename = generate_form_pdf(form_type, merged_data)
        else:
            filename = generate_form_docx(form_type, merged_data)
        return {
            "success": True, "filename": filename,
            "download_url": f"/api/forms/download/{filename}",
            "prefilled_fields": list(merged_data.keys()),
        }
    except Exception as e:
        raise HTTPException(500, f"Auto-fill failed: {str(e)}")


@router.get("/download/{filename}")
def download_form(filename: str):
    """Download a generated form file."""
    filepath = Path(settings.GENERATED_DIR) / filename
    if not filepath.exists():
        raise HTTPException(404, "File not found")
    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if filename.endswith(".docx") else "application/pdf"
    return FileResponse(str(filepath), media_type=media_type, filename=filename)


@router.post("/analyze-rejection")
def analyze_rejection(req: RejectionAnalysisRequest, db: Session = Depends(get_db)):
    """Analyze application data for rejection risk."""
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(404, "Scheme not found")
    scheme_data = {"name": scheme.name, "eligibility": scheme.eligibility,
                   "documents_needed": scheme.documents_needed, "max_income": scheme.max_income,
                   "min_land": scheme.min_land, "farmer_category": scheme.farmer_category}
    result = analyze_rejection_risk(req.application_data, scheme_data)
    return result
