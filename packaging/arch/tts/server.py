#!/usr/bin/env python3
"""Predictive TTS. /v1/speech/predictive. Diplomat only. Machine never wakes this process for exec."""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from dit_runtime import infer, providers, ready
from linguistic import plan, spoken

HOST = os.environ.get("OSV01D_TTS_HOST", "127.0.0.1")
PORT = int(os.environ.get("OSV01D_TTS_PORT", "8090"))
ROOT = Path(os.environ.get("OSV01D_TTS_ROOT", "/opt/osv01d/tts"))


def wav_espeak(text: str) -> bytes | None:
    bin_name = shutil.which("espeak-ng") or shutil.which("espeak")
    if not bin_name:
        return None
    out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    out.close()
    try:
        subprocess.run(
            [bin_name, "-v", "en-us+m3", "-s", "118", "-p", "38", "-w", out.name, text],
            check=True,
            capture_output=True,
            timeout=20,
        )
        return Path(out.name).read_bytes()
    except Exception:
        return None
    finally:
        Path(out.name).unlink(missing_ok=True)


def synthesize(text: str, nfe: int, coef: float) -> tuple[bytes | None, str, list]:
    beats = plan(text)
    line = spoken(text)
    pcm = infer(line, nfe, coef)
    if pcm:
        return pcm, "dit", beats
    pcm = wav_espeak(line)
    if pcm:
        return pcm, "espeak-paul", beats
    return None, "plan", beats


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        return

    def _json(self, code: int, obj: dict) -> None:
        raw = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/health":
            self._json(200, {"ok": True, "dit": ready(), "providers": providers()})
            return
        self._json(404, {"ok": False})

    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") != "/v1/speech/predictive":
            self._json(404, {"ok": False})
            return
        n = int(self.headers.get("content-length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if body.get("core") == "machine":
            self.send_response(204)
            self.send_header("x-v01d-tts", "machine-silent")
            self.end_headers()
            return
        text = str(body.get("text") or "").strip()
        if not text:
            self._json(400, {"ok": False, "error": "empty"})
            return
        nfe = int(body.get("nfe") or 7)
        coef = float(body.get("sway") or -1)
        audio, engine, beats = synthesize(text, nfe, coef)
        if audio:
            self.send_response(200)
            self.send_header("content-type", "audio/wav")
            self.send_header("x-v01d-engine", engine)
            self.send_header("content-length", str(len(audio)))
            self.end_headers()
            self.wfile.write(audio)
            return
        self._json(200, {"ok": True, "engine": engine, "spoken": spoken(text), "plan": beats, "dit": ready()})


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
