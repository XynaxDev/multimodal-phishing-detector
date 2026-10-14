"""Bring-your-own-key verification: list usable models and test a key/model pair live.

Keys are used only for the outgoing provider request and are never logged or stored.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import requests
from fastapi import APIRouter, Header, HTTPException, Query

from app.services.llm import DEFAULT_PROVIDER_URLS

router = APIRouter(prefix="/llm", tags=["LLM"])

_TIMEOUT = 45
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
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        if isinstance(data, dict):
            err = data.get("error", data)
            if isinstance(err, dict):
                msg = err.get("message") or err.get("detail") or str(err)
            else:
                msg = str(err)
        else:
            msg = str(data)
    except Exception:
        msg = resp.text
    clean_msg = (msg or f"HTTP {resp.status_code}").strip()
    if "experiencing high demand" in clean_msg.lower() or "unavailable" in clean_msg.lower():
        return "This model is currently experiencing high demand upstream. Spikes in demand are usually temporary. Please try another model or retry shortly."
    return clean_msg[:240]


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
        raise HTTPException(status_code=502, detail="Could not reach the provider. Request timed out or provider is unreachable.")
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
    # Newer OpenAI / reasoning / Gemini models need enough token allowance to complete reasoning.
    body["max_completion_tokens" if provider == "openai" else "max_tokens"] = 256
    try:
        r = requests.post(f"{base}/chat/completions", headers=_auth(api_key), json=body, timeout=_TIMEOUT + 25)
    except requests.RequestException:
        return {"ok": False, "status": 0, "reason": "Could not reach the provider within timeout. Network may be slow or provider unresponsive."}

    if r.ok:
        try:
            payload = r.json()
            if isinstance(payload, list) and len(payload) > 0:
                payload = payload[0]
            if isinstance(payload, dict) and "error" in payload:
                err_val = payload["error"]
                err_msg = err_val.get("message", "Upstream error.") if isinstance(err_val, dict) else str(err_val)
                if "experiencing high demand" in err_msg.lower() or "unavailable" in err_msg.lower():
                    err_msg = "This model is currently experiencing high demand upstream. Please try another model or retry shortly."
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
    elif r.status_code == 503 or "experiencing high demand" in prov_err.lower():
        reason = "This model is currently experiencing high demand upstream. Spikes in demand are usually temporary. Please try another model or retry shortly."
    else:
        reason = prov_err
    return {"ok": False, "status": r.status_code, "reason": reason}
