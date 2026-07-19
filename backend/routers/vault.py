"""
GovBrief AI — Vault Router (Secure Document Vault)
"""
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from models.user import User
from services.encryption import encrypt_and_store, decrypt_file
from routers.auth import get_current_user
from config import settings

router = APIRouter(prefix="/api/vault", tags=["Document Vault"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/upload")
async def vault_upload(
    file: UploadFile = File(...),
    doc_type: str = Form("other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Encrypt and store a document in the vault."""
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 20MB)")

    storage_info = encrypt_and_store(file_bytes, file.filename, current_user.id)

    doc = Document(
        user_id=current_user.id,
        doc_type=doc_type,
        original_filename=file.filename,
        stored_filename=storage_info["stored_filename"],
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
        "message": "Document encrypted and stored securely.",
        "file_size_kb": round(storage_info["file_size"] / 1024, 1),
    }


@router.get("/list")
def vault_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return [
        {
            "id": d.id, "doc_type": d.doc_type,
            "filename": d.original_filename,
            "file_size_kb": round((d.file_size or 0) / 1024, 1),
            "is_encrypted": d.is_encrypted,
            "uploaded_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.get("/download/{doc_id}")
def vault_download(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    stored_path = Path(settings.UPLOAD_DIR) / doc.stored_filename
    if not stored_path.exists():
        raise HTTPException(404, "File not found on disk")

    file_bytes = decrypt_file(str(stored_path))
    return Response(
        content=file_bytes,
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.original_filename}"'},
    )


@router.delete("/{doc_id}")
def vault_delete(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    stored_path = Path(settings.UPLOAD_DIR) / doc.stored_filename
    if stored_path.exists():
        stored_path.unlink()
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Document deleted."}
