"""
GovBrief AI — Application Configuration
Reads settings from environment variables / .env file
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
import os
import dotenv

dotenv.load_dotenv()


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GovBrief AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./govbrief.db"

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # File paths
    UPLOAD_DIR: str = "uploads"
    GENERATED_DIR: str = "generated"
    AUDIO_DIR: str = "audio"

    # Tesseract
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    # Email (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    def ensure_dirs(self):
        """Create required directories if they don't exist."""
        for d in [self.UPLOAD_DIR, self.GENERATED_DIR, self.AUDIO_DIR]:
            Path(d).mkdir(parents=True, exist_ok=True)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
settings.ensure_dirs()
