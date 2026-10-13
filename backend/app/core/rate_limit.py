"""Production-ready security middlewares: Sliding Window Rate Limiting and Security Headers.

Protects against:
- Brute-force requests and automated DDoS attacks.
- Groq LLM API quota exhaustion on free tiers.
- MIME-type sniffing and clickjacking.
Exempts health probes and OpenAPI documentation.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Tuple

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        default_limit: int = 60,
        ai_limit: int = 30,
        window_seconds: int = 60,
        exempt_paths: Tuple[str, ...] = (
            "/api/v1/health",
            "/health",
            "/api/v1/status",
            "/status",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/",
        ),
    ):
        super().__init__(app)
        self.default_limit = default_limit
        self.ai_limit = ai_limit
        self.window = window_seconds
        self.exempt_paths = exempt_paths
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()
        self._last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        # Check standard reverse-proxy headers (Render, Cloudflare, Vercel)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Always permit health checks, uptime monitors, and API documentation
        if any(path == ep or path.startswith(ep.rstrip("/") + "/") for ep in self.exempt_paths):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()

        # Exempt callers who supply their own LLM API key (BYOK) from shared community IP quotas
        has_custom_key = bool(
            request.headers.get("x-llm-api-key", "").strip()
            or request.headers.get("x-api-key", "").strip()
        )
        if has_custom_key:
            return await call_next(request)

        # Check if the shared provider is currently in dynamic cooldown
        if "/chat" in path:
            try:
                from app.api.deps import get_llm
                llm = get_llm()
                rem = llm.get_cooldown_remaining("groq")
                if rem is not None and rem > 0:
                    sec = max(1, int(round(rem)))
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": "Rate limit exceeded",
                            "status": 429,
                            "detail": f"Groq free tier rate limit active. Provider cooldown: {sec}s.",
                            "retry_after": sec,
                            "cooldown_seconds": sec,
                            "provider": "groq",
                            "byok_supported": True,
                            "suggestion": "You can bypass community cooldowns by adding your own API key in request headers (X-LLM-Api-Key) or in the API Docs.",
                        },
                        headers={"Retry-After": str(sec)},
                    )
            except Exception:
                pass

        # Separate quota for AI endpoints (chat / analyze) vs lighter GET requests
        limit = self.ai_limit if ("/chat" in path or "/analyze" in path) else self.default_limit

        with self._lock:
            # Purge stale tracking keys periodically every 60 seconds
            if now - self._last_cleanup > 60:
                cutoff = now - self.window
                for ip in list(self._requests.keys()):
                    self._requests[ip] = [t for t in self._requests[ip] if t > cutoff]
                    if not self._requests[ip]:
                        del self._requests[ip]
                self._last_cleanup = now

            cutoff = now - self.window
            timestamps = [t for t in self._requests[client_ip] if t > cutoff]
            self._requests[client_ip] = timestamps

            if len(timestamps) >= limit:
                retry_after = max(1, int(self.window - (now - timestamps[0])))
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "status": 429,
                        "detail": f"Community free-tier rate limit reached ({limit} requests/min). Please cool down for {retry_after}s.",
                        "retry_after": retry_after,
                        "cooldown_seconds": retry_after,
                        "provider": "community",
                        "byok_supported": True,
                        "suggestion": "Bring your own API key (Groq, Gemini free tier, OpenAI, or OpenRouter) via 'X-LLM-Api-Key' to bypass all limits.",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            self._requests[client_ip].append(now)

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces standard HTTP security response headers."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
