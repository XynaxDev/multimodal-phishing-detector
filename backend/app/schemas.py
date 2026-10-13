"""Pydantic request/response schemas (shown in the OpenAPI docs at /docs)."""
from __future__ import annotations

from typing import Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Label = Literal["benign", "phishing", "malware"]


class CustomLLMConfig(BaseModel):
    provider: Optional[Literal["groq", "openai", "gemini", "openrouter", "custom"]] = Field(
        None, description="LLM provider: groq, openai, gemini, openrouter, or custom."
    )
    api_key: Optional[str] = Field(
        None, description="Your private API key. Never logged or stored. In-transit only."
    )
    model: Optional[str] = Field(
        None, description="Model identifier override (e.g. gemini-1.5-flash, gpt-4o-mini, qwen/qwen3.8-27b)."
    )
    base_url: Optional[str] = Field(
        None, description="Custom base URL for local or proxy models (e.g. http://localhost:11434/v1)."
    )


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Email / SMS / message body to analyse.",
                      examples=["Your account has been suspended. Verify now at http://secure-login.example"])
    llm_provider: Optional[str] = Field(None, description="Optional BYO-LLM provider: groq, gemini, openai, openrouter, custom")
    llm_api_key: Optional[str] = Field(None, description="Optional BYO-LLM API key to bypass shared rate limits")
    llm_model: Optional[str] = Field(None, description="Optional model override")
    llm_base_url: Optional[str] = Field(None, description="Optional custom base URL")


class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="URL to classify.",
                     examples=["http://paypa1-account-verify.com/login"])
    llm_provider: Optional[str] = Field(None, description="Optional BYO-LLM provider")
    llm_api_key: Optional[str] = Field(None, description="Optional BYO-LLM API key")
    llm_model: Optional[str] = Field(None, description="Optional model override")
    llm_base_url: Optional[str] = Field(None, description="Optional custom base URL")


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    mode: Literal["text", "url", "image", "fusion"]
    label: Label = Field(..., description="Final verdict from the classifier (or fusion layer).")
    phishing_score: float = Field(..., ge=0, le=1, description="Probability the input is malicious.")
    probs: Dict[str, float] = Field(..., description="Per-class probabilities.")
    explanation: str
    explanation_source: Literal["llm", "fallback"]
    latency_ms: float
    url: Optional[str] = None
    ocr: Optional[str] = None
    intent: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    cooldown_remaining: Optional[float] = None


class FusionSignals(BaseModel):
    text: Optional[float] = None
    url: Optional[float] = None
    img: Optional[float] = None
    ocr: Optional[float] = None


class MultimodalResponse(AnalysisResponse):
    signals: FusionSignals
    raw: Dict[str, Optional[Dict[str, float]]]


class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    intent: Literal["chat", "url_check", "text_message", "image_check"]
    reply: Optional[str] = Field(None, description="Present when intent is 'chat'.")
    reply_source: Optional[Literal["llm", "fallback"]] = None
    label: Optional[Label] = None
    phishing_score: Optional[float] = None
    probs: Optional[Dict[str, float]] = None
    explanation: Optional[str] = None
    latency_ms: float
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    cooldown_remaining: Optional[float] = None


class ModelStatus(BaseModel):
    loaded: bool
    available: bool
    error: Optional[str] = None


class LLMStatus(BaseModel):
    provider: str
    model: str
    configured: bool
    use_llm_intent: bool


class StatusResponse(BaseModel):
    status: Literal["ok"]
    version: str
    environment: str
    device: str
    models: Dict[str, ModelStatus]
    llm: LLMStatus
    ocr_enabled: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str


class ErrorResponse(BaseModel):
    error: str
    status: int
    detail: Optional[str] = None
    retry_after: Optional[int] = None
    cooldown_seconds: Optional[int] = None
    provider: Optional[str] = None
    byok_supported: Optional[bool] = None
    suggestion: Optional[str] = None
