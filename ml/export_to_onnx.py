import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from pathlib import Path
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import onnxruntime as ort
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "backend" / "models"

URL_DIR = MODELS_DIR / "url" / "distilbert_url"
TEXT_DIR = MODELS_DIR / "text" / "bert_finetuned"

def export_model(model_dir: Path, onnx_name: str, num_classes: int, sample_text: str, max_len: int = 64):
    print(f"\n==========================================")
    print(f"Exporting model from: {model_dir}")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.eval()

    onnx_path = model_dir / onnx_name

    # Create dummy inputs
    inputs = tokenizer(sample_text, truncation=True, padding="max_length", max_length=max_len, return_tensors="pt")
    dummy_input_ids = inputs["input_ids"]
    dummy_attention_mask = inputs["attention_mask"]

    input_names = ["input_ids", "attention_mask"]
    output_names = ["logits"]
    dynamic_axes = {
        "input_ids": {0: "batch_size", 1: "sequence_length"},
        "attention_mask": {0: "batch_size", 1: "sequence_length"},
        "logits": {0: "batch_size"}
    }

    print(f"Exporting to ONNX: {onnx_path}...")
    torch.onnx.export(
        model,
        (dummy_input_ids, dummy_attention_mask),
        str(onnx_path),
        input_names=input_names,
        output_names=output_names,
        dynamic_axes=dynamic_axes,
        opset_version=14,
        do_constant_folding=True,
        dynamo=False,
    )
    print(f"Export successful! File size: {onnx_path.stat().st_size / (1024 * 1024):.2f} MB")

    # Verify with onnxruntime
    print("Verifying ONNX Runtime inference against PyTorch...")
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    
    # Run PyTorch
    with torch.no_grad():
        pt_out = model(dummy_input_ids, attention_mask=dummy_attention_mask).logits.numpy()

    # Run ONNX
    ort_inputs = {
        "input_ids": dummy_input_ids.numpy(),
        "attention_mask": dummy_attention_mask.numpy()
    }
    ort_out = session.run(["logits"], ort_inputs)[0]

    diff = np.max(np.abs(pt_out - ort_out))
    print(f"Max absolute difference between PyTorch and ONNX: {diff:.6f}")
    assert diff < 1e-4, f"Discrepancy too large: {diff}"
    print(f"Validation PASSED! Predictions match perfectly!")
    return onnx_path

if __name__ == "__main__":
    if URL_DIR.is_dir():
        export_model(URL_DIR, "model.onnx", num_classes=3, sample_text="https://google.com", max_len=64)
    if TEXT_DIR.is_dir():
        export_model(TEXT_DIR, "model.onnx", num_classes=2, sample_text="URGENT: Verify your bank account now.", max_len=256)
    print("\nALL MODELS EXPORTED TO ONNX SUCCESSFULLY!")
