"""Consistent JSON error responses: ``{"error": "...", "status": <code>}``."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("ph5.errors")


class ServiceError(Exception):
    """Base class for errors raised by the service layer."""

    status_code = 500

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BadInputError(ServiceError):
    status_code = 422


class UnsupportedMediaError(ServiceError):
    status_code = 415


class PayloadTooLargeError(ServiceError):
    status_code = 413


class ModelUnavailableError(ServiceError):
    status_code = 503


class LLMRateLimitError(ServiceError):
    status_code = 429

    def __init__(self, provider: str = "groq", retry_after: float = 15.0, is_custom: bool = False):
        sec = max(1, int(round(retry_after)))
        msg = (
            f"{provider.upper()} rate limit reached. Provider cooldown is {sec}s. "
            + ("Supply your own API key to bypass." if not is_custom else "Please try again later.")
        )
        super().__init__(msg)
        self.provider = provider
        self.retry_after = sec
        self.is_custom = is_custom


def _payload(message: str, status: int, **extra) -> dict:
    return {"error": message, "status": status, **extra}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(LLMRateLimitError)
    async def _llm_rate_limit(_: Request, exc: LLMRateLimitError):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "status": 429,
                "detail": exc.message,
                "retry_after": exc.retry_after,
                "cooldown_seconds": exc.retry_after,
                "provider": exc.provider,
                "byok_supported": True,
                "suggestion": "Bring your own API key (Groq, Gemini free tier, OpenAI, OpenRouter) via 'X-LLM-Api-Key' to bypass all limits.",
            },
            headers={"Retry-After": str(exc.retry_after)},
        )

    @app.exception_handler(ServiceError)
    async def _service_error(_: Request, exc: ServiceError):
        return JSONResponse(status_code=exc.status_code, content=_payload(exc.message, exc.status_code))

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(status_code=exc.status_code, content=_payload(message, exc.status_code))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(p) for p in err.get("loc", []) if p != "body"), "message": err.get("msg")}
            for err in exc.errors()
        ]
        first = details[0] if details else {"field": "", "message": "Invalid request"}
        message = f"{first['field']}: {first['message']}" if first["field"] else first["message"]
        return JSONResponse(status_code=422, content=_payload(message, 422, details=details))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content=_payload("Internal server error", 500))
