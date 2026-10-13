"""
Ph5 Model Hub Uploader
Automated script to upload trained Ph5 checkpoints to the Hugging Face Model Hub.

Repos created/updated under username (default 'XynaxDev'):
1. XynaxDev/ph5-url-distilbert
2. XynaxDev/ph5-text-bert
3. XynaxDev/ph5-image-resnet50
"""

import os
import sys
from pathlib import Path

try:
    from huggingface_hub import HfApi, create_repo, upload_folder, upload_file
except ImportError:
    print("Error: huggingface_hub is not installed. Please run:")
    print("pip install huggingface_hub")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "backend" / "models"

USERNAME = os.environ.get("HF_USERNAME", "XynaxDev")
TOKEN = os.environ.get("HF_TOKEN", None)

URL_MODEL_DIR = MODELS_DIR / "url" / "distilbert_url"
TEXT_MODEL_DIR = MODELS_DIR / "text" / "bert_finetuned"
IMAGE_MODEL_FILE = MODELS_DIR / "image" / "best_model.pth"

URL_REPO_ID = f"{USERNAME}/ph5-url-distilbert"
TEXT_REPO_ID = f"{USERNAME}/ph5-text-bert"
IMAGE_REPO_ID = f"{USERNAME}/ph5-image-resnet50"

URL_MODEL_CARD = """---
language:
- en
license: mit
tags:
- cybersecurity
- phishing-detection
- url-classification
- distilbert
datasets:
- tranco-top-1m
- phishtank
- urlhaus
metrics:
- accuracy: 0.9950
- macro_f1: 0.9949
pipeline_tag: text-classification
---

# Ph5 URL Classifier (DistilBERT)

Part of the **Ph5 Multimodal Phishing Detection Framework**.
Fine-tuned `distilbert-base-uncased` 3-class classifier mapping URL strings to `{Benign, Phishing, Malware}`.

## Empirical Metrics (Held-out Test Split, N = 22,182)
- **Accuracy:** 99.50%
- **Macro Precision:** 99.50%
- **Macro Recall:** 99.49%
- **Macro F1:** 99.49%
- **Inference Latency:** 11.2 ms

## Usage
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("XynaxDev/ph5-url-distilbert")
model = AutoModelForSequenceClassification.from_pretrained("XynaxDev/ph5-url-distilbert")

url = "https://secure-login.sample.com/verify"
inputs = tokenizer(url, return_tensors="pt", max_length=64, truncation=True)
with torch.no_grad():
    logits = model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).squeeze().tolist()

labels = ["benign", "phishing", "malware"]
for label, p in zip(labels, probs):
    print(f"{label}: {p:.4f}")
```
"""

TEXT_MODEL_CARD = """---
language:
- en
license: mit
tags:
- cybersecurity
- phishing-detection
- nlp
- bert
metrics:
- accuracy: 0.9722
- precision: 0.9751
- recall: 0.9584
- f1: 0.9667
- roc_auc: 0.9961
pipeline_tag: text-classification
---

# Ph5 Text Classifier (BERT-base)

Part of the **Ph5 Multimodal Phishing Detection Framework**.
Fine-tuned `bert-base-uncased` binary classifier detecting deceptive social engineering patterns in emails, SMS, and HTML text.

## Empirical Metrics (Held-out Test Split, N = 11,652)
- **Accuracy:** 97.22%
- **Precision:** 97.51%
- **Recall:** 95.84%
- **F1-Score:** 96.67%
- **ROC-AUC:** 0.9961
- **Inference Latency:** 34.2 ms

## Usage
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("XynaxDev/ph5-text-bert")
model = AutoModelForSequenceClassification.from_pretrained("XynaxDev/ph5-text-bert")

text = "Urgent: Your account credentials have been suspended. Verify now."
inputs = tokenizer(text, return_tensors="pt", max_length=256, truncation=True)
with torch.no_grad():
    logits = model(**inputs).logits
    p_phish = torch.softmax(logits, dim=-1)[0, 1].item()

print(f"Phishing Probability: {p_phish:.4f}")
```
"""

IMAGE_MODEL_CARD = """---
license: mit
tags:
- cybersecurity
- phishing-detection
- computer-vision
- resnet50
metrics:
- accuracy: 0.7900
- precision: 0.7269
- recall: 0.8263
- f1: 0.7734
pipeline_tag: image-classification
---

# Ph5 Webpage Screenshot Classifier (ResNet-50)

Part of the **Ph5 Multimodal Phishing Detection Framework**.
Fine-tuned ResNet-50 visual classifier detecting brand spoofing and visual deception in rendered webpage screenshots.

## Empirical Metrics (Held-out Test Split, N = 438)
- **Accuracy:** 79.00%
- **Peak Validation Accuracy:** 83.30%
- **Precision:** 72.69%
- **Recall:** 82.63%
- **F1-Score:** 77.34%
- **Inference Latency:** 28.5 ms

## Weights File
Contains `best_model.pth` PyTorch state dict.
"""

def upload_all():
    api = HfApi(token=TOKEN)
    
    print(f"=== Ph5 Hugging Face Uploader ===")
    print(f"Target Username / Organization: {USERNAME}")

    # 1. URL Classifier
    print(f"\n[1/3] Uploading URL Classifier to {URL_REPO_ID}...")
    create_repo(repo_id=URL_REPO_ID, repo_type="model", exist_ok=True, token=TOKEN)
    
    # Write model card
    card_path = URL_MODEL_DIR / "README.md"
    card_path.write_text(URL_MODEL_CARD, encoding="utf-8")
    
    upload_folder(
        folder_path=str(URL_MODEL_DIR),
        repo_id=URL_REPO_ID,
        repo_type="model",
        token=TOKEN,
        commit_message="Upload fine-tuned Ph5 URL DistilBERT model weights and tokenizer"
    )
    print(f"✓ URL model successfully uploaded to https://huggingface.co/{URL_REPO_ID}")

    # 2. Text Classifier
    print(f"\n[2/3] Uploading Text Classifier to {TEXT_REPO_ID}...")
    create_repo(repo_id=TEXT_REPO_ID, repo_type="model", exist_ok=True, token=TOKEN)
    
    # Write model card
    card_path = TEXT_MODEL_DIR / "README.md"
    card_path.write_text(TEXT_MODEL_CARD, encoding="utf-8")
    
    upload_folder(
        folder_path=str(TEXT_MODEL_DIR),
        repo_id=TEXT_REPO_ID,
        repo_type="model",
        token=TOKEN,
        commit_message="Upload fine-tuned Ph5 Text BERT model weights and tokenizer"
    )
    print(f"✓ Text model successfully uploaded to https://huggingface.co/{TEXT_REPO_ID}")

    # 3. Image Classifier
    print(f"\n[3/3] Uploading Image Classifier to {IMAGE_REPO_ID}...")
    create_repo(repo_id=IMAGE_REPO_ID, repo_type="model", exist_ok=True, token=TOKEN)
    
    # Write model card temporary file
    temp_card = MODELS_DIR / "image" / "README.md"
    temp_card.write_text(IMAGE_MODEL_CARD, encoding="utf-8")
    
    upload_file(
        path_or_fileobj=str(IMAGE_MODEL_FILE),
        path_in_repo="best_model.pth",
        repo_id=IMAGE_REPO_ID,
        repo_type="model",
        token=TOKEN,
        commit_message="Upload fine-tuned Ph5 ResNet-50 visual state dict"
    )
    upload_file(
        path_or_fileobj=str(temp_card),
        path_in_repo="README.md",
        repo_id=IMAGE_REPO_ID,
        repo_type="model",
        token=TOKEN,
        commit_message="Upload ResNet-50 model card"
    )
    if temp_card.exists():
        temp_card.unlink()
    print(f"✓ Image model successfully uploaded to https://huggingface.co/{IMAGE_REPO_ID}")

    print("\n=== All 3 Ph5 Models Uploaded to Hugging Face Successfully! ===")
    print(f"1. URL:   https://huggingface.co/{URL_REPO_ID}")
    print(f"2. Text:  https://huggingface.co/{TEXT_REPO_ID}")
    print(f"3. Image: https://huggingface.co/{IMAGE_REPO_ID}")

if __name__ == "__main__":
    upload_all()
