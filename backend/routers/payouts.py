"""
GovBrief AI — Payouts Router (Crowdsourced Verification)
"""
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json

from database import get_db
from models.alert import PayoutVerification
from models.scheme import Scheme
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/payouts", tags=["Payout Verifier"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()


class PayoutCreate(BaseModel):
    scheme_id: int
    amount_received: str
    district: str
    state: str
    comment: Optional[str] = None


@router.get("/list")
def list_payouts(
    scheme_id: Optional[int] = None,
    state: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(PayoutVerification).order_by(PayoutVerification.created_at.desc())
    if scheme_id:
        query = query.filter(PayoutVerification.scheme_id == scheme_id)
    if state:
        query = query.filter(PayoutVerification.state == state)
    payouts = query.limit(limit).all()
    return [
        {
            "id": p.id,
            "scheme_id": p.scheme_id,
            "amount_received": p.amount_received,
            "district": p.district,
            "state": p.state,
            "comment": p.comment,
            "is_verified": p.is_verified,
            "verifier_name": p.verifier_name,
            "created_at": p.created_at.isoformat(),
        }
        for p in payouts
    ]


@router.post("/submit")
async def submit_payout(
    data: PayoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheme = db.query(Scheme).filter(Scheme.id == data.scheme_id).first()
    if not scheme:
        from fastapi import HTTPException
        raise HTTPException(404, "Scheme not found")

    payout = PayoutVerification(
        scheme_id=data.scheme_id, user_id=current_user.id,
        amount_received=data.amount_received, district=data.district,
        state=data.state, comment=data.comment,
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)

    # Broadcast to WebSocket clients
    broadcast_data = {
        "type": "new_payout",
        "scheme_name": scheme.name,
        "district": data.district,
        "state": data.state,
        "amount_received": data.amount_received,
        "comment": data.comment,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(broadcast_data)
    return {"success": True, "payout_id": payout.id}


@router.websocket("/ws")
async def payout_websocket(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(ws)
