#!/usr/bin/env python3
"""Gamma sidecar. Talks to Hector. Does not replace Hector."""
from __future__ import annotations

import json
import os
import time
import urllib.request

NODE = os.environ.get("SENTINEL_NODE", "http://127.0.0.1:8080")
OLLAMA = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
IDLE = int(os.environ.get("SENTINEL_IDLE_SEC", "900"))


def post(path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload or {}).encode()
    req = urllib.request.Request(
        NODE + path,
        data=data,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "{}")


def get(path: str) -> dict:
    with urllib.request.urlopen(NODE + path, timeout=15) as r:
        return json.loads(r.read().decode() or "{}")


def ollama_ok() -> bool:
    try:
        urllib.request.urlopen(OLLAMA + "/api/tags", timeout=2)
        return True
    except Exception:
        return False


def loop() -> None:
    last = time.time()
    while True:
        time.sleep(30)
        try:
            body = get("/api/v1/sentinel/kpis")
        except Exception:
            continue
        soma = body.get("soma") or {}
        idle = float(soma.get("idleMs") or 0) / 1000.0
        if idle >= IDLE and time.time() - last >= 60:
            try:
                out = post("/api/v1/sentinel/kpis", {})
                print("dream", out.get("note"), "ollama", ollama_ok(), flush=True)
            except Exception as e:
                print("dream-fail", e, flush=True)
            last = time.time()


if __name__ == "__main__":
    print("sentinel gamma sidecar. node=", NODE, flush=True)
    loop()
