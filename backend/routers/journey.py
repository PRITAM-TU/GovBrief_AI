"""
GovBrief AI — Scheme Journey Router
Generates AI-powered step-by-step visual journey for any government scheme.
"""
import base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.scheme import Scheme
from services.journey_service import generate_scheme_journey
from routers.schemes import scheme_to_dict
from config import settings

router = APIRouter(prefix="/api/journey", tags=["Scheme Journey"])

IMAGE_MODEL = "nano-banana-pro-preview"

# Lazy-load new genai client
_img_client = None
def _get_img_client():
    global _img_client
    if _img_client is None:
        from google import genai
        _img_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _img_client


class JourneyRequest(BaseModel):
    scheme_id: Optional[int] = None
    scheme_name: Optional[str] = None
    scheme_data: Optional[dict] = None


class ImageRequest(BaseModel):
    prompt: str
    step_number: Optional[int] = None


@router.post("/generate")
def generate_journey(req: JourneyRequest, db: Session = Depends(get_db)):
    """Generate a full step-by-step AI journey for a government scheme."""
    scheme_dict = {}

    if req.scheme_id:
        scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        scheme_dict = scheme_to_dict(scheme)
    elif req.scheme_data:
        scheme_dict = req.scheme_data
    elif req.scheme_name:
        scheme_dict = {"name": req.scheme_name}
    else:
        raise HTTPException(status_code=400, detail="Provide scheme_id, scheme_name, or scheme_data")

    journey = generate_scheme_journey(scheme_dict)
    return {"journey": journey, "scheme": scheme_dict}


@router.post("/image")
def generate_step_image(req: ImageRequest):
    """
    Generate a scene illustration using nano-banana-pro-preview with fallback chain.
    Returns base64-encoded image or 429 with retry_after so frontend can show a styled placeholder.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="API key not configured")

    # Fallback chain — try each model in order
    IMAGE_MODELS = [
        "nano-banana-pro-preview",
        "gemini-3.1-flash-image-preview",
        "gemini-2.5-flash-image",
    ]

    from google import genai
    from google.genai import types
    import time, re

    client = _get_img_client()

    full_prompt = (
        f"{req.prompt}. "
        "Photorealistic, warm cinematic lighting, hopeful and dignified atmosphere, "
        "vibrant Indian rural landscape, high quality, no text overlays."
    )

    last_err = None
    retry_after = 0

    for model_name in IMAGE_MODELS:
        try:
            # If a retry delay was suggested, honour it (max 30s)
            if retry_after > 0:
                time.sleep(min(retry_after, 30))
                retry_after = 0

            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"]
                )
            )

            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    img_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                    return {
                        "image_b64": img_b64,
                        "mime_type": part.inline_data.mime_type,
                        "step_number": req.step_number,
                        "model_used": model_name,
                    }

        except Exception as e:
            err_str = str(e)
            last_err = err_str
            print(f"[journey/image] {model_name} failed: {err_str[:120]}")

            # Parse retry delay from error message e.g. "Please retry in 22.69s"
            match = re.search(r"retry in ([\d.]+)s", err_str)
            if match:
                retry_after = float(match.group(1))

            # Only continue to next model on rate-limit errors
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                continue
            # For non-quota errors break immediately
            break

    # All models exhausted — return 429 so frontend shows styled placeholder
    raise HTTPException(
        status_code=429,
        detail={"message": "Image quota exhausted on all models", "retry_after": int(retry_after or 30)}
    )



@router.get("/schemes")
def get_journey_schemes(db: Session = Depends(get_db)):
    """Get all active schemes for journey selection."""
    schemes = db.query(Scheme).filter(Scheme.is_active == True).limit(50).all()
    return {"schemes": [scheme_to_dict(s) for s in schemes]}
