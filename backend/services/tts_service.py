"""
GovBrief AI — Text-to-Speech Service (gTTS)
Converts scheme summaries to audio in multiple Indian languages
"""
import hashlib
from pathlib import Path
from gtts import gTTS
from config import settings

SUPPORTED_LANGUAGES = {
    "hindi": "hi",
    "bengali": "bn",
    "odia": "or",
    "telugu": "te",
    "marathi": "mr",
    "english": "en",
    "tamil": "ta",
    "kannada": "kn",
    "gujarati": "gu",
    "punjabi": "pa",
}


def generate_audio(text: str, language: str = "hindi") -> str:
    """Convert text to speech and save as MP3. Returns filename."""
    lang_code = SUPPORTED_LANGUAGES.get(language.lower(), "hi")
    text_hash = hashlib.md5(f"{text}{lang_code}".encode()).hexdigest()[:12]
    filename = f"audio_{text_hash}.mp3"
    filepath = Path(settings.AUDIO_DIR) / filename

    if filepath.exists():
        return filename

    try:
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(str(filepath))
        return filename
    except Exception as e:
        # Fallback to English
        try:
            tts = gTTS(text=text, lang="en", slow=False)
            en_filename = f"audio_{text_hash}_en.mp3"
            tts.save(str(Path(settings.AUDIO_DIR) / en_filename))
            return en_filename
        except Exception:
            raise RuntimeError(f"TTS failed: {str(e)}")


def get_scheme_audio_text(scheme_data: dict, language: str = "hindi") -> str:
    """Format scheme info into a readable audio script."""
    name = scheme_data.get('name', 'Scheme')
    benefits = scheme_data.get('benefits', '')
    docs = scheme_data.get('documents_needed', 'Aadhaar Card, Land Record')
    deadline = scheme_data.get('deadline', 'Check official portal')

    if language == "hindi":
        return f"{name} के बारे में जानकारी। लाभ: {benefits}। आवेदन के लिए दस्तावेज: {docs}। अंतिम तिथि: {deadline}। अधिक जानकारी के लिए नजदीकी कृषि कार्यालय से संपर्क करें।"
    elif language == "bengali":
        return f"{name} সম্পর্কে তথ্য। সুবিধা: {benefits}। প্রয়োজনীয় কাগজপত্র: {docs}। শেষ তারিখ: {deadline}।"
    else:
        return f"Information about {name}. Benefits: {benefits}. Required documents: {docs}. Deadline: {deadline}. Contact your nearest agriculture office."


def list_supported_languages() -> list[dict]:
    return [{"key": k, "label": k.title(), "lang_code": v} for k, v in SUPPORTED_LANGUAGES.items()]
