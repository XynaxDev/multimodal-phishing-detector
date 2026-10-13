"""Multi-provider LLM client with Bring-Your-Own-LLM (BYOK) and dynamic provider rate-limit cooldown handling.

Acts as CyberGuardian: provides conversational guidance and hierarchical semantic arbitration
to calibrate classifier verdicts. Supports Groq (default), Google Gemini, OpenAI, OpenRouter,
and Custom OpenAI-compatible / local endpoints (e.g. Ollama).
Extracts real dynamic cooldown times from provider 429 headers and error payloads without hardcoded delays.
"""
from __future__ import annotations

import json
import logging
import re
import time
from threading import Lock
from typing import Dict, List, Optional, Tuple

import requests

from app.core.config import Settings
from app.core.errors import LLMRateLimitError
from app.schemas import CustomLLMConfig

logger = logging.getLogger("ph5.llm")

_THINK_RE = re.compile(r"<think>.*?</think>", flags=re.S | re.I)

DEFAULT_PROVIDER_URLS = {
    "groq": "https://api.groq.com/openai/v1",
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai",
    "openrouter": "https://openrouter.ai/api/v1",
    "custom": "http://localhost:11434/v1",
}

DEFAULT_PROVIDER_MODELS = {
    "groq": "qwen/qwen3.8-27b",
    "openai": "gpt-4o-mini",
    "gemini": "gemini-flash-lite-latest",
    "openrouter": "google/gemma-4-31b-it:free",
    "custom": "llama3.2",
}

ARBITER_SYSTEM_PROMPT = """You are CyberGuardian, the senior cybersecurity evaluation engine of PH5.
Evaluate the input alongside preliminary classifier signals to produce a calibrated, accurate decision.

Rules:
- For URLs: Distinguish legitimate profiles, repositories, articles, and services (e.g. GitHub, Wikipedia, StackOverflow, Medium, Docs, Google) from actual lookalike domains, credential harvesters, or malware distribution links. Do not penalize URLs simply because they contain paths or slashes.
- For SMS/Text: Distinguish authentic transactional notifications/OTPs (which advise 'never share', contain no deceptive links, and ask for nothing) from social engineering, urgency coercion, and credential theft traps.
- For Images/OCR: Use OCR text and image classifier signals. If no OCR text is present, NEVER invent or fabricate brands, URLs, login forms, or password fields.

Format requirements:
- If Mode is 'url': Return {"verdict": "benign" | "phishing" | "malware", "probs": {"benign": float, "phishing": float, "malware": float}, "explanation": "..."}
- If Mode is 'text' or 'image': Return {"verdict": "benign" | "phishing", "probs": {"benign": float, "phishing": float}, "explanation": "..."} (do NOT include malware for text or images)

Return valid JSON with 1-2 summary sentences followed by 2-3 bullet points with technical signals and practical safety advice."""

EXPLAIN_SYSTEM_PROMPT = """You are CyberGuardian, a friendly cybersecurity assistant inside the PH5 phishing detector.
Your only job is to explain the detection result produced by PH5's trained classifiers.

Rules:
- NEVER invent information. Do not assume what an image or message contains unless OCR/text is provided.
- NEVER fabricate URLs, senders, brands, login pages, or credential harvesting forms.
- If an image has no OCR text, state clearly that no brand names, logos, or login fields were detected in the image, and note that PH5's visual model is fine-tuned specifically for digital webpage screenshots.
- Use ONLY the probabilities supplied. If they are close, say the evidence is uncertain.
- Do not contradict the model's final label.
- Tone: clear, calm, helpful, slightly conversational.
- Format: one or two summary sentences, then 2-4 short bullet points with signals and practical safety advice.
Return only the explanation."""

CHAT_SYSTEM_PROMPT = """You are CyberGuardian, the assistant of PH5, a multimodal phishing detector.
PH5 can check URLs, email/SMS text and screenshots for phishing. Reply in 2-4 friendly sentences
about staying safe online and how to use PH5. Do not make up facts or claim to have analysed anything."""

INTENT_SYSTEM_PROMPT = """You are an intent classifier for a cybersecurity chatbot. Do NOT answer the user.
Return EXACTLY one label from: chat, url_check, text_message, image_check.
- url_check: the user mainly wants a single link/URL checked.
- text_message: the user pasted an email, SMS or other message body.
- image_check: the user refers to an uploaded screenshot/image.
- chat: greetings or general questions.
Return only the label."""


def extract_retry_seconds(response: requests.Response) -> float:
    """Extract dynamic cooldown seconds from provider HTTP response headers or error body."""
    # 1. Standard HTTP Retry-After header (often sent by Groq, OpenAI, Cloudflare)
    hdr = response.headers.get("retry-after")
    if hdr:
        try:
            return max(1.0, float(hdr))
        except ValueError:
            pass

    # 2. Parse provider JSON error body (e.g. Groq returns "Please try again in 14.2s.")
    text = response.text or ""
    m = re.search(r"(?:try again in|retry after|wait)\s+([\d\.]+)\s*s", text, re.IGNORECASE)
    if m:
        try:
            return max(1.0, float(m.group(1)))
        except ValueError:
            pass

    m2 = re.search(r"in\s+([\d\.]+)\s*(?:seconds|sec|s\b)", text, re.IGNORECASE)
    if m2:
        try:
            return max(1.0, float(m2.group(1)))
        except ValueError:
            pass

    return 15.0


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._session = requests.Session()
        self._reasoning_supported = True
        self._cooldowns: Dict[str, float] = {}
        self._cooldown_lock = Lock()

    @property
    def enabled(self) -> bool:
        return self.settings.llm_enabled

    @property
    def model(self) -> str:
        return self.settings.groq_model

    def get_cooldown_remaining(self, provider: str = "groq") -> Optional[float]:
        """Return active cooldown seconds remaining according to provider time, or None if ready."""
        with self._cooldown_lock:
            expires = self._cooldowns.get(provider, 0.0)
            now = time.time()
            if expires > now:
                return round(expires - now, 1)
            if provider in self._cooldowns:
                del self._cooldowns[provider]
            return None

    def set_cooldown(self, provider: str, seconds: float) -> None:
        """Register active cooldown based on provider's exact dynamic response."""
        with self._cooldown_lock:
            self._cooldowns[provider] = time.time() + max(1.0, seconds)

    # ------------------------------------------------------------------ #
    def complete(
        self,
        messages: List[dict],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_response: bool = False,
        _retry_count: int = 0,
        config: Optional[CustomLLMConfig] = None,
    ) -> Optional[str]:
        # Resolve provider
        provider = (config.provider or "groq").lower().strip() if (config and config.provider) else "groq"
        if provider not in DEFAULT_PROVIDER_URLS:
            provider = "groq"

        # Resolve API key
        is_custom = bool(config and config.api_key and config.api_key.strip())
        if is_custom:
            api_key = config.api_key.strip()
        else:
            api_key = self.settings.groq_api_key.strip()

        # If using default shared provider and it has no API key configured, return None
        if not is_custom and not self.enabled:
            return None

        # Check provider cooldown before executing request
        cooldown_key = f"custom:{provider}" if is_custom else "groq"
        rem = self.get_cooldown_remaining(cooldown_key)
        if rem is not None and rem > 0:
            logger.info("Provider %s in cooldown (%.1fs remaining).", provider.upper(), rem)
            raise LLMRateLimitError(provider=provider, retry_after=rem, is_custom=is_custom)

        # Resolve base URL
        if config and config.base_url and config.base_url.strip():
            base_url = config.base_url.strip().rstrip("/")
        elif provider == "groq":
            base_url = self.settings.groq_base_url.rstrip("/")
        else:
            base_url = DEFAULT_PROVIDER_URLS.get(provider, "https://api.groq.com/openai/v1").rstrip("/")

        # Resolve model
        if config and config.model and config.model.strip():
            model_name = config.model.strip()
        elif provider == "groq":
            model_name = self.settings.groq_model
        else:
            model_name = DEFAULT_PROVIDER_MODELS.get(provider, "gpt-4o-mini")

        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": self.settings.llm_temperature if temperature is None else temperature,
        }
        _tok = max_tokens or min(self.settings.llm_max_tokens, 350)
        payload["max_completion_tokens" if provider == "openai" else "max_tokens"] = _tok
        if json_response:
            payload["response_format"] = {"type": "json_object"}

        # Groq specific reasoning parameters
        if provider == "groq" and self._reasoning_supported:
            payload["reasoning_format"] = "hidden"
            if self.settings.groq_reasoning_effort.strip():
                payload["reasoning_effort"] = self.settings.groq_reasoning_effort.strip()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if provider == "openrouter":
            headers["HTTP-Referer"] = "https://ph5.security"
            headers["X-Title"] = "PH5 Phishing Detector"

        url = f"{base_url}/chat/completions"
        timeout = self.settings.groq_timeout

        try:
            r = self._session.post(url, headers=headers, json=payload, timeout=timeout)

            # Check if model rejects reasoning parameters
            if r.status_code == 400 and "reasoning" in r.text.lower() and self._reasoning_supported and provider == "groq":
                logger.info("Model %s rejected reasoning params; retrying without them.", model_name)
                self._reasoning_supported = False
                return self.complete(messages, max_tokens, temperature, json_response, _retry_count, config)

            # Provider 429 Rate Limit Handling
            if r.status_code == 429:
                wait_sec = extract_retry_seconds(r)
                logger.warning(
                    "%s 429 Rate Limit hit. Dynamic cooldown: %.1fs (attempt %d).",
                    provider.upper(), wait_sec, _retry_count + 1
                )
                if wait_sec <= 2.0 and _retry_count < 1:
                    time.sleep(wait_sec)
                    return self.complete(messages, max_tokens, temperature, json_response, _retry_count + 1, config)

                # Set cooldown based strictly on provider response
                self.set_cooldown(cooldown_key, wait_sec)
                raise LLMRateLimitError(provider=provider, retry_after=wait_sec, is_custom=is_custom)

            if not r.ok:
                logger.warning("%s API error %s: %s", provider.upper(), r.status_code, r.text[:300])
                return None

            data = r.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            content = choices[0].get("message", {}).get("content") or ""
            content = _THINK_RE.sub("", content).strip()
            return content or None

        except LLMRateLimitError:
            raise
        except Exception as exc:
            logger.warning("%s request failed: %s", provider.upper(), exc)
            return None

    # ------------------------------------------------------------------ #
    def evaluate_and_explain(
        self,
        mode: str,
        content: str,
        raw_probs: Dict[str, float],
        ocr_text: Optional[str] = None,
        config: Optional[CustomLLMConfig] = None,
    ) -> Tuple[str, Dict[str, float], str, str, str, str, Optional[float]]:
        """Hierarchical semantic evaluation combining classifier signals + LLM reasoning.

        Returns: (verdict, calibrated_probs, explanation, source, provider, model, cooldown_remaining)
        """
        provider = (config.provider or "groq").lower().strip() if (config and config.provider) else "groq"
        model_name = config.model.strip() if (config and config.model) else (
            self.settings.groq_model if provider == "groq" else DEFAULT_PROVIDER_MODELS.get(provider, "gpt-4o-mini")
        )

        fallback_verdict = max(raw_probs, key=raw_probs.get)
        fallback_expl = _fallback_explanation(
            {"label": fallback_verdict, "probs": raw_probs, "phishing_score": raw_probs.get("phishing", 0.0)},
            ocr_text,
        )

        # Check if enabled
        is_custom = bool(config and config.api_key and config.api_key.strip())
        if not is_custom and not self.enabled:
            return fallback_verdict, raw_probs, fallback_expl, "fallback", provider, model_name, None

        user_msg = f"Mode: {mode}\nContent: {content}\nPreliminary classifier signals: {json.dumps(raw_probs)}"
        if ocr_text:
            user_msg += f'\nExtracted OCR Text:\n"{ocr_text[:300]}"'

        try:
            out = self.complete(
                [{"role": "system", "content": ARBITER_SYSTEM_PROMPT}, {"role": "user", "content": user_msg}],
                max_tokens=400,
                temperature=0.1,
                json_response=True,
                config=config,
            )
        except LLMRateLimitError as exc:
            logger.info("LLM rate limited during evaluate_and_explain: %s. Using calibrated fallback.", exc.message)
            return fallback_verdict, raw_probs, fallback_expl, "fallback", provider, model_name, float(exc.retry_after)

        if out:
            try:
                data = json.loads(out)
                verdict = str(data.get("verdict", "")).lower()
                if verdict in ("benign", "phishing", "malware"):
                    c_probs = data.get("probs")
                    if isinstance(c_probs, dict) and "benign" in c_probs:
                        if mode != "url":
                            c_probs.pop("malware", None)
                        total = sum(c_probs.values()) or 1.0
                        c_probs = {k: round(v / total, 4) for k, v in c_probs.items()}
                        if mode == "url" and "malware" not in c_probs:
                            c_probs["malware"] = 0.0
                    else:
                        c_probs = raw_probs
                    expl = str(data.get("explanation", "")).strip()
                    if expl:
                        return verdict, c_probs, expl, "llm", provider, model_name, None
            except Exception as e:
                logger.warning("Failed to parse LLM arbiter JSON: %s", e)

        return fallback_verdict, raw_probs, fallback_expl, "fallback", provider, model_name, None

    def explain(
        self,
        summary: dict,
        ocr_text: Optional[str] = None,
        config: Optional[CustomLLMConfig] = None,
    ) -> Tuple[str, str, str, str, Optional[float]]:
        """Return (explanation, source, provider, model, cooldown_remaining)."""
        provider = (config.provider or "groq").lower().strip() if (config and config.provider) else "groq"
        model_name = config.model.strip() if (config and config.model) else (
            self.settings.groq_model if provider == "groq" else DEFAULT_PROVIDER_MODELS.get(provider, "gpt-4o-mini")
        )

        ocr_snippet = (ocr_text[:300] + "...") if ocr_text and len(ocr_text) > 300 else (ocr_text or "None")
        user_msg = (
            f"Detection summary (model outputs):\n{json.dumps(summary, indent=2, default=str)}\n\n"
            f'OCR text (if available):\n"{ocr_snippet}"'
        )

        try:
            out = self.complete(
                [{"role": "system", "content": EXPLAIN_SYSTEM_PROMPT}, {"role": "user", "content": user_msg}],
                config=config,
            )
            if out:
                return out, "llm", provider, model_name, None
        except LLMRateLimitError as exc:
            logger.info("LLM rate limited during explain: %s. Using fallback.", exc.message)
            return _fallback_explanation(summary, ocr_text), "fallback", provider, model_name, float(exc.retry_after)

        return _fallback_explanation(summary, ocr_text), "fallback", provider, model_name, None

    def chat_reply(
        self,
        query: str,
        config: Optional[CustomLLMConfig] = None,
    ) -> Tuple[str, str, str, str, Optional[float]]:
        """Generate conversational reply. If rate limited, raises LLMRateLimitError."""
        provider = (config.provider or "groq").lower().strip() if (config and config.provider) else "groq"
        model_name = config.model.strip() if (config and config.model) else (
            self.settings.groq_model if provider == "groq" else DEFAULT_PROVIDER_MODELS.get(provider, "gpt-4o-mini")
        )

        try:
            out = self.complete(
                [{"role": "system", "content": CHAT_SYSTEM_PROMPT}, {"role": "user", "content": query}],
                temperature=0.4,
                config=config,
            )
            if out:
                return out, "llm", provider, model_name, None
        except LLMRateLimitError:
            raise

        return (
            "I can check URLs, emails, SMS messages and screenshots for phishing indicators. "
            "Paste a link or message, or upload a screenshot, and I'll run the relevant checks.",
            "fallback",
            provider,
            model_name,
            None,
        )

    def classify_intent(
        self,
        query: str,
        has_image: bool,
        config: Optional[CustomLLMConfig] = None,
    ) -> Optional[str]:
        user_msg = f'User query: "{query}"\nImage attached: {"yes" if has_image else "no"}'
        try:
            out = self.complete(
                [{"role": "system", "content": INTENT_SYSTEM_PROMPT}, {"role": "user", "content": user_msg}],
                max_tokens=256,
                temperature=0.0,
                config=config,
            )
            if not out:
                return None
            txt = out.lower()
            for label in ("url_check", "text_message", "image_check", "chat"):
                if label in txt:
                    return label
        except LLMRateLimitError:
            pass
        return None


def _fallback_explanation(summary: dict, ocr_text: Optional[str]) -> str:
    label = str(summary.get("label", "unknown")).upper()
    score = summary.get("phishing_score")
    lines = [f"Model verdict: {label}" + (f" (phishing score {score:.2f})" if isinstance(score, (int, float)) else "")]
    probs = summary.get("probs")
    if isinstance(probs, dict):
        lines.append("Class probabilities: " + ", ".join(f"{k} {v:.1%}" for k, v in probs.items()))
    lines.append("")
    lines.append("Advice:")
    if isinstance(score, (int, float)) and score >= 0.9:
        lines.append("- Strong evidence of phishing. Do not click links or enter credentials.")
    elif isinstance(score, (int, float)) and score >= 0.6:
        lines.append("- Moderate signals. Verify the sender and avoid entering sensitive information.")
    else:
        lines.append("- Likely benign, but still double-check unexpected links and senders.")
    if ocr_text:
        lines += ["", "OCR snippet:", ocr_text.replace("\n", " ")[:400]]
    return "\n".join(lines)
