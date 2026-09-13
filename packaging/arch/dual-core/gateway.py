#!/usr/bin/env python3
"""Stdin or FIFO gateway. Machine vs diplomat. Diplomat never execs. Diplomat speaks. Machine is silent."""
import json
import logging
import os
import re
import sys
import urllib.error
import urllib.request

os.makedirs("/var/log/osv01d", exist_ok=True)
os.makedirs("/run/osv01d", exist_ok=True)
machine = logging.getLogger("machine")
diplomat = logging.getLogger("diplomat")
machine.addHandler(logging.FileHandler("/var/log/osv01d/machine.log"))
diplomat.addHandler(logging.FileHandler("/var/log/osv01d/diplomat.log"))
machine.setLevel(logging.INFO)
diplomat.setLevel(logging.INFO)

MACHINE = re.compile(r"^(calculate|compute|run|execute|sandbox|delete|move|compile|build|ffmpeg|exiftool|ffprobe|pack)\b", re.I)
ALLOW = {"ffmpeg", "exiftool", "ffprobe"}
FIFO = "/run/osv01d/cores.in"
TTS = os.environ.get("OSV01D_TTS_URL", "http://127.0.0.1:8090/v1/speech/predictive")


def which(text: str) -> str:
    t = text.strip()
    if MACHINE.search(t) or re.search(r"\.[a-z0-9]{2,4}\s*$", t, re.I):
        return "machine"
    return "diplomat"


def speak(text: str) -> None:
    raw = json.dumps({"text": text, "core": "diplomat", "nfe": 7, "sway": -1}).encode()
    req = urllib.request.Request(TTS, data=raw, headers={"content-type": "application/json"}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=8).read()
    except (urllib.error.URLError, TimeoutError, OSError):
        diplomat.info("tts offline")


def handle(text: str) -> str:
    core = which(text)
    if core == "diplomat":
        diplomat.info(text)
        speak(text)
        return "diplomat: standing by"
    bin_name = text.split()[0].lower()
    if bin_name not in ALLOW:
        machine.info("refuse %s", text)
        return "machine: that bin is not on the list"
    machine.info("allow %s", bin_name)
    return f"machine: {bin_name}"


def lines():
    if sys.stdin.isatty():
        yield from sys.stdin
        return
    if not os.path.exists(FIFO):
        os.mkfifo(FIFO)
    while True:
        with open(FIFO, encoding="utf-8") as pipe:
            for line in pipe:
                yield line


def main() -> None:
    try:
        os.nice(-20)
    except OSError:
        pass
    for line in lines():
        text = line.strip()
        if not text:
            continue
        if text.lower() in {"exit", "quit"}:
            break
        print(handle(text), flush=True)


if __name__ == "__main__":
    main()
