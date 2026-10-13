# Production image for the PH5 inference API (works on Render, HF Spaces, Railway, Fly, ...)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/tmp/hf \
    OMP_NUM_THREADS=2

# Tesseract for optional OCR on screenshots
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU-only torch keeps the image ~1 GB smaller than the default CUDA build
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copies app/ and, if present in the build context, models/ (otherwise set HF_MODEL_REPO
# so the models are downloaded from the Hugging Face Hub on first start).
COPY . .

RUN useradd -m appuser && chown -R appuser /app
USER appuser

ENV ENVIRONMENT=production PRELOAD_MODELS=false PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
