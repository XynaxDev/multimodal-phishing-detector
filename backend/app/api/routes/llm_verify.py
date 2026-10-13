"""Bring-your-own-key verification: list usable models and test a key/model pair live.

Keys are used only for the outgoing provider request and are never logged or stored.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import requests
from fastapi import APIRouter, Header, HTTPException, Query

from app.services.llm import DEFAULT_PROVIDER_URLS

router = APIRouter(prefix="/llm", tags=["LLM"])

_TIMEOUT = 25
# Name fragments of non-chat models that must not be offered for text analysis.
_NON_CHAT = (
    "whisper", "tts", "orpheus", "embed", "moderation", "image", "dall-e", "realtime",
    "audio", "transcribe", "guard", "babbage", "davinci", "search", "diarize", "live",
)


def _is_chat_model(model_id: str) -> bool:
    low = model_id.lower()
    return not any(tok in low for tok in _NON_CHAT)


def _base(provider: str, base_url: Optional[str]) -> str:
    if base_url and base_url.strip():
        return base_url.strip().rstrip("/")
    if provider not in DEFAULT_PROVIDER_URLS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{provider}'.")
    return DEFAULT_PROVIDER_URLS[provider].rstrip("/")


def _auth(key: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _provider_error(resp: requests.Response) -> str:
    try:
        err = resp.json().get("error", resp.json())
        msg = err.get("message") if isinstance(err, dict) else str(err)
    except Exception:
        msg = resp.text
    return (msg or f"HTTP {resp.status_code}")[:240]


@router.get("/models", summary="List chat models available to your API key")
def list_models(
    provider: str = Query(...),
    api_key: str = Header(..., alias="X-LLM-Api-Key"),
    base_url: Optional[str] = Header(None, alias="X-LLM-Base-Url"),
):
    provider = provider.lower().strip()
    base = _base(provider, base_url)
    try:
        r = requests.get(f"{base}/models", headers=_auth(api_key), timeout=_TIMEOUT)
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach the provider.")
    if r.status_code in (401, 403):
        raise HTTPException(status_code=401, detail="The provider rejected this API key.")
    if not r.ok:
        raise HTTPException(status_code=502, detail=_provider_error(r))

    models: List[dict] = []
    for m in r.json().get("data", []):
        mid = str(m.get("id", "")).replace("models/", "", 1)
        if not mid or not _is_chat_model(mid):
            continue
        entry = {"id": mid, "free": None}
        if provider == "openrouter":
            pricing = m.get("pricing") or {}
            try:
                entry["free"] = float(pricing.get("prompt", 1)) == 0 and float(pricing.get("completion", 1)) == 0
            except (TypeError, ValueError):
                entry["free"] = False
        models.append(entry)
    models.sort(key=lambda x: x["id"])
    return {"provider": provider, "models": models}


@router.post("/verify", summary="Test that your API key can run a given model")
def verify(
    provider: str = Query(...),
    model: str = Query(...),
    api_key: str = Header(..., alias="X-LLM-Api-Key"),
    base_url: Optional[str] = Header(None, alias="X-LLM-Base-Url"),
):
    provider = provider.lower().strip()
    base = _base(provider, base_url)
    body = {"model": model, "messages": [{"role": "user", "content": "Reply with OK"}]}
    # Newer OpenAI / reasoning models reject max_tokens; give reasoning room to finish.
    body["max_completion_tokens" if provider == "openai" else "max_tokens"] = 64
    try:
        r = requests.post(f"{base}/chat/completions", headers=_auth(api_key), json=body, timeout=_TIMEOUT + 20)
    except requests.RequestException:
        return {"ok": False, "status": 0, "reason": "Could not reach the provider."}

    if r.ok:
        try:
            payload = r.json()
            if isinstance(payload, dict) and "error" in payload:
                err_msg = payload["error"].get("message", "Upstream error.")
                return {"ok": False, "status": 502, "reason": f"Model error: {err_msg[:200]}"}
        except Exception:
            pass
        return {"ok": True, "status": 200, "reason": "Key and model verified."}

    prov_err = _provider_error(r)
    if r.status_code == 401:
        if "User not found" in prov_err:
            reason = (
                "OpenRouter rejected this key ('User not found'). Note: This key is an account "
                "Management/Provisioning key, which cannot be used for model inference. "
                "Please generate a standard API key on openrouter.ai/keys."
            )
        else:
            reason = "The provider rejected this API key."
    elif r.status_code == 403:
        reason = "This key is not permitted to use this model."
    elif r.status_code == 404:
        reason = "Model not found or not available to this key."
    elif r.status_code == 429:
        reason = "Key is valid but currently rate-limited or out of quota/credits."
    else:
        reason = prov_err
    return {"ok": False, "status": r.status_code, "reason": reason}
