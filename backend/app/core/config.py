"""Centralised application settings.

All configuration is read from environment variables (or ``backend/.env`` when
running locally). On Render / any other host, set the same variables in the
service dashboard instead of shipping a ``.env`` file.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (this file lives in backend/app/core/config.py)
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- App -------------------------------------------------------------
    app_name: str = "PH5 Multimodal Phishing API"
    app_version: str = "2.0.0"
    environment: str = "development"  # development | production
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"
    # Comma-separated list of allowed origins, or "*" to allow everything.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Rate limiting (per-IP sliding window)
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60
    rate_limit_ai_per_minute: int = 30

    # ---- Model artifacts ---------------------------------------------------
    # Relative paths are resolved against the backend/ directory.
    text_model_dir: str = "models/text/bert_finetuned"
    url_model_dir: str = "models/url/distilbert_url"
    image_model_path: str = "models/image/best_model.pth"
    # Optional: Hugging Face Hub repo holding the same layout
    # (text/bert_finetuned, url/distilbert_url, image/best_model.pth).
    # When set and the local files are missing, they are downloaded on startup.
    hf_model_repo: str = ""
    hf_token: str = ""
    # Load all models in the background right after startup (recommended in prod).
    preload_models: bool = False

    # ---- Inference ---------------------------------------------------------
    max_upload_mb: int = 10
    max_text_chars: int = 20000
    fusion_alpha: float = 0.80
    img_size: int = 224

    # ---- OCR (optional) ----------------------------------------------------
    use_ocr: bool = True
    tesseract_cmd: str = ""  # leave empty to use tesseract from PATH
    n8n_ocr_endpoint: str = ""
    n8n_timeout: int = 5

    # ---- LLM (Groq) --------------------------------------------------------
    llm_provider: str = "groq"  # groq | none
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout: int = 30
    # Optional reasoning effort for reasoning models (e.g. "none", "low", "default").
    groq_reasoning_effort: str = ""
    llm_max_tokens: int = 1024
    llm_temperature: float = 0.2
    use_llm_intent: bool = False
    short_url_threshold: int = 64

    # ---- Helpers -----------------------------------------------------------
    @property
    def cors_origin_list(self) -> List[str]:
        raw = (self.cors_origins or "").strip()
        if raw == "*":
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    @property
    def llm_enabled(self) -> bool:
        return self.llm_provider.lower() == "groq" and bool(self.groq_api_key.strip())

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @staticmethod
    def resolve_path(value: str) -> Path:
        p = Path(value).expanduser()
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
