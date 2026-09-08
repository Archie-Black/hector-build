#!/usr/bin/env python3
import json, sys, time, uuid
from pathlib import Path

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
import duckdb
from embed import cosine, embed
from graph import assigned, connect, relate, upsert_memory, used_tool

payload = json.load(sys.stdin)
eid = payload["id"]
sem_id = str(uuid.uuid4())
proc_id = str(uuid.uuid4())
now = int(time.time() * 1000)
ok = bool(payload.get("ok"))
prompt = str(payload.get("prompt", ""))[:500]
outcome = str(payload.get("outcome", ""))[:400]
traces = str(payload.get("traces", ""))[:2000]
voice = payload.get("voice", "hx")

con = duckdb.connect("/workspace/data/hx-warehouse.duckdb")
try:
    con.execute("LOAD vss")
except Exception:
    pass
con.execute(
    """
CREATE TABLE IF NOT EXISTS memory.vectors (
  id VARCHAR PRIMARY KEY,
  layer VARCHAR,
  fused FLOAT[288]
)
"""
)
con.execute(
    "INSERT OR REPLACE INTO memory.episodes VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [eid, now, voice, prompt, outcome, ok, int(payload.get("spend") or 0), traces],
)
sal = 0.8 if ok else 0.4
con.execute(
    "INSERT OR REPLACE INTO memory.semantic VALUES (?, ?, ?, ?, ?, ?)",
    [sem_id, "lesson", outcome[:240], sal, 1, now],
)
if ok:
    con.execute(
        "INSERT OR REPLACE INTO memory.procedural VALUES (?, ?, ?, ?, ?)",
        [proc_id, prompt[:80], "repeat the successful tool path", traces[:200], 0.6],
    )

items = [
    (eid, "episodic", f"{prompt} → {outcome}", 0.7 if ok else 0.4, 1),
    (sem_id, "semantic", outcome[:240], sal, 1),
]
if ok:
    items.append((proc_id, "procedural", prompt[:80], 0.6, 1))

existing = con.execute("SELECT id, fused FROM memory.vectors").fetchall()
for mid, layer, text, salience, hits in items:
    fused = embed(text, layer, salience, hits, now)
    con.execute("INSERT OR REPLACE INTO memory.vectors VALUES (?, ?, ?)", [mid, layer, fused])
    for oid, ofused in existing:
        if oid == mid:
            continue
        sim = cosine(fused, list(ofused))
        if sim >= 0.82:
            # similar edges written in kuzu below
            payload.setdefault("_similar", []).append((mid, oid, sim))

con.close()

g = connect()
upsert_memory(g, eid, "episodic", f"{prompt} → {outcome}", 0.7 if ok else 0.4)
upsert_memory(g, sem_id, "semantic", outcome[:240], sal)
relate(g, "Distills", eid, sem_id)
if ok:
    upsert_memory(g, proc_id, "procedural", prompt[:80], 0.6)
    relate(g, "Distills", sem_id, proc_id)
assigned(g, eid, voice)
for tool in [t.strip() for t in traces.split(",") if t.strip()][:8]:
    used_tool(g, eid, tool)
for src, dst, sim in payload.get("_similar", [])[:12]:
    relate(g, "Similar", src, dst, sim)
print("ok")
