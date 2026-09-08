#!/usr/bin/env python3
"""Build the Spectral HX DuckDB warehouse: memory lattice + SQL datasets."""
from __future__ import annotations

from pathlib import Path

import duckdb

ROOT = Path("/workspace/data")
ROOT.mkdir(parents=True, exist_ok=True)
DB = ROOT / "hx-warehouse.duckdb"
con = duckdb.connect(str(DB))

con.execute("CREATE SCHEMA IF NOT EXISTS memory")
con.execute("CREATE SCHEMA IF NOT EXISTS ref")
con.execute("CREATE SCHEMA IF NOT EXISTS catalog")

con.execute(
    """
CREATE TABLE IF NOT EXISTS memory.working (key TEXT PRIMARY KEY, value TEXT, ts BIGINT);
CREATE TABLE IF NOT EXISTS memory.episodes (
  id TEXT PRIMARY KEY, ts BIGINT, voice TEXT, prompt TEXT,
  outcome TEXT, ok BOOLEAN, spend INTEGER, traces TEXT
);
CREATE TABLE IF NOT EXISTS memory.semantic (
  id TEXT PRIMARY KEY, kind TEXT, text TEXT, salience DOUBLE, hits INTEGER, last_hit BIGINT
);
CREATE TABLE IF NOT EXISTS memory.procedural (
  id TEXT PRIMARY KEY, trigger TEXT, action TEXT, evidence TEXT, salience DOUBLE
);
CREATE TABLE IF NOT EXISTS memory.constitution (
  id TEXT PRIMARY KEY, rule TEXT, immutable BOOLEAN
);
CREATE TABLE IF NOT EXISTS ref.http_status (code INTEGER PRIMARY KEY, phrase TEXT, class TEXT);
CREATE TABLE IF NOT EXISTS ref.languages (id TEXT PRIMARY KEY, name TEXT, paradigm TEXT);
"""
)

rules = [
    ("c1", "Never delete tests to make them pass."),
    ("c2", "Label LIVE vs STUB. Never fake a host terminal, package install, or cloud VM."),
    ("c3", "Read before you write."),
    ("c4", "If a tool refuses, stop that path and say so."),
    ("c5", "Once a project is granted, do not ask permission for each small task inside it."),
]
for rid, rule in rules:
    con.execute("INSERT OR REPLACE INTO memory.constitution VALUES (?, ?, TRUE)", [rid, rule])

http = [
    (200, "OK", "success"),
    (201, "Created", "success"),
    (204, "No Content", "success"),
    (301, "Moved Permanently", "redirect"),
    (304, "Not Modified", "redirect"),
    (400, "Bad Request", "client"),
    (401, "Unauthorized", "client"),
    (403, "Forbidden", "client"),
    (404, "Not Found", "client"),
    (409, "Conflict", "client"),
    (422, "Unprocessable Entity", "client"),
    (429, "Too Many Requests", "client"),
    (500, "Internal Server Error", "server"),
    (502, "Bad Gateway", "server"),
    (503, "Service Unavailable", "server"),
]
con.executemany("INSERT OR REPLACE INTO ref.http_status VALUES (?, ?, ?)", http)
con.executemany(
    "INSERT OR REPLACE INTO ref.languages VALUES (?, ?, ?)",
    [
        ("ts", "TypeScript", "multi"),
        ("py", "Python", "multi"),
        ("rs", "Rust", "systems"),
        ("go", "Go", "systems"),
        ("sql", "SQL", "declarative"),
        ("sqlglot", "SQLGlot", "compiler"),
        ("duckdb", "DuckDB SQL", "analytical"),
    ],
)

tpch = False
try:
    con.execute("INSTALL tpch")
    con.execute("LOAD tpch")
    con.execute("CALL dbgen(sf=0.01)")
    tpch = True
except Exception as exc:  # noqa: BLE001
    print("STUB TPC-H:", type(exc).__name__, exc)

metrics = Path("/workspace/data/hx-metrics.db")
if metrics.exists():
    try:
        con.execute(f"ATTACH '{metrics}' AS metrics (TYPE SQLITE)")
    except Exception as exc:  # noqa: BLE001
        print("STUB attach metrics:", exc)

rows = [
    ("memory.episodes", "episodic agent memory", "LIVE"),
    ("memory.semantic", "salient facts", "LIVE"),
    ("memory.procedural", "playbooks", "LIVE"),
    ("memory.constitution", "immutable rules", "LIVE"),
    ("ref.http_status", "HTTP status catalog", "LIVE"),
    ("ref.languages", "language catalog", "LIVE"),
    ("DuckDB 1.5", "in-process SQL engine", "LIVE"),
    ("Polars 1.44", "dataframe library", "LIVE"),
]
if tpch:
    rows.append(("lineitem", "TPC-H SF 0.01", "LIVE"))
rows.append(("memory.vectors", "288-d fused embeddings", "LIVE"))
rows.append(("kuzu.Memory", "relationship graph", "LIVE"))
con.execute("CREATE TABLE IF NOT EXISTS catalog.datasets (name TEXT PRIMARY KEY, kind TEXT, status TEXT)")
con.executemany("INSERT OR REPLACE INTO catalog.datasets VALUES (?, ?, ?)", rows)

con.execute(
    """
CREATE TABLE IF NOT EXISTS memory.vectors (
  id VARCHAR PRIMARY KEY,
  layer VARCHAR,
  fused FLOAT[288]
)
"""
)
try:
    con.execute("LOAD vss")
except Exception:
    pass

import sys as _sys
from pathlib import Path as _P
from time import time as _time

_sys.path.insert(0, str(_P("/workspace/packaging/memory")))
from embed import embed  # noqa: E402
from graph import connect, upsert_memory, relate  # noqa: E402

now = int(_time() * 1000)
g = connect()
prev = None
for rid, rule in rules:
    fused = embed(rule, "constitutional", 1.0, 9, now)
    con.execute("INSERT OR REPLACE INTO memory.vectors VALUES (?, ?, ?)", [rid, "constitutional", fused])
    upsert_memory(g, rid, "constitutional", rule, 1.0)
    if prev:
        relate(g, "Distills", prev, rid)
    prev = rid

con.close()
print(f"LIVE warehouse {DB} tpch={tpch} kuzu=True")
