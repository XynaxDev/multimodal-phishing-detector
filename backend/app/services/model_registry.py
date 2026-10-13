"""Lazy, thread-safe loading of the three classifiers (BERT, DistilBERT, ResNet-50)."""
from __future__ import annotations

import gc
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
if DEVICE.type == "cpu":
    try:
        torch.set_num_threads(1)
    except Exception:
        pass


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
        hub_repo = self.settings.hf_url_repo if name == "url" else self.settings.hf_text_repo
        token = (self.settings.hf_token or os.environ.get("HF_TOKEN") or "").strip() or None

        # 1. First priority on low-memory hosts: Ultra-compact INT8 ONNX runtime (~40MB RAM)
        onnx_file = None
        if path.is_dir() and (path / "model_quantized.onnx").is_file():
            onnx_file = path / "model_quantized.onnx"
        elif hub_repo:
            try:
                from huggingface_hub import hf_hub_download
                cache_dir = os.environ.get("HF_HOME", "/app/hf_cache")
                logger.info("Checking/downloading quantized ONNX model for %s from %s", name, hub_repo)
                onnx_file = hf_hub_download(
                    repo_id=hub_repo,
                    filename="model_quantized.onnx",
                    token=token,
                    cache_dir=cache_dir,
                )
            except Exception as e:
                logger.exception("Quantized ONNX download failed for %s from %s", name, hub_repo)
                if not path.is_dir():
                    raise ModelUnavailableError(f"Quantized ONNX model download failed for {name}: {e}") from e

        if onnx_file:
            try:
                import onnxruntime as ort
                logger.info("Initializing high-efficiency ONNX Runtime session for %s from %s", name, onnx_file)
                sess = ort.InferenceSession(str(onnx_file), providers=["CPUExecutionProvider"])
                load_source = str(path) if path.is_dir() else hub_repo
                tokenizer = AutoTokenizer.from_pretrained(
                    load_source,
                    local_files_only=path.is_dir(),
                    token=token,
                )
                gc.collect()
                return tokenizer, sess
            except Exception as exc:
                logger.exception("Failed initializing ONNX session for %s from %s", name, onnx_file)
                if not path.is_dir():
                    raise ModelUnavailableError(f"Failed initializing ONNX session for {name}: {exc}") from exc

        # 2. PyTorch sequence classification (only used when local model directories exist)
        if path.is_dir():
            load_source = str(path)
            local_only = True
            logger.info("Loading %s model from local path: %s", name, path)
        else:
            raise ModelUnavailableError(f"{name} model unavailable in cloud environment")

        try:
            gc.collect()
            tokenizer = AutoTokenizer.from_pretrained(
                load_source,
                local_files_only=local_only,
                token=token,
            )
            model = AutoModelForSequenceClassification.from_pretrained(
                load_source,
                local_files_only=local_only,
                token=token,
                low_cpu_mem_usage=True,
            )
        except Exception as exc:
            logger.exception("Failed loading %s model from %s", name, load_source)
            raise ModelUnavailableError(f"Failed loading {name} model from {load_source}: {exc}") from exc

        if self.settings.quantize_models and DEVICE.type == "cpu":
            try:
                model = torch.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)
                logger.info("%s model dynamically quantized to INT8 for low-memory host", name)
                gc.collect()
            except Exception as exc:
                logger.warning("Quantization skipped for %s: %s", name, exc)
        model.to(DEVICE).eval()
        gc.collect()
        return tokenizer, model

    def _load_resnet(self) -> nn.Module:
        self._ensure_artifacts()
        weights_path = self.image_path
        token = (self.settings.hf_token or os.environ.get("HF_TOKEN") or "").strip() or None
        if not (hasattr(weights_path, "is_file") and weights_path.is_file()):
            if self.settings.hf_image_repo:
                try:
                    from huggingface_hub import hf_hub_download
                    logger.info("Downloading ResNet-50 weights from HF Hub: %s", self.settings.hf_image_repo)
                    weights_path = hf_hub_download(
                        repo_id=self.settings.hf_image_repo,
                        filename="best_model.pth",
                        token=token
                    )
                except Exception as exc:
                    raise ModelUnavailableError(f"Failed downloading image model from HF Hub: {exc}") from exc
            else:
                raise ModelUnavailableError(f"Image model file not found: {self.image_path}")

        logger.info("Loading image model from %s", weights_path)
        model = tv_models.resnet50(weights=None)
        model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(model.fc.in_features, 2))
        try:
            state = torch.load(str(weights_path), map_location=DEVICE, weights_only=True)
        except Exception:
            state = torch.load(str(weights_path), map_location=DEVICE, weights_only=False)
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        state = {k.removeprefix("module."): v for k, v in state.items()}
        model.load_state_dict(state)
        del state
        gc.collect()
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
