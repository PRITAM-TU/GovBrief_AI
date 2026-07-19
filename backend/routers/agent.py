"""
GovBrief AI — Agent Router
Agentic Application Agent: starts and polls agent runs
"""
import uuid
import json
import threading
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.document import Document
from routers.auth import get_current_user
from services import agent_service
from services.form_service import FORM_TEMPLATES

router = APIRouter(prefix="/api/agent", tags=["Agent"])


class AgentRunRequest(BaseModel):
    scheme_key: str


@router.get("/schemes")
def list_agent_schemes():
    """Return available schemes the agent can apply to."""
    return [{"key": k, "name": v} for k, v in FORM_TEMPLATES.items()]


@router.post("/run")
def start_agent_run(
    req: AgentRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start an agentic application run. Returns run_id immediately."""
    if req.scheme_key not in FORM_TEMPLATES:
        raise HTTPException(400, f"Unknown scheme. Available: {list(FORM_TEMPLATES.keys())}")

    run_id = str(uuid.uuid4())
    agent_service.create_run(run_id)

    # Build farmer profile from user record
    farmer_profile = {
        "name": current_user.name or "",
        "phone": current_user.phone or "",
        "state": current_user.state or "",
        "district": current_user.district or "",
        "land_size": current_user.land_size,
        "income": current_user.income,
        "crop_types": current_user.crop_types or "",
        "farmer_category": current_user.farmer_category or "general",
    }

    # Load OCR documents
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    ocr_documents = []
    for doc in docs:
        ocr_documents.append({
            "doc_type": doc.doc_type,
            "extracted_fields": doc.extracted_fields,
            "extracted_text": doc.extracted_text,
        })

    # Run agent in background thread so API returns immediately
    def _run():
        agent_service.run_agent(
            run_id=run_id,
            scheme_key=req.scheme_key,
            farmer_profile=farmer_profile,
            ocr_documents=ocr_documents,
            farmer_name=current_user.name or "Farmer",
        )

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return {"run_id": run_id, "status": "started", "scheme": FORM_TEMPLATES[req.scheme_key]}


@router.get("/run/{run_id}")
def get_run_status(run_id: str):
    """Poll agent run status and steps."""
    run = agent_service.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return {
        "run_id": run_id,
        "status": run["status"],
        "steps": run["steps"],
        "result": run.get("result"),
        "error": run.get("error"),
    }


@router.get("/run/{run_id}/stream")
def stream_run(run_id: str):
    """SSE stream for live step updates."""
    import time

    def event_stream():
        seen_steps = 0
        max_polls = 120  # 60 seconds max
        polls = 0
        while polls < max_polls:
            run = agent_service.get_run(run_id)
            if not run:
                yield "data: {\"error\": \"run not found\"}\n\n"
                break
            steps = run["steps"]
            # Send new steps
            if len(steps) > seen_steps:
                for s in steps[seen_steps:]:
                    yield f"data: {json.dumps({'type': 'step', 'step': s})}\n\n"
                seen_steps = len(steps)
            # Send done/error
            if run["status"] in ("done", "error"):
                payload = {"type": "complete", "status": run["status"],
                           "result": run.get("result"), "error": run.get("error")}
                yield f"data: {json.dumps(payload)}\n\n"
                break
            time.sleep(0.5)
            polls += 1

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history")
def get_run_history():
    """Return list of all past runs."""
    return agent_service.list_runs()
