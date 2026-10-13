"""Detection endpoints: text, URL, image and multimodal fusion."""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.api.deps import extract_llm_config, get_analysis_service
from app.core.config import get_settings
from app.schemas import (
    AnalysisResponse,
    CustomLLMConfig,
    ErrorResponse,
    MultimodalResponse,
    TextAnalysisRequest,
    UrlAnalysisRequest,
)
from app.services.analysis import AnalysisService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

_ERRORS = {
    413: {"model": ErrorResponse, "description": "Upload too large"},
    415: {"model": ErrorResponse, "description": "Unsupported file type"},
    422: {"model": ErrorResponse, "description": "Invalid input"},
    429: {"model": ErrorResponse, "description": "Rate limit exceeded / Cooldown active"},
    503: {"model": ErrorResponse, "description": "Model not available"},
}


async def read_upload(file: Optional[UploadFile]) -> tuple[Optional[bytes], Optional[str]]:
    """Read at most (limit + 1) bytes so oversized uploads are rejected without buffering them fully."""
    if file is None or not file.filename:
        return None, None
    limit = get_settings().max_upload_bytes
    data = await file.read(limit + 1)
    return data, file.content_type


@router.post("/text", response_model=AnalysisResponse, responses=_ERRORS, summary="Analyse a message")
async def analyze_text(
    body: TextAnalysisRequest,
    svc: AnalysisService = Depends(get_analysis_service),
    llm_cfg: CustomLLMConfig = Depends(extract_llm_config),
):
    """Classify an email / SMS / chat message with the fine-tuned BERT model."""
    cfg = CustomLLMConfig(
        provider=body.llm_provider or llm_cfg.provider,
        api_key=body.llm_api_key or llm_cfg.api_key,
        model=body.llm_model or llm_cfg.model,
        base_url=body.llm_base_url or llm_cfg.base_url,
    )
    return await run_in_threadpool(svc.analyze_text, body.text, cfg)


@router.post("/url", response_model=AnalysisResponse, responses=_ERRORS, summary="Analyse a URL")
async def analyze_url(
    body: UrlAnalysisRequest,
    svc: AnalysisService = Depends(get_analysis_service),
    llm_cfg: CustomLLMConfig = Depends(extract_llm_config),
):
    """Classify a URL as benign, phishing or malware with the DistilBERT model."""
    cfg = CustomLLMConfig(
        provider=body.llm_provider or llm_cfg.provider,
        api_key=body.llm_api_key or llm_cfg.api_key,
        model=body.llm_model or llm_cfg.model,
        base_url=body.llm_base_url or llm_cfg.base_url,
    )
    return await run_in_threadpool(svc.analyze_url, body.url, cfg)


@router.post("/image", response_model=AnalysisResponse, responses=_ERRORS, summary="Analyse a screenshot")
async def analyze_image(
    file: UploadFile = File(..., description="Screenshot (PNG/JPEG/WEBP, max 10 MB)"),
    llm_provider: Optional[str] = Form(None),
    llm_api_key: Optional[str] = Form(None),
    llm_model: Optional[str] = Form(None),
    llm_base_url: Optional[str] = Form(None),
    svc: AnalysisService = Depends(get_analysis_service),
    llm_cfg: CustomLLMConfig = Depends(extract_llm_config),
):
    """Classify a webpage screenshot with ResNet-50. Optional OCR text is returned when available."""
    data, content_type = await read_upload(file)
    cfg = CustomLLMConfig(
        provider=llm_provider or llm_cfg.provider,
        api_key=llm_api_key or llm_cfg.api_key,
        model=llm_model or llm_cfg.model,
        base_url=llm_base_url or llm_cfg.base_url,
    )
    return await run_in_threadpool(svc.analyze_image, data, content_type, cfg)


@router.post("/multimodal", response_model=MultimodalResponse, responses=_ERRORS, summary="Fuse text + URL + image")
async def analyze_multimodal(
    text: Optional[str] = Form(None, description="Message body"),
    url: Optional[str] = Form(None, description="URL"),
    file: Optional[UploadFile] = File(None, description="Screenshot"),
    llm_provider: Optional[str] = Form(None),
    llm_api_key: Optional[str] = Form(None),
    llm_model: Optional[str] = Form(None),
    llm_base_url: Optional[str] = Form(None),
    svc: AnalysisService = Depends(get_analysis_service),
    llm_cfg: CustomLLMConfig = Depends(extract_llm_config),
):
    """Run every provided modality and combine them with weighted late fusion. At least one input is required."""
    data, content_type = await read_upload(file)
    cfg = CustomLLMConfig(
        provider=llm_provider or llm_cfg.provider,
        api_key=llm_api_key or llm_cfg.api_key,
        model=llm_model or llm_cfg.model,
        base_url=llm_base_url or llm_cfg.base_url,
    )
    return await run_in_threadpool(svc.analyze_multimodal, text, url, data, content_type, cfg)
