"""Conversational endpoint with automatic intent routing."""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.api.deps import extract_llm_config, get_analysis_service
from app.api.routes.analyze import _ERRORS, read_upload
from app.schemas import ChatResponse, CustomLLMConfig
from app.services.analysis import AnalysisService

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse, responses=_ERRORS, summary="Chat with auto-routing")
async def chat(
    query: str = Form("", description="User message. May contain a URL or a pasted email."),
    file: Optional[UploadFile] = File(None, description="Optional screenshot"),
    llm_provider: Optional[str] = Form(None),
    llm_api_key: Optional[str] = Form(None),
    llm_model: Optional[str] = Form(None),
    llm_base_url: Optional[str] = Form(None),
    svc: AnalysisService = Depends(get_analysis_service),
    llm_cfg: CustomLLMConfig = Depends(extract_llm_config),
):
    """Detects what the user wants (URL check, message check, screenshot check or plain chat)
    and runs the matching analysis. Supports custom BYO-LLM providers."""
    data, content_type = await read_upload(file)
    cfg = CustomLLMConfig(
        provider=llm_provider or llm_cfg.provider,
        api_key=llm_api_key or llm_cfg.api_key,
        model=llm_model or llm_cfg.model,
        base_url=llm_base_url or llm_cfg.base_url,
    )
    return await run_in_threadpool(svc.chat, query, data, content_type, cfg)
