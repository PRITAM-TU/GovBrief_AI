"""
GovBrief AI — Alerts Router
Deadline alerts and notifications
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.alert import Alert
from models.scheme import Scheme
from models.user import User
from models.document import Document
from routers.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/upcoming")
def get_upcoming_alerts(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get schemes with deadlines within `days` days."""
    cutoff = datetime.utcnow() + timedelta(days=days)
    upcoming = (
        db.query(Scheme)
        .filter(Scheme.is_active == True, Scheme.deadline != None, Scheme.deadline <= cutoff, Scheme.deadline >= datetime.utcnow())
        .order_by(Scheme.deadline)
        .all()
    )
    alerts = []
    for scheme in upcoming:
        days_remaining = (scheme.deadline - datetime.utcnow()).days
        urgency = "critical" if days_remaining <= 5 else "warning" if days_remaining <= 15 else "info"
        alerts.append({
            "scheme_id": scheme.id,
            "scheme_name": scheme.name,
            "deadline": scheme.deadline.isoformat(),
            "days_remaining": days_remaining,
            "urgency": urgency,
            "subsidy_amount": scheme.subsidy_amount,
            "category": scheme.category,
        })
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/my-alerts")
def my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": a.id,
            "message": a.message,
            "alert_type": a.alert_type,
            "is_read": a.is_read,
            "days_remaining": a.days_remaining,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.post("/mark-read/{alert_id}")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"success": True}


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Dashboard statistics."""
    total_schemes = db.query(Scheme).filter(Scheme.is_active == True).count()
    expiring_soon = db.query(Scheme).filter(
        Scheme.is_active == True,
        Scheme.deadline != None,
        Scheme.deadline <= datetime.utcnow() + timedelta(days=30),
        Scheme.deadline >= datetime.utcnow(),
    ).count()
    total_docs = db.query(Document).filter(Document.user_id == current_user.id).count()
    return {
        "total_active_schemes": total_schemes,
        "expiring_in_30_days": expiring_soon,
        "total_states_covered": 28,
        "total_documents": total_docs,
    }
