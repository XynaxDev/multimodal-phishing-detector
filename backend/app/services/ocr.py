"""Optional OCR: tries an n8n webhook first, then local Tesseract. Never raises."""
from __future__ import annotations

import logging
from io import BytesIO
from typing import Optional

import requests
from PIL import Image

from app.core.config import Settings

logger = logging.getLogger("ph5.ocr")


class OCRService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._tesseract_ok: Optional[bool] = None

    @property
    def enabled(self) -> bool:
        return self.settings.use_ocr

    def _via_n8n(self, image_bytes: bytes) -> Optional[str]:
        endpoint = self.settings.n8n_ocr_endpoint.strip()
        if not endpoint:
            return None
        try:
            r = requests.post(
                endpoint,
                files={"file": ("img.png", image_bytes, "image/png")},
                timeout=self.settings.n8n_timeout,
            )
            if r.ok:
                j = r.json()
                return j.get("ocr_text") or j.get("text") or j.get("ocr")
        except Exception as exc:
            logger.debug("n8n OCR failed: %s", exc)
        return None

    def _via_tesseract(self, image_bytes: bytes) -> Optional[str]:
        if self._tesseract_ok is False:
            return None
        try:
            import pytesseract

            if self.settings.tesseract_cmd.strip():
                pytesseract.pytesseract.tesseract_cmd = self.settings.tesseract_cmd.strip()
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            text = pytesseract.image_to_string(img)
            self._tesseract_ok = True
            return text
        except Exception as exc:
            if self._tesseract_ok is None:
                logger.info("Tesseract OCR unavailable (%s); OCR will be skipped.", exc)
            self._tesseract_ok = False
            return None

    def extract(self, image_bytes: bytes) -> Optional[str]:
        if not self.enabled:
            return None
        for fn in (self._via_n8n, self._via_tesseract):
            text = fn(image_bytes)
            if text and text.strip():
                return text.strip()
        return None
