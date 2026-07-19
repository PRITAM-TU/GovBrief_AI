from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database import get_db
from models.application import UserApplication
from models.scheme import Scheme
from routers.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])

class ApplicationCreate(BaseModel):
    scheme_id: int
    application_ref_id: str

class ApplicationStatusUpdate(BaseModel):
    status: str

@router.post("/")
def create_application(req: ApplicationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Verify scheme exists
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    app = UserApplication(
        user_id=current_user.id,
        scheme_id=req.scheme_id,
        application_ref_id=req.application_ref_id,
        status="Pending"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return {"message": "Application tracked successfully", "id": app.id}

@router.get("/")
def list_applications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    apps = db.query(UserApplication).filter(UserApplication.user_id == current_user.id).order_by(UserApplication.created_at.desc()).all()
    results = []
    for app in apps:
        results.append({
            "id": app.id,
            "scheme_name": app.scheme.name if app.scheme else "Unknown",
            "application_ref_id": app.application_ref_id,
            "status": app.status,
            "created_at": app.created_at.isoformat(),
            "last_updated": app.last_updated.isoformat()
        })
    return results

@router.put("/{app_id}/status")
def update_application_status(app_id: int, req: ApplicationStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    app = db.query(UserApplication).filter(UserApplication.id == app_id, UserApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = req.status
    app.last_updated = datetime.utcnow()
    db.commit()
    return {"message": "Status updated successfully", "status": app.status}
