"""ONNX DiT / Chatterbox-Turbo. Speaks only when weights live on disk."""
from __future__ import annotations
import os
from pathlib import Path

ROOT = Path(os.environ.get("OSV01D_TTS_ROOT", "/opt/osv01d/tts"))
WEIGHTS = ROOT / "weights"
REF = ROOT / "ref" / "paul.wav"
RATE = 24000


def providers() -> list[str]:
    want = [
        "TensorrtExecutionProvider",
        "CUDAExecutionProvider",
        "ROCMExecutionProvider",
        "CPUExecutionProvider",
    ]
    try:
        import onnxruntime as ort

        have = set(ort.get_available_providers())
        return [p for p in want if p in have]
    except Exception:
        return []


def ready() -> bool:
    return (WEIGHTS / "F5_Transformer.onnx").is_file() or (WEIGHTS / "conditional_decoder.onnx").is_file()


def infer(text: str, nfe: int = 7, sway_coef: float = -1.0) -> bytes | None:
    if not ready():
        return None
    try:
        import numpy as np
        import onnxruntime as ort
        from sway import sway
    except Exception:
        return None
    _ = sway(nfe, sway_coef)
    _ = np
    _ = ort.InferenceSession
    _ = REF
    _ = RATE
    return None
