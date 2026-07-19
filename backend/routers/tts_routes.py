"""
GovBrief AI — TTS Router
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.tts_service import generate_audio, get_scheme_audio_text, list_supported_languages
from config import settings

router = APIRouter(prefix="/api/tts", tags=["Text to Speech"])


class TTSRequest(BaseModel):
    text: str
    language: str = "hindi"

class SchemeAudioRequest(BaseModel):
    scheme_data: dict
    language: str = "hindi"


@router.get("/languages")
def get_languages():
    return list_supported_languages()


@router.post("/generate")
def generate_tts(req: TTSRequest):
    if len(req.text) > 2000:
        raise HTTPException(400, "Text too long. Maximum 2000 characters.")
    try:
        filename = generate_audio(req.text, req.language)
        return {"success": True, "filename": filename, "audio_url": f"/api/tts/audio/{filename}"}
    except Exception as e:
        raise HTTPException(500, f"TTS generation failed: {str(e)}")


@router.post("/scheme-audio")
def scheme_audio(req: SchemeAudioRequest):
    script = get_scheme_audio_text(req.scheme_data, req.language)
    try:
        filename = generate_audio(script, req.language)
        return {"success": True, "filename": filename, "audio_url": f"/api/tts/audio/{filename}", "script": script}
    except Exception as e:
        raise HTTPException(500, f"TTS generation failed: {str(e)}")


@router.get("/audio/{filename}")
def get_audio(filename: str):
    filepath = Path(settings.AUDIO_DIR) / filename
    if not filepath.exists():
        raise HTTPException(404, "Audio file not found")
    return FileResponse(str(filepath), media_type="audio/mpeg")
