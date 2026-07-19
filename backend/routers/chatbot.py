"""
GovBrief AI — Chatbot Router
Provides RAG-powered conversational AI for government policy queries.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from services.chatbot_service import (
    search_db_schemes,
    search_web_policy,
    build_context,
    chat_with_context,
)

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    language: str = "en"
    farmer_profile: Optional[dict] = {}


@router.post("/chat")
def chatbot_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint. Performs RAG:
    1. Search DB schemes for relevant policies
    2. Fetch live data from government websites
    3. Build context and query Gemini
    """
    # Step 1: DB keyword search
    db_results = search_db_schemes(req.message, db)

    # Step 2: Live web policy search
    web_results = search_web_policy(req.message)

    # Step 3: Build context string
    context = build_context(db_results, web_results)

    # Step 4: Generate AI response
    history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    result = chat_with_context(
        message=req.message,
        history=history_dicts,
        context=context,
        language=req.language,
        farmer_profile=req.farmer_profile or {},
    )

    return {
        "reply": result["reply"],
        "sources": result["sources"],
        "suggested_questions": result["suggested_questions"],
        "context_used": len(db_results) + len(web_results),
    }


@router.get("/search-policy")
def search_policy(q: str, db: Session = Depends(get_db)):
    """Quick policy search endpoint for autocomplete / suggestions."""
    db_results = search_db_schemes(q, db)
    return {"results": db_results, "count": len(db_results)}


@router.get("/starter-questions")
def starter_questions():
    """Return starter questions shown when the chatbot first opens."""
    return {
        "questions": [
            "PM-KISAN mein registration kaise karein?",
            "What documents do I need for crop insurance?",
            "Solar pump subsidy ke liye kaun eligible hai?",
            "How to apply for Kisan Credit Card?",
            "मेरे लिए कौन सी सरकारी योजना सही है?",
        ]
    }
