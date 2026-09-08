#!/usr/bin/env python3
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
import duckdb
from embed import embed
from graph import connect, neighbors

query = str(json.load(sys.stdin).get("query") or "")
qvec = embed(query, "working", 0.5, 0, None)
con = duckdb.connect("/workspace/data/hx-warehouse.duckdb", read_only=True)
try:
    con.execute("LOAD vss")
except Exception:
    pass

out = []
for rule in con.execute("SELECT rule FROM memory.constitution").fetchall():
    out.append({"layer": "constitutional", "text": rule[0], "score": 1.0, "hops": []})

rows = []
try:
    rows = con.execute(
        "SELECT id, layer, list_cosine_similarity(fused, ?::FLOAT[288]) AS sim FROM memory.vectors ORDER BY sim DESC LIMIT 12",
        [qvec],
    ).fetchall()
except Exception:
    rows = []

text_of = {}
for sql, layer in [
    ("SELECT id, prompt || ' → ' || outcome FROM memory.episodes", "episodic"),
    ("SELECT id, text FROM memory.semantic", "semantic"),
    ("SELECT id, trigger || ': ' || action FROM memory.procedural", "procedural"),
]:
    try:
        for rid, text in con.execute(sql).fetchall():
            text_of[str(rid)] = (layer, str(text)[:200])
    except Exception:
        pass

g = connect()
seen = {item["text"] for item in out}
for rid, layer, sim in rows:
    layer_n, text = text_of.get(str(rid), (layer or "semantic", str(rid)))
    if text in seen:
        continue
    hops = neighbors(g, str(rid), 4)
    out.append(
        {
            "layer": layer_n,
            "text": text,
            "score": round(float(sim or 0) + 0.05 * len(hops), 4),
            "hops": [h["text"] for h in hops],
        }
    )
    seen.add(text)

print(json.dumps(out[:16]))
