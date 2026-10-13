"""High-level analysis use-cases consumed by the API routes."""
from __future__ import annotations

import gc
import logging
import time
from io import BytesIO
from typing import Optional

from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.core.errors import BadInputError, PayloadTooLargeError, UnsupportedMediaError, ModelUnavailableError
from app.services.fusion import extract_single_url, fuse_all, url_multiclass_to_binary
from app.services.inference import InferenceEngine
from app.services.llm import LLMService
from app.services.ocr import OCRService
from app.schemas import CustomLLMConfig

logger = logging.getLogger("ph5.analysis")

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp", "image/gif"}
_EMAIL_HINTS = (
    "subject:", "dear ", "regards", "click here", "activate", "account", "mailbox", "we will",
    "please login", "verify", "urgent", "click", "sincerely",
)
_URL_QUESTION_HINTS = (
    "is this site", "is this link", "is this url", "is this website", "link safe", "site safe",
    "check this link", "check url", "is https", "is http",
)
_GREETINGS = {"hi", "hello", "hey", "how are you", "how are you?"}


def _ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 1)


class AnalysisService:
    def __init__(self, settings: Settings, engine: InferenceEngine, ocr: OCRService, llm: LLMService):
        self.settings = settings
        self.engine = engine
        self.ocr = ocr
        self.llm = llm

    # ---------------------------------------------------------------- input
    def validate_image(self, data: bytes, content_type: Optional[str]) -> Image.Image:
        if not data:
            raise BadInputError("Uploaded file is empty")
        if len(data) > self.settings.max_upload_bytes:
            raise PayloadTooLargeError(f"Image exceeds {self.settings.max_upload_mb} MB limit")
        if content_type and content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise UnsupportedMediaError(f"Unsupported file type '{content_type}'. Use PNG, JPEG, WEBP, BMP or GIF.")
        try:
            img = Image.open(BytesIO(data))
            img.load()
            # Safety safeguard for low-memory cloud hosts (Render 512MB RAM):
            # Downsample images larger than 1280px to prevent OOM in PyTorch & OCR
            if max(img.size) > 1280:
                img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
            return img
        except (UnidentifiedImageError, OSError) as exc:
            raise UnsupportedMediaError("File is not a valid image") from exc

    def _clean_text(self, text: Optional[str], field: str) -> str:
        text = (text or "").strip()
        if not text:
            raise BadInputError(f"{field} must not be empty")
        if len(text) > self.settings.max_text_chars:
            raise BadInputError(f"{field} exceeds {self.settings.max_text_chars} characters")
        return text

    # ------------------------------------------------------------ use-cases
    def analyze_text(self, text: str, config: Optional[CustomLLMConfig] = None) -> dict:
        start = time.perf_counter()
        text = self._clean_text(text, "text")
        try:
            raw_probs = self.engine.text(text)
        except ModelUnavailableError:
            raw_probs = {"benign": 0.5, "phishing": 0.5}
        verdict, probs, expl, src, provider, model, cooldown = self.llm.evaluate_and_explain(
            mode="text", content=text, raw_probs=raw_probs, config=config
        )
        score = probs.get("phishing", 0.0)
        return {
            "mode": "text", "label": verdict, "phishing_score": score, "probs": probs,
            "explanation": expl, "explanation_source": src, "latency_ms": _ms(start),
            "llm_provider": provider, "llm_model": model, "cooldown_remaining": cooldown,
        }

    def analyze_url(self, url: str, config: Optional[CustomLLMConfig] = None) -> dict:
        start = time.perf_counter()
        url = self._clean_text(url, "url")
        try:
            raw_probs = self.engine.url(url)
        except ModelUnavailableError:
            raw_probs = {"benign": 0.5, "phishing": 0.5, "malware": 0.0}
        verdict, probs, expl, src, provider, model, cooldown = self.llm.evaluate_and_explain(
            mode="url", content=url, raw_probs=raw_probs, config=config
        )
        score = url_multiclass_to_binary(probs)
        return {
            "mode": "url", "url": url, "label": verdict, "phishing_score": score, "probs": probs,
            "explanation": expl, "explanation_source": src, "latency_ms": _ms(start),
            "llm_provider": provider, "llm_model": model, "cooldown_remaining": cooldown,
        }

    def analyze_image(self, data: bytes, content_type: Optional[str], config: Optional[CustomLLMConfig] = None) -> dict:
        start = time.perf_counter()
        img = self.validate_image(data, content_type)
        try:
            raw_probs = self.engine.image(img)
        except ModelUnavailableError:
            raw_probs = {"benign": 0.5, "phishing": 0.5}
        ocr_text = self.ocr.extract(img)
        del img
        gc.collect()

        # Strict binary probabilities directly from ResNet-50 visual model
        p_phish = float(raw_probs.get("phishing", 0.5))
        p_benign = float(raw_probs.get("benign", 1.0 - p_phish))
        probs = {"benign": round(p_benign, 4), "phishing": round(p_phish, 4)}

        # If OCR text was detected on image, evaluate text content with LLM
        if ocr_text and ocr_text.strip():
            verdict, probs, expl, src, provider, model, cooldown = self.llm.evaluate_and_explain(
                mode="image",
                content=f"Screenshot with extracted text: {ocr_text[:300]}",
                raw_probs=probs,
                ocr_text=ocr_text,
                config=config,
            )
            # Ensure no malware key leaks into image mode
            probs.pop("malware", None)
            total = sum(probs.values()) or 1.0
            probs = {k: round(v / total, 4) for k, v in probs.items()}
            score = probs.get("phishing", p_phish)
        else:
            # No OCR text detected (e.g. personal photo, camera capture, or non-text image)
            verdict = "phishing" if p_phish >= 0.5 else "benign"
            score = p_phish
            summary = {
                "mode": "image",
                "label": verdict,
                "phishing_score": score,
                "probs": probs,
                "ocr_status": "No text, brand logos, or login forms detected in image.",
            }
            expl, src, provider, model, cooldown = self.llm.explain(
                summary, ocr_text=None, config=config
            )

        return {
            "mode": "image", "label": verdict, "phishing_score": score, "probs": probs, "ocr": ocr_text,
            "explanation": expl, "explanation_source": src, "latency_ms": _ms(start),
            "llm_provider": provider, "llm_model": model, "cooldown_remaining": cooldown,
        }

    def analyze_multimodal(self, text: Optional[str], url: Optional[str],
                           image_bytes: Optional[bytes], content_type: Optional[str],
                           config: Optional[CustomLLMConfig] = None) -> dict:
        start = time.perf_counter()
        text = (text or "").strip() or None
        url = (url or "").strip() or None
        if not (text or url or image_bytes):
            raise BadInputError("Provide at least one of: text, url, file")

        if text:
            try:
                text_probs = self.engine.text(self._clean_text(text, "text"))
            except ModelUnavailableError:
                text_probs = {"benign": 0.5, "phishing": 0.5}
        else:
            text_probs = None

        if url:
            try:
                url_probs = self.engine.url(self._clean_text(url, "url"))
            except ModelUnavailableError:
                url_probs = {"benign": 0.5, "phishing": 0.5, "malware": 0.0}
        else:
            url_probs = None

        img_probs = ocr_text = ocr_prob = None
        if image_bytes:
            img = self.validate_image(image_bytes, content_type)
            try:
                img_probs = self.engine.image(img)
            except ModelUnavailableError:
                img_probs = {"benign": 0.5, "phishing": 0.5}
            ocr_text = self.ocr.extract(img)
            del img
            gc.collect()
            if ocr_text:
                try:
                    ocr_prob = self.engine.text(ocr_text[: self.settings.max_text_chars])["phishing"]
                except ModelUnavailableError:
                    ocr_prob = 0.5

        fusion = fuse_all(
            text_probs["phishing"] if text_probs else None,
            url_multiclass_to_binary(url_probs) if url_probs else None,
            img_probs["phishing"] if img_probs else None,
            ocr_prob,
            alpha=self.settings.fusion_alpha,
        )
        fused = fusion["fused_prob"]
        label = "phishing" if fusion["label"] == 1 else "benign"
        signals = {k: fusion[k] for k in ("text", "url", "img", "ocr")}
        expl, src, provider, model, cooldown = self.llm.explain(
            {"mode": "multimodal", "label": label, "phishing_score": fused, "signals": signals}, ocr_text, config=config
        )
        return {
            "mode": "fusion", "label": label, "phishing_score": fused,
            "probs": {"benign": 1.0 - fused, "phishing": fused},
            "signals": signals,
            "raw": {"text": text_probs, "url": url_probs, "image": img_probs},
            "url": url, "ocr": ocr_text,
            "explanation": expl, "explanation_source": src, "latency_ms": _ms(start),
            "llm_provider": provider, "llm_model": model, "cooldown_remaining": cooldown,
        }

    # ------------------------------------------------------------------ chat
    def heuristic_intent(self, query: str, has_image: bool) -> str:
        q = (query or "").strip()
        if has_image:
            return "image_check"
        if not q:
            return "chat"
        ql = q.lower()
        looks_like_email = any(h in ql for h in _EMAIL_HINTS) or ("http" in ql and len(ql) > 200)
        if extract_single_url(q):
            if looks_like_email or len(q) > self.settings.short_url_threshold:
                return "text_message"
            if any(h in ql for h in _URL_QUESTION_HINTS):
                return "url_check"
            tokens = q.split()
            if len(tokens) <= 3 and any("." in t or t.startswith("http") for t in tokens):
                return "url_check"
            return "text_message"
        if looks_like_email:
            return "text_message"
        if ql in _GREETINGS:
            return "chat"
        if any(w in ql for w in ("screenshot", "image", "photo", "attachment")):
            return "image_check"
        return "chat"

    def chat(self, query: str, image_bytes: Optional[bytes], content_type: Optional[str],
             config: Optional[CustomLLMConfig] = None) -> dict:
        start = time.perf_counter()
        query = (query or "").strip()
        has_image = bool(image_bytes)
        intent = None
        if self.settings.use_llm_intent and not has_image:
            intent = self.llm.classify_intent(query, has_image, config=config)
        intent = intent or self.heuristic_intent(query, has_image)

        if intent == "image_check":
            if not has_image:
                reply, src = (
                    "It looks like you want a screenshot checked. Please attach the image and send again.",
                    "fallback",
                )
                return {"intent": "image_check", "reply": reply, "reply_source": src, "latency_ms": _ms(start)}
            result = self.analyze_image(image_bytes, content_type, config=config)
        elif intent == "url_check":
            url = extract_single_url(query)
            result = self.analyze_url(url, config=config) if url else None
            if result is None:
                intent = "text_message"
                result = self.analyze_text(query, config=config)
        elif intent == "text_message":
            result = self.analyze_text(query, config=config)
        else:
            reply, src, provider, model, cooldown = self.llm.chat_reply(query or "hello", config=config)
            return {
                "intent": "chat", "reply": reply, "reply_source": src, "latency_ms": _ms(start),
                "llm_provider": provider, "llm_model": model, "cooldown_remaining": cooldown,
            }

        result["intent"] = intent
        result["latency_ms"] = _ms(start)
        return result
