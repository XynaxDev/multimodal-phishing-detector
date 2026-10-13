"""Raw model inference. Each function returns a ``{class_name: probability}`` dict."""
from __future__ import annotations

import gc
import re
import urllib.parse
from typing import Dict

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.services.model_registry import DEVICE, ModelRegistry

_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]


def _softmax(logits: torch.Tensor) -> list:
    return torch.softmax(logits, dim=1)[0].cpu().tolist()


def _predict_sequence_probs(model, tokenizer, text: str, max_length: int) -> list:
    if hasattr(model, "run"):  # ONNX Runtime InferenceSession
        inputs = tokenizer(text, truncation=True, padding="max_length", max_length=max_length, return_tensors="np")
        feed = {k: v.astype(np.int64) for k, v in inputs.items() if k in ["input_ids", "attention_mask"]}
        logits = model.run(["logits"], feed)[0]
        exp = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        return (exp / np.sum(exp, axis=1, keepdims=True))[0].tolist()
    else:  # PyTorch sequence classifier
        enc = tokenizer(text, truncation=True, padding="max_length", max_length=max_length, return_tensors="pt")
        enc = {k: v.to(DEVICE) for k, v in enc.items()}
        return _softmax(model(**enc).logits)


class InferenceEngine:
    def __init__(self, registry: ModelRegistry, img_size: int = 224):
        self.registry = registry
        self.img_transform = transforms.Compose(
            [
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(_IMAGENET_MEAN, _IMAGENET_STD),
            ]
        )

    def text(self, text: str) -> Dict[str, float]:
        tokenizer, model = self.registry.text()
        probs = _predict_sequence_probs(model, tokenizer, text, max_length=256)
        raw = {"benign": float(probs[0]), "phishing": float(probs[1]) if len(probs) > 1 else 0.0}

        # Authentic informational 2FA transactional check (zero outbound links, safety advisory)
        cleaned = text.strip()
        has_link = bool(re.search(r"https?://|www\.|\b\w+\.(?:com|xyz|top|ru|rest|online|site)\b", cleaned, re.IGNORECASE))
        if not has_link:
            has_otp = bool(re.search(r"\b(verification code|security code|one-time passcode|otp|auth code|login code)\b", cleaned, re.IGNORECASE))
            has_pin = bool(re.search(r"\b\d{4,8}\b", cleaned))
            has_warning = bool(re.search(r"\b(never share|do not share|don\'t share)\b", cleaned, re.IGNORECASE))
            if has_otp and has_pin and (has_warning or len(cleaned.split()) <= 30):
                return {"benign": 0.998, "phishing": 0.002}

        return raw

    def url(self, url: str) -> Dict[str, float]:
        tokenizer, model = self.registry.url()
        probs = _predict_sequence_probs(model, tokenizer, url, max_length=64)
        full_probs = {
            "benign": float(probs[0]),
            "phishing": float(probs[1]) if len(probs) > 1 else 0.0,
            "malware": float(probs[2]) if len(probs) > 2 else 0.0,
        }

        # Domain decomposition: evaluate registered domain prior using the model itself
        try:
            parsed = urllib.parse.urlsplit(url if "://" in url else "http://" + url)
            if parsed.netloc and parsed.path and parsed.path not in ("", "/"):
                root_url = f"{parsed.scheme or 'https'}://{parsed.netloc}"
                root_raw = _predict_sequence_probs(model, tokenizer, root_url, max_length=64)
                root_benign = float(root_raw[0])
                if root_benign > 0.90 and full_probs["malware"] < 0.50:
                    calibrated_phish = max(0.002, round(full_probs["phishing"] * (1.0 - root_benign) * 2, 4))
                    calibrated_benign = round(1.0 - calibrated_phish - full_probs["malware"], 4)
                    return {
                        "benign": max(0.0, min(1.0, calibrated_benign)),
                        "phishing": max(0.0, min(1.0, calibrated_phish)),
                        "malware": round(full_probs["malware"], 4),
                    }
        except Exception:
            pass

        return full_probs

    @torch.inference_mode()
    def image(self, img: Image.Image) -> Dict[str, float]:
        model = self.registry.image()
        x = self.img_transform(img.convert("RGB")).unsqueeze(0).to(DEVICE)
        probs = _softmax(model(x))
        del x
        gc.collect()
        return {"benign": float(probs[0]), "phishing": float(probs[1]) if len(probs) > 1 else 0.0}
