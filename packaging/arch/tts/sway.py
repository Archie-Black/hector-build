"""F5-TTS sway sampling. t' = t + c (cos(π t / 2) − 1 + t). Default c = −1."""
from __future__ import annotations
import math


def sway(nfe: int = 7, coef: float = -1.0) -> list[float]:
    n = max(2, int(nfe))
    out = []
    for i in range(n):
        t = i / (n - 1)
        out.append(t + coef * (math.cos(math.pi / 2 * t) - 1 + t))
    return out
