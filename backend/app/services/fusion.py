"""URL extraction helpers and weighted late fusion (unchanged logic from v1)."""
from __future__ import annotations

import re
from typing import Dict, Optional

FULL_URL_PATTERN = re.compile(r"(https?://[^\s)>\]]+)", flags=re.I)
BARE_DOMAIN_PATTERN = re.compile(r"(?<![@/\w.-])([a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,})(/[^\s)>]*)?", flags=re.I)


def extract_single_url(text: str) -> Optional[str]:
    if not text:
        return None
    cleaned = text.strip()
    m = FULL_URL_PATTERN.search(cleaned)
    if m:
        return m.group(1).rstrip(".,;:!?)(")
    m2 = BARE_DOMAIN_PATTERN.search(cleaned)
    if m2:
        candidate = m2.group(0).strip().rstrip(".,;:!?)(")
        if re.search(r"\.[a-zA-Z]{2,}$", candidate) and not re.search(
            r"\b[\w\.-]+@" + re.escape(candidate) + r"\b", cleaned
        ):
            if not candidate.startswith(("http://", "https://")):
                candidate = "https://" + candidate
            return candidate
    return None


def url_multiclass_to_binary(url_probs: Dict[str, float]) -> float:
    return float(min(1.0, url_probs.get("phishing", 0.0) + url_probs.get("malware", 0.0)))


def fuse_all(text_p, url_p_bin, img_p, ocr_p, alpha: float = 0.8) -> dict:
    """Text (or OCR) gets weight ``alpha``; remaining weight is split across URL/image."""
    modalities = {"text": text_p, "url": url_p_bin, "img": img_p, "ocr": ocr_p}
    text_signal = None
    if text_p is not None and ocr_p is not None:
        text_signal = max(text_p, ocr_p)
    elif text_p is not None:
        text_signal = text_p
    elif ocr_p is not None:
        text_signal = ocr_p

    available = {k: v for k, v in (("text", text_signal), ("url", url_p_bin), ("img", img_p)) if v is not None}
    if not available:
        return {"fused_prob": 0.0, "label": 0, **modalities}

    if "text" in available:
        others = [k for k in available if k != "text"]
        if others:
            share = (1.0 - alpha) / len(others)
            fused = alpha * available["text"] + sum(share * available[o] for o in others)
        else:
            fused = available["text"]
    else:
        fused = sum(available.values()) / len(available)

    return {"fused_prob": float(fused), "label": int(fused >= 0.5), **modalities}
