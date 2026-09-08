#!/usr/bin/env python3
"""Run a memory query with the selected Syntax / vector-store engines."""
from __future__ import annotations

import json, sys
from pathlib import Path

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
from syntax_parse import parse_syntax
from graph import connect, neighbors

payload = json.load(sys.stdin)
raw = str(payload.get("query") or "")
system = payload.get("querySystem") or "keyword"
store = payload.get("vectorStore") or "duckdb"
parsed = parse_syntax(raw)
match = parsed.get("match") or raw
k = int(parsed.get("k") or 12)
layers = parsed.get("layers") or []
min_score = float(parsed.get("minScore") or 0)

items: list[dict] = []
if store == "lancedb":
    from lance_store import search

    items = search(match, k=k, layers=layers or None)
else:
    # DuckDB VSS path (default)
    import duckdb
    from embed import embed

    qvec = embed(match, "working", 0.5, 0, None)
    con = duckdb.connect("/workspace/data/hx-warehouse.duckdb", read_only=True)
    try:
        con.execute("LOAD vss")
        rows = con.execute(
            "SELECT id, layer, list_cosine_similarity(fused, ?::FLOAT[288]) AS sim FROM memory.vectors ORDER BY sim DESC LIMIT ?",
            [qvec, k * 2],
        ).fetchall()
    except Exception:
        rows = []
    text_of = {}
    for sql, layer in [
        ("SELECT id, prompt || ' → ' || outcome FROM memory.episodes", "episodic"),
        ("SELECT id, text FROM memory.semantic", "semantic"),
        ("SELECT id, trigger || ': ' || action FROM memory.procedural", "procedural"),
        ("SELECT id, rule FROM memory.constitution", "constitutional"),
    ]:
        try:
            for rid, text in con.execute(sql).fetchall():
                text_of[str(rid)] = (layer, str(text)[:200])
        except Exception:
            pass
    for rid, layer, sim in rows:
        layer_n, text = text_of.get(str(rid), (layer or "semantic", str(rid)))
        items.append({"id": str(rid), "layer": layer_n, "text": text, "score": round(float(sim or 0), 4), "hops": []})

if layers:
    items = [it for it in items if it.get("layer") in layers]
if min_score:
    items = [it for it in items if float(it.get("score") or 0) >= min_score]

if parsed.get("hopDepth"):
    g = connect()
    for it in items:
        hops = neighbors(g, str(it.get("id") or ""), 4)
        it["hops"] = [h["text"] for h in hops]

# keyword mode still prepends constitution
if system == "keyword":
    front = [
        {"layer": "constitutional", "text": "Never delete tests to make them pass.", "score": 1.0, "hops": []},
    ]
    seen = {front[0]["text"]}
    merged = front[:]
    for it in items:
        if it["text"] not in seen:
            merged.append(it)
            seen.add(it["text"])
    items = merged

print(json.dumps(items[:k]))
