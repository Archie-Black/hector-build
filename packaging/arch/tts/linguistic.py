"""Look-ahead phrasing. Whole sentence. Never a character stop."""
from __future__ import annotations
import re

SWAP = [
    (re.compile(r"\bOS\s*V01D\b", re.I), "oh ess void"),
    (re.compile(r"\bOS VOID\b", re.I), "oh ess void"),
    (re.compile(r"\bSpectral HX\b", re.I), "spectral H X"),
    (re.compile(r"\bTTS\b"), "tee tee ess"),
    (re.compile(r"\bAPI\b"), "A P I"),
]


def sayable(text: str) -> str:
    s = text
    for rx, to in SWAP:
        s = rx.sub(to, s)
    return re.sub(r"\s+", " ", s).strip()


def syllables(word: str) -> int:
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    return max(1, len(re.findall(r"[aeiouy]+", w)))


def plan(text: str) -> list[dict]:
    clean = sayable(text)
    parts = [p for p in re.split(r"(?<=[,;:.\—–!?])\s+", clean) if p]
    out = []
    syl = 0
    for part in parts:
        end = part[-1] if part else ""
        pause = 280 if end in ".!?" else 180 if end in ";:" else 120 if end == "," else 90
        words = [w for w in re.sub(r"[,;:.\—–!?]", "", part).split() if w]
        n = sum(syllables(w) for w in words)
        syl += n
        breath = syl >= 12
        if breath:
            syl = 0
        last = words[-1] if words else ""
        out.append(
            {
                "spoken": part,
                "pause_ms": pause,
                "stress": len(last) > 4 or (last[:1].isupper() if last else False),
                "breath": breath,
            }
        )
    return out or [{"spoken": clean, "pause_ms": 200, "stress": False, "breath": False}]


def spoken(text: str) -> str:
    return " ".join(b["spoken"] + ("," if b["breath"] else "") for b in plan(text))
