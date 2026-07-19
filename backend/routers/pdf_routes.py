"""
GovBrief AI — PDF Summarizer Router
"""
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pdf_service import extract_pdf_text, get_pdf_metadata
from services.ai_service import summarize_pdf_ai
from config import settings

router = APIRouter(prefix="/api/pdf", tags=["PDF Summarizer"])

ALLOWED_PDF = {"application/pdf"}
MAX_PDF_SIZE = 20 * 1024 * 1024  # 20MB


@router.post("/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    """Upload a government PDF → extract text → AI summary."""
    if file.content_type not in ALLOWED_PDF:
        raise HTTPException(400, "Only PDF files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PDF_SIZE:
        raise HTTPException(400, "PDF too large. Maximum 20MB.")

    # Save temp
    temp_name = f"temp_{uuid.uuid4().hex}.pdf"
    temp_path = Path(settings.UPLOAD_DIR) / temp_name
    temp_path.write_bytes(file_bytes)

    try:
        metadata = get_pdf_metadata(str(temp_path))
        text = extract_pdf_text(str(temp_path))

        if len(text.strip()) < 50:
            raise HTTPException(422, "Could not extract readable text from this PDF.")

        summary = summarize_pdf_ai(text)
        return {"success": True, "metadata": metadata, "summary": summary, "text_length": len(text)}
    finally:
        if temp_path.exists():
            temp_path.unlink()


@router.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """Just extract raw text from PDF without AI summarization."""
    file_bytes = await file.read()
    temp_name = f"temp_{uuid.uuid4().hex}.pdf"
    temp_path = Path(settings.UPLOAD_DIR) / temp_name
    temp_path.write_bytes(file_bytes)
    try:
        text = extract_pdf_text(str(temp_path))
        return {"text": text[:10000], "char_count": len(text)}
    finally:
        if temp_path.exists():
            temp_path.unlink()
