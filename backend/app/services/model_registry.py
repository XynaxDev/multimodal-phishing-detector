"""Lazy, thread-safe loading of the three classifiers (BERT, DistilBERT, ResNet-50)."""
from __future__ import annotations

import logging
import threading
from typing import Dict, Optional, Tuple

import torch
import torch.nn as nn
from torchvision import models as tv_models
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.core.config import BACKEND_DIR, Settings
from app.core.errors import ModelUnavailableError

logger = logging.getLogger("ph5.models")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class ModelRegistry:
    """Loads each model on first use and caches it for the process lifetime."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._lock = threading.Lock()
        self._text: Optional[Tuple] = None
        self._url: Optional[Tuple] = None
        self._image: Optional[nn.Module] = None
        self._errors: Dict[str, str] = {}
        self._artifacts_checked = False

        self.text_dir = settings.resolve_path(settings.text_model_dir)
        self.url_dir = settings.resolve_path(settings.url_model_dir)
        self.image_path = settings.resolve_path(settings.image_model_path)

    # ------------------------------------------------------------------ #
    def _ensure_artifacts(self) -> None:
        """Download model files from the Hugging Face Hub if configured and missing."""
        if self._artifacts_checked:
            return
        self._artifacts_checked = True
        missing = not (self.text_dir.is_dir() and self.url_dir.is_dir() and self.image_path.is_file())
        repo = self.settings.hf_model_repo.strip()
        if not (missing and repo):
            return
        try:
            from huggingface_hub import snapshot_download

            target = BACKEND_DIR / "models"
            logger.info("Downloading model artifacts from HF Hub repo '%s' -> %s", repo, target)
            snapshot_download(repo_id=repo, local_dir=str(target), token=self.settings.hf_token or None)
        except Exception as exc:  # pragma: no cover - network dependent
            logger.error("Model download from HF Hub failed: %s", exc)

    def _load_hf_classifier(self, name: str, path) -> Tuple:
        self._ensure_artifacts()
        if not path.is_dir():
            raise ModelUnavailableError(f"{name} model directory not found: {path}")
        logger.info("Loading %s model from %s", name, path)
        tokenizer = AutoTokenizer.from_pretrained(str(path), local_files_only=True)
        model = AutoModelForSequenceClassification.from_pretrained(str(path), local_files_only=True)
        if self.settings.quantize_models and DEVICE.type == "cpu":
            try:
                model = torch.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)
                logger.info("%s model dynamically quantized to INT8 for low-memory host", name)
            except Exception as exc:
                logger.warning("Quantization skipped for %s: %s", name, exc)
        model.to(DEVICE).eval()
        return tokenizer, model

    def _load_resnet(self) -> nn.Module:
        self._ensure_artifacts()
        if not self.image_path.is_file():
            raise ModelUnavailableError(f"Image model file not found: {self.image_path}")
        logger.info("Loading image model from %s", self.image_path)
        model = tv_models.resnet50(weights=None)
        model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(model.fc.in_features, 2))
        try:
            state = torch.load(str(self.image_path), map_location=DEVICE, weights_only=True)
        except Exception:
            # Checkpoint contains non-tensor objects; it's our own trusted artifact.
            state = torch.load(str(self.image_path), map_location=DEVICE, weights_only=False)
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        state = {k.removeprefix("module."): v for k, v in state.items()}
        model.load_state_dict(state)
        model.to(DEVICE).eval()
        return model

    def _get(self, attr: str, name: str, loader):
        cached = getattr(self, attr)
        if cached is not None:
            return cached
        with self._lock:
            cached = getattr(self, attr)
            if cached is not None:
                return cached
            try:
                value = loader()
            except ModelUnavailableError as exc:
                self._errors[name] = exc.message
                raise
            except Exception as exc:
                self._errors[name] = str(exc)
                logger.exception("Failed to load %s model", name)
                raise ModelUnavailableError(f"Failed to load {name} model: {exc}") from exc
            self._errors.pop(name, None)
            setattr(self, attr, value)
            logger.info("%s model ready on %s", name, DEVICE)
            return value

    # ------------------------------------------------------------------ #
    def text(self) -> Tuple:
        return self._get("_text", "text", lambda: self._load_hf_classifier("text", self.text_dir))

    def url(self) -> Tuple:
        return self._get("_url", "url", lambda: self._load_hf_classifier("url", self.url_dir))

    def image(self) -> nn.Module:
        return self._get("_image", "image", self._load_resnet)

    def preload(self) -> None:
        for loader in (self.text, self.url, self.image):
            try:
                loader()
            except ModelUnavailableError as exc:
                logger.warning("Preload skipped: %s", exc.message)

    def status(self) -> Dict[str, dict]:
        def entry(name: str, loaded: bool, path) -> dict:
            return {"loaded": loaded, "available": path.exists(), "error": self._errors.get(name)}

        return {
            "text": entry("text", self._text is not None, self.text_dir),
            "url": entry("url", self._url is not None, self.url_dir),
            "image": entry("image", self._image is not None, self.image_path),
        }
