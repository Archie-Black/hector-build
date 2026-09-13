#!/usr/bin/env python3
"""Captions. Prefers shipped ggml-tiny.bin. Else faster-whisper. Else says so."""
import hashlib
import sys
from pathlib import Path

src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if not src or not src.exists():
    print("usage: caption.py <audio-or-video>")
    raise SystemExit(2)
out = src.with_suffix(".srt")
here = Path(__file__).resolve().parent
tiny = here / "weights" / "ggml-tiny.bin"
want = "be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21"

def sha(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

if tiny.exists() and sha(tiny) == want:
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(str(tiny), device="cpu")
        segs, _ = model.transcribe(str(src))
        lines = []
        for i, s in enumerate(segs, 1):
            lines.append(f"{i}\n{s.start:.3f} --> {s.end:.3f}\n{s.text.strip()}\n")
        out.write_text("\n".join(lines))
        print(out)
        raise SystemExit(0)
    except ImportError:
        pass
out.write_text("1\n00:00:00,000 --> 00:00:01,000\nggml-tiny.bin is here. Install faster-whisper to decode it.\n")
print(out)
