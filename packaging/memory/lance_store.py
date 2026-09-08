"""LanceDB vector store for Spectral HX."""
from __future__ import annotations

from pathlib import Path
import sys

import lancedb
import numpy as np

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
from embed import DIM, embed

URI = "/workspace/data/hx-lancedb"
TABLE = "lattice"


def connect():
    Path("/workspace/data").mkdir(parents=True, exist_ok=True)
    return lancedb.connect(URI)


def upsert(rows: list[dict]) -> int:
    if not rows:
        return 0
    db = connect()
    payload = []
    for row in rows:
        vec = row.get("vector") or embed(str(row.get("text") or ""), str(row.get("layer") or "semantic"), float(row.get("salience") or 0.5), int(row.get("hits") or 0), None)
        payload.append(
            {
                "id": str(row["id"]),
                "layer": str(row.get("layer") or "semantic"),
                "text": str(row.get("text") or "")[:400],
                "kind": str(row.get("kind") or "memory"),
                "vector": np.asarray(vec, dtype="float32").tolist(),
            }
        )
    names = db.list_tables() if hasattr(db, "list_tables") else db.table_names()
    if TABLE in names:
        tbl = db.open_table(TABLE)
        try:
            tbl.delete("id IN (" + ", ".join(repr(r["id"]) for r in payload) + ")")
        except Exception:
            pass
        tbl.add(payload)
    else:
        db.create_table(TABLE, payload)
    return len(payload)


def search(text: str, k: int = 12, layers: list[str] | None = None) -> list[dict]:
    db = connect()
    names = db.list_tables() if hasattr(db, "list_tables") else db.table_names()
    if TABLE not in names:
        return []
    tbl = db.open_table(TABLE)
    q = np.asarray(embed(text, "working", 0.5, 0, None), dtype="float32")
    hits = tbl.search(q).limit(max(k * 3, k)).to_list()
    out = []
    for hit in hits:
        layer = str(hit.get("layer") or "semantic")
        if layers and layer not in layers:
            continue
        dist = float(hit.get("_distance") or 0)
        out.append(
            {
                "id": str(hit.get("id") or ""),
                "layer": layer,
                "text": str(hit.get("text") or ""),
                "score": round(1.0 / (1.0 + dist), 4),
                "kind": str(hit.get("kind") or "memory"),
            }
        )
        if len(out) >= k:
            break
    return out
