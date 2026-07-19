"""
GovBrief AI — Schemes Router
Handles scheme listing, filtering, AI matching, and detail views
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from models.scheme import Scheme
from models.user import User
from services.ai_service import chat_scheme_matcher
from services.ml_recommender import recommend_schemes
from routers.auth import get_current_user

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


class ChatMessage(BaseModel):
    message: str
    conversation_history: list = []
    farmer_profile: dict = {}

class MatchRequest(BaseModel):
    farmer_profile: dict
    state: Optional[str] = None
    district: Optional[str] = None


def scheme_to_dict(s: Scheme) -> dict:
    return {
        "id": s.id, "name": s.name, "short_name": s.short_name,
        "description": s.description, "category": s.category,
        "ministry": s.ministry, "benefits": s.benefits,
        "subsidy_amount": s.subsidy_amount, "max_benefit": s.max_benefit,
        "eligibility": s.eligibility, "min_land": s.min_land,
        "max_land": s.max_land, "max_income": s.max_income,
        "farmer_category": s.farmer_category,
        "documents_needed": s.documents_needed,
        "deadline": s.deadline.isoformat() if s.deadline else None,
        "is_active": s.is_active,
        "applicable_states": s.applicable_states,
        "apply_url": s.apply_url, "helpline": s.helpline,
    }


@router.get("/list")
def list_schemes(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(Scheme).filter(Scheme.is_active == True)
    if state:
        query = query.filter(
            (Scheme.applicable_states == "All") | (Scheme.applicable_states.contains(state))
        )
    if category:
        query = query.filter(Scheme.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            Scheme.name.ilike(f"%{search}%") | Scheme.description.ilike(f"%{search}%")
        )
    total = query.count()
    schemes = query.offset(offset).limit(limit).all()
    return {"total": total, "schemes": [scheme_to_dict(s) for s in schemes]}


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    from sqlalchemy import distinct
    cats = db.query(distinct(Scheme.category)).all()
    return [c[0] for c in cats if c[0]]


@router.get("/{scheme_id}")
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme_to_dict(scheme)


@router.post("/match")
def match_schemes(req: MatchRequest, db: Session = Depends(get_db)):
    """ML-powered scheme matching based on farmer profile."""
    # The ML recommender internally evaluates against all active schemes
    matched = recommend_schemes(req.farmer_profile)
    
    # Just for metrics count
    total_active = db.query(Scheme).filter(Scheme.is_active == True).count()
    return {"matched_schemes": matched, "total_analyzed": total_active}


@router.post("/chat")
def chat_with_ai(msg: ChatMessage):
    """Conversational scheme matcher."""
    result = chat_scheme_matcher(msg.message, msg.conversation_history, msg.farmer_profile)
    return result
