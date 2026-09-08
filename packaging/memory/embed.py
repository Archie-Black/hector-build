"""Meta-dynamic embeddings: content projection + live metadata fusion."""
from __future__ import annotations

import hashlib
import math
import time

DIM_CONTENT = 256
DIM_META = 32
DIM = DIM_CONTENT + DIM_META
LAYERS = ("working", "episodic", "semantic", "procedural", "constitutional")


def _token_vec(token: str) -> list[float]:
    digest = hashlib.blake2b(token.encode("utf-8"), digest_size=32).digest()
    vec = [0.0] * DIM_CONTENT
    for i in range(0, 32, 2):
        idx = digest[i] % DIM_CONTENT
        sign = 1.0 if digest[i + 1] & 1 else -1.0
        vec[idx] += sign
    return vec


def content_embed(text: str) -> list[float]:
    tokens = [t for t in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if len(t) > 1]
    acc = [0.0] * DIM_CONTENT
    if not tokens:
        return acc
    for tok in tokens[:80]:
        part = _token_vec(tok)
        for i, v in enumerate(part):
            acc[i] += v
    norm = math.sqrt(sum(v * v for v in acc)) or 1.0
    return [v / norm for v in acc]


def meta_embed(layer: str, salience: float, hits: int, last_hit_ms: int) -> list[float]:
    """Recomputed every write/hit — this is the dynamic half."""
    now = int(time.time() * 1000)
    age_days = max(0.0, (now - (last_hit_ms or now)) / 86400000.0)
    recency = math.exp(-age_days / 14.0)
    vec = [0.0] * DIM_META
    if layer in LAYERS:
        vec[LAYERS.index(layer)] = 1.0
    vec[8] = max(0.0, min(1.0, salience))
    vec[9] = math.log1p(max(0, hits)) / 8.0
    vec[10] = recency
    vec[11] = 1.0 if layer == "constitutional" else 0.0
    return vec


def fuse(content: list[float], meta: list[float]) -> list[float]:
    fused = content + meta
    norm = math.sqrt(sum(v * v for v in fused)) or 1.0
    return [v / norm for v in fused]


def embed(text: str, layer: str, salience: float = 0.5, hits: int = 0, last_hit_ms: int | None = None) -> list[float]:
    last = last_hit_ms if last_hit_ms is not None else int(time.time() * 1000)
    return fuse(content_embed(text), meta_embed(layer, salience, hits, last))


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))
