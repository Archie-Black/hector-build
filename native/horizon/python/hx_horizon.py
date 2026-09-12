"""Spectral HX world tick for Hector. ctypes into lib not required — pure sim of the C++ contract."""
from __future__ import annotations

import json
import struct
from pathlib import Path

FNV = 1469598103934665603
PRM = 1099511628211


def knot(b: bytes) -> int:
    h = FNV
    for x in b:
        h ^= x
        h = (h * PRM) & 0xFFFFFFFFFFFFFFFF
    return h


def step(state: dict) -> dict:
    tick = int(state.get("tick", 0)) + 1
    x = float(state.get("x", 0.0)) + 1.0 / 60.0 * 0.01
    inv = knot(struct.pack("<Id", tick, x))
    return {"tick": tick, "x": x, "inv": inv, "act": tick % 4}


def persist(path: str, state: dict) -> None:
    Path(path).write_text(json.dumps(state), encoding="utf-8")


if __name__ == "__main__":
    s = {"tick": 0, "x": 0.0}
    for _ in range(240):
        s = step(s)
    print(json.dumps(s))
