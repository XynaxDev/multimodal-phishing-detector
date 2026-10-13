"""PH5 Multimodal Phishing API — application entrypoint.

Run locally (from the ``backend/`` folder):
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.deps import get_llm, get_registry
from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.services.model_registry import DEVICE

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("ph5")


@asynccontextmanager
async def lifespan(_: FastAPI):
    llm = get_llm()
    logger.info("Starting %s v%s (%s) on %s", settings.app_name, settings.app_version, settings.environment, DEVICE)
    logger.info("LLM: %s", f"groq / {llm.model}" if llm.enabled else "disabled (no GROQ_API_KEY) -> fallback explanations")
    if settings.preload_models:
        # Load in the background so the port binds immediately (health checks pass while models warm up).
        threading.Thread(target=get_registry().preload, name="model-preload", daemon=True).start()
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Multimodal phishing detection API. Classifies messages (BERT), URLs (DistilBERT) and "
        "screenshots (ResNet-50), fuses the signals, and explains results with a Groq-hosted LLM."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

from app.core.rate_limit import SecurityHeadersMiddleware, SlidingWindowRateLimiter

origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials="*" not in origins,  # credentials are not allowed with wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "Retry-After"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(SecurityHeadersMiddleware)

if settings.rate_limit_enabled:
    app.add_middleware(
        SlidingWindowRateLimiter,
        default_limit=settings.rate_limit_per_minute,
        ai_limit=settings.rate_limit_ai_per_minute,
    )


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter() - start) * 1000:.1f}ms"
    return response


from app.api.routes.legacy import legacy_router

register_exception_handlers(app)
app.include_router(api_router, prefix=settings.api_prefix)
app.include_router(legacy_router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "api": settings.api_prefix,
        "health": f"{settings.api_prefix}/health",
    }
