"""Backward-compatibility router for existing frontend and legacy scripts.
Maps legacy /api/* endpoints to the new analysis service.
"""
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.api.deps import get_analysis_service, get_registry, get_llm
from app.services.analysis import AnalysisService
from app.services.model_registry import ModelRegistry
from app.services.llm import LLMService

legacy_router = APIRouter(prefix="/api", tags=["Legacy Compatibility"], include_in_schema=False)


class LegacyTextReq(BaseModel):
    text: str


class LegacyUrlReq(BaseModel):
    url: str


class LegacyChatReq(BaseModel):
    query: str
    image_path: Optional[str] = None


@legacy_router.get("/status")
async def legacy_status(
    registry: ModelRegistry = Depends(get_registry),
    llm: LLMService = Depends(get_llm),
):
    models = registry.status()
    cached = [k for k, v in models.items() if v["loaded"]]
    return {
        "ok": True,
        "models_cached": cached,
        "llm_provider": llm.settings.llm_provider,
        "use_llm_intent": llm.settings.use_llm_intent,
    }


@legacy_router.post("/text_check")
async def legacy_text_check(req: LegacyTextReq, svc: AnalysisService = Depends(get_analysis_service)):
    res = await run_in_threadpool(svc.analyze_text, req.text)
    return {
        "mode": "text",
        "probs": res["probs"],
        "label": res["label"].upper(),
        "explanation": res["explanation"],
        "phishing_score": res["phishing_score"],
    }


@legacy_router.post("/url_check")
async def legacy_url_check(req: LegacyUrlReq, svc: AnalysisService = Depends(get_analysis_service)):
    res = await run_in_threadpool(svc.analyze_url, req.url)
    return {
        "mode": "url",
        "url": req.url,
        "probs": res["probs"],
        "label": res["label"].upper(),
        "explanation": res["explanation"],
        "phishing_score": res["phishing_score"],
    }


@legacy_router.post("/image_check")
async def legacy_image_check(
    image_file: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    svc: AnalysisService = Depends(get_analysis_service),
):
    target_file = image_file or file
    if not target_file:
        return {"error": "no image provided"}
    data = await target_file.read()
    res = await run_in_threadpool(svc.analyze_image, data, target_file.content_type)
    return {
        "mode": "image",
        "probs": res["probs"],
        "ocr": res.get("ocr"),
        "label": res["label"].upper(),
        "explanation": res["explanation"],
        "phishing_score": res["phishing_score"],
    }


@legacy_router.post("/chat_multipart")
async def legacy_chat_multipart(
    query: str = Form(""),
    file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    svc: AnalysisService = Depends(get_analysis_service),
):
    target_file = file or image_file
    data = await target_file.read() if target_file else None
    content_type = target_file.content_type if target_file else None
    res = await run_in_threadpool(svc.chat, query, data, content_type)
    if "label" in res and isinstance(res["label"], str):
        res["label"] = res["label"].upper()
    return res


@legacy_router.post("/chat")
async def legacy_chat_json(req: LegacyChatReq, svc: AnalysisService = Depends(get_analysis_service)):
    res = await run_in_threadpool(svc.chat, req.query, None, None)
    if "label" in res and isinstance(res["label"], str):
        res["label"] = res["label"].upper()
    return res


@legacy_router.post("/fusion")
async def legacy_fusion(
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    svc: AnalysisService = Depends(get_analysis_service),
):
    target_file = image_file or file
    data = await target_file.read() if target_file else None
    content_type = target_file.content_type if target_file else None
    res = await run_in_threadpool(svc.analyze_multimodal, text, url, data, content_type)
    return {
        "fusion": {
            "fused_prob": res["phishing_score"],
            "label": 1 if res["label"].lower() == "phishing" else 0,
            **res.get("signals", {}),
        },
        "ocr": res.get("ocr"),
        "explanation": res.get("explanation"),
    }
