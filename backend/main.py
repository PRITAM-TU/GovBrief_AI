"""GovBrief AI — FastAPI Application Entry Point"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
from config import settings
from database import init_db
from routers.auth import router as auth_router
from routers.schemes import router as schemes_router
from routers.ocr import router as ocr_router
from routers.pdf_routes import router as pdf_router
from routers.forms import router as forms_router
from routers.tts_routes import router as tts_router
from routers.vault import router as vault_router
from routers.alerts import router as alerts_router
from routers.payouts import router as payouts_router
from routers.chatbot import router as chatbot_router
from routers.applications import router as applications_router
from routers.journey import router as journey_router
from routers.agent import router as agent_router
from routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from database import SessionLocal
        from models.scheme import Scheme
        from models.application import UserApplication
        db = SessionLocal()
        count = db.query(Scheme).count()
        db.close()
        if count == 0:
            import subprocess, sys
            subprocess.run([sys.executable, "seed.py"], check=False)
    except Exception:
        pass
    yield


app = FastAPI(
    title="GovBrief AI",
    description="Smart Subsidies & Policy Navigator for Indian Farmers",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(ocr_router)
app.include_router(pdf_router)
app.include_router(forms_router)
app.include_router(tts_router)
app.include_router(vault_router)
app.include_router(alerts_router)
app.include_router(payouts_router)
app.include_router(chatbot_router)
app.include_router(applications_router)
app.include_router(journey_router)
app.include_router(agent_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
