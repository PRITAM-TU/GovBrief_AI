"""
GovBrief AI — OCR Router
Handles document image uploads and text extraction
"""
import os
import uuid
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from models.user import User
from services.ocr_service import extract_text_from_image, detect_document_type
from services.ai_service import structure_ocr_text
from services.encryption import encrypt_and_store
from routers.auth import get_current_user
from config import settings

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp", "image/tiff"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("auto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload document image → OCR → AI structuring → Store encrypted."""
    # Validate
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum 10MB.")

    # Save temp file for OCR
    temp_name = f"temp_{uuid.uuid4().hex}{Path(file.filename).suffix}"
    temp_path = Path(settings.UPLOAD_DIR) / temp_name
    temp_path.write_bytes(file_bytes)

    try:
        # Extract text
        raw_text = extract_text_from_image(str(temp_path))

        # Auto-detect doc type if needed
        if doc_type == "auto":
            doc_type = detect_document_type(raw_text)

        # AI structuring
        structured = structure_ocr_text(raw_text, doc_type)

        # Encrypt and store
        storage_info = encrypt_and_store(file_bytes, file.filename, current_user.id)

        # Save to DB
        doc = Document(
            user_id=current_user.id,
            doc_type=doc_type,
            original_filename=file.filename,
            stored_filename=storage_info["stored_filename"],
            extracted_text=raw_text[:5000],  # Limit stored text
            extracted_fields=json.dumps(structured.get("fields", {})),
            is_encrypted=True,
            file_size=storage_info["file_size"],
            mime_type=file.content_type,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        return {
            "success": True,
            "document_id": doc.id,
            "doc_type": doc_type,
            "raw_text": raw_text[:2000],
            "extracted_fields": structured.get("fields", {}),
            "message": "Document processed and stored securely.",
        }
    finally:
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()


@router.get("/documents")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents uploaded by the current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [
        {
            "id": d.id, "doc_type": d.doc_type,
            "original_filename": d.original_filename,
            "extracted_fields": json.loads(d.extracted_fields) if d.extracted_fields else {},
            "file_size": d.file_size,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.get("/document/{doc_id}/fields")
def get_document_fields(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get extracted fields from a specific document."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "extracted_fields": json.loads(doc.extracted_fields) if doc.extracted_fields else {},
        "raw_text_preview": doc.extracted_text[:500] if doc.extracted_text else "",
    }
