"""Health and status endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_llm, get_ocr, get_registry
from app.core.config import Settings, get_settings
from app.schemas import HealthResponse, StatusResponse
from app.services.llm import LLMService
from app.services.model_registry import DEVICE, ModelRegistry
from app.services.ocr import OCRService

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="Liveness probe")
async def health(settings: Settings = Depends(get_settings)):
    """Cheap check that the server is up. Does not load any model."""
    return {"status": "ok", "version": settings.app_version}


@router.get("/status", response_model=StatusResponse, summary="Model and LLM status")
async def status(
    settings: Settings = Depends(get_settings),
    registry: ModelRegistry = Depends(get_registry),
    llm: LLMService = Depends(get_llm),
    ocr: OCRService = Depends(get_ocr),
):
    """Shows which classifiers are loaded and whether the Groq LLM is configured."""
    return {
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.environment,
        "device": str(DEVICE),
        "models": registry.status(),
        "llm": {
            "provider": settings.llm_provider,
            "model": llm.model,
            "configured": llm.enabled,
            "use_llm_intent": settings.use_llm_intent,
        },
        "ocr_enabled": ocr.enabled,
    }
