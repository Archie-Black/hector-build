"""Parse Spectral Syntax queries."""
from __future__ import annotations

import re


def looks_like_syntax(src: str) -> bool:
    return bool(re.match(r"^(FROM|MATCH|LAYER|HOP|K|WHERE|SYNTAX)\b", src.strip(), re.I))


def parse_syntax(src: str) -> dict:
    text = src.strip()
    query = {
        "from": "lattice",
        "match": "" if looks_like_syntax(text) else text.strip("\"'"),
        "layers": [],
        "hopRel": None,
        "hopDepth": 0,
        "k": 12,
        "minScore": 0.0,
    }
    if not looks_like_syntax(text):
        return query
    blob = " ".join(line.strip() for line in text.splitlines() if line.strip() and not line.strip().startswith("#"))
    tokens = re.findall(r"\"[^\"]*\"|'[^']*'|\S+", blob)
    i = 0
    stop = {"FROM", "MATCH", "LAYER", "LAYERS", "HOP", "K", "WHERE", "SYNTAX"}
    while i < len(tokens):
        tok = tokens[i].upper()
        if tok == "SYNTAX":
            i += 1
            continue
        if tok == "FROM" and i + 1 < len(tokens):
            query["from"] = tokens[i + 1].strip(";,")
            i += 2
            continue
        if tok == "MATCH" and i + 1 < len(tokens):
            query["match"] = tokens[i + 1].strip("\"'")
            i += 2
            continue
        if tok in {"LAYER", "LAYERS"}:
            i += 1
            while i < len(tokens) and tokens[i].upper() not in stop:
                name = tokens[i].strip(";,").lower()
                if name:
                    query["layers"].append(name)
                i += 1
            continue
        if tok == "HOP" and i + 1 < len(tokens):
            query["hopRel"] = tokens[i + 1].strip(";,")
            i += 2
            if i < len(tokens) and tokens[i].isdigit():
                query["hopDepth"] = int(tokens[i])
                i += 1
            else:
                query["hopDepth"] = 1
            continue
        if tok == "K" and i + 1 < len(tokens):
            query["k"] = max(1, min(50, int(re.sub(r"\D", "", tokens[i + 1]) or 12)))
            i += 2
            continue
        if tok == "WHERE":
            i += 1
            continue
        if "SIMILAR" in tok or tok in {">=", "GT"}:
            nxt = tokens[i + 1] if i + 1 < len(tokens) else tokens[i]
            try:
                query["minScore"] = float(re.sub(r"[^0-9.]", "", nxt) or 0)
            except ValueError:
                pass
            i += 2
            continue
        i += 1
    return query
