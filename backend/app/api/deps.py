"""Service singletons and FastAPI dependency providers."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.services.analysis import AnalysisService
from app.services.inference import InferenceEngine
from app.services.llm import LLMService
from app.services.model_registry import ModelRegistry
from app.services.ocr import OCRService


@lru_cache
def get_registry() -> ModelRegistry:
    return ModelRegistry(get_settings())


@lru_cache
def get_llm() -> LLMService:
    return LLMService(get_settings())


@lru_cache
def get_ocr() -> OCRService:
    return OCRService(get_settings())


@lru_cache
def get_analysis_service() -> AnalysisService:
    settings = get_settings()
    engine = InferenceEngine(get_registry(), img_size=settings.img_size)
    return AnalysisService(settings, engine, get_ocr(), get_llm())


from typing import Optional
from fastapi import Header, Request
from app.schemas import CustomLLMConfig


def extract_llm_config(
    request: Request,
    provider: Optional[str] = Header(None, alias="X-LLM-Provider"),
    api_key: Optional[str] = Header(None, alias="X-LLM-Api-Key"),
    fallback_key: Optional[str] = Header(None, alias="X-Api-Key"),
    model: Optional[str] = Header(None, alias="X-LLM-Model"),
    base_url: Optional[str] = Header(None, alias="X-LLM-Base-Url"),
) -> CustomLLMConfig:
    key = api_key or fallback_key
    auth = request.headers.get("authorization", "")
    if not key and auth.lower().startswith("bearer ") and provider:
        key = auth[7:].strip()
    return CustomLLMConfig(
        provider=provider.lower().strip() if provider else None,
        api_key=key.strip() if key else None,
        model=model.strip() if model else None,
        base_url=base_url.strip() if base_url else None,
    )
