#!/usr/bin/env python3
"""Seed the LanceDB vector database from the DuckDB warehouse (extensive)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
import duckdb
from lance_store import upsert

rows: list[dict] = []
con = duckdb.connect("/workspace/data/hx-warehouse.duckdb", read_only=True)

for rid, rule in con.execute("SELECT id, rule FROM memory.constitution").fetchall():
    rows.append({"id": rid, "layer": "constitutional", "text": rule, "kind": "constitution", "salience": 1.0, "hits": 9})
try:
    for rid, text in con.execute("SELECT id, text FROM memory.semantic").fetchall():
        rows.append({"id": rid, "layer": "semantic", "text": text, "kind": "memory"})
except Exception:
    pass
try:
    for rid, prompt, outcome in con.execute("SELECT id, prompt, outcome FROM memory.episodes").fetchall():
        rows.append({"id": rid, "layer": "episodic", "text": f"{prompt} → {outcome}", "kind": "memory"})
except Exception:
    pass
for code, phrase, klass in con.execute("SELECT code, phrase, class FROM ref.http_status").fetchall():
    rows.append({"id": f"http-{code}", "layer": "semantic", "text": f"HTTP {code} {phrase} ({klass})", "kind": "ref"})
for lid, name, paradigm in con.execute("SELECT id, name, paradigm FROM ref.languages").fetchall():
    rows.append({"id": f"lang-{lid}", "layer": "semantic", "text": f"{name} ({paradigm})", "kind": "ref"})
try:
    for name, kind, status in con.execute("SELECT name, kind, status FROM catalog.datasets").fetchall():
        rows.append({"id": f"ds-{name}", "layer": "semantic", "text": f"{name}: {kind} [{status}]", "kind": "catalog"})
except Exception:
    pass
for table, col, prefix in [
    ("nation", "n_name", "nation"),
    ("region", "r_name", "region"),
    ("part", "p_name", "part"),
]:
    try:
        for i, (val,) in enumerate(con.execute(f"SELECT {col} FROM {table} LIMIT 4000").fetchall()):
            rows.append({"id": f"{prefix}-{i}", "layer": "semantic", "text": str(val), "kind": "tpch"})
    except Exception:
        pass

n = upsert(rows)
print(f"LIVE LanceDB {n} vectors")
