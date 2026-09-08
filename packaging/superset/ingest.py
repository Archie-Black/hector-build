#!/usr/bin/env python3
import json
import sqlite3
import sys
import time
import uuid
from pathlib import Path

Path("/workspace/data").mkdir(parents=True, exist_ok=True)
con = sqlite3.connect("/workspace/data/hx-metrics.db")
con.executescript(
    """
CREATE TABLE IF NOT EXISTS hx_jobs (
  id TEXT PRIMARY KEY, at INTEGER NOT NULL, voice TEXT NOT NULL,
  prompt TEXT NOT NULL, ok INTEGER NOT NULL, spend INTEGER NOT NULL, lanes INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hx_lanes (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL, role TEXT NOT NULL, title TEXT NOT NULL,
  crew INTEGER NOT NULL, status TEXT NOT NULL, at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hx_traces (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL, name TEXT NOT NULL, ok INTEGER NOT NULL,
  detail TEXT NOT NULL, at INTEGER NOT NULL
);
"""
)
payload = json.load(sys.stdin)
now = int(time.time() * 1000)
con.execute(
    "INSERT OR REPLACE INTO hx_jobs VALUES (?,?,?,?,?,?,?)",
    (
        payload["id"],
        now,
        payload["voice"],
        str(payload.get("prompt", ""))[:500],
        int(bool(payload.get("ok"))),
        int(payload.get("spend") or 0),
        len(payload.get("lanes") or []),
    ),
)
for lane in payload.get("lanes") or []:
    con.execute(
        "INSERT OR REPLACE INTO hx_lanes VALUES (?,?,?,?,?,?,?)",
        (
            lane["id"],
            payload["id"],
            lane.get("role", ""),
            str(lane.get("title", ""))[:200],
            int(lane.get("crew") or 1),
            lane.get("status", "queued"),
            now,
        ),
    )
for tr in (payload.get("traces") or [])[:40]:
    con.execute(
        "INSERT OR REPLACE INTO hx_traces VALUES (?,?,?,?,?,?)",
        (
            str(uuid.uuid4()),
            payload["id"],
            tr.get("name", ""),
            int(bool(tr.get("ok"))),
            str(tr.get("detail", ""))[:400],
            now,
        ),
    )
con.commit()
con.close()
print("ok")
