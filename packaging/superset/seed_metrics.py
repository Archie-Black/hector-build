"""SQLite warehouse Apache Superset queries for Spectral HX parallel bots."""
from __future__ import annotations

import sqlite3
from pathlib import Path

DB = Path("/workspace/data/hx-metrics.db")
DB.parent.mkdir(parents=True, exist_ok=True)

ddl = """
CREATE TABLE IF NOT EXISTS hx_jobs (
  id TEXT PRIMARY KEY,
  at INTEGER NOT NULL,
  voice TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ok INTEGER NOT NULL,
  spend INTEGER NOT NULL,
  lanes INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hx_lanes (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  crew INTEGER NOT NULL,
  status TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hx_traces (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ok INTEGER NOT NULL,
  detail TEXT NOT NULL,
  at INTEGER NOT NULL
);
"""

con = sqlite3.connect(DB)
con.executescript(ddl)
con.commit()
con.close()
print(f"LIVE metrics warehouse {DB}")
