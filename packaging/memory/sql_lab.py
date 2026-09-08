#!/usr/bin/env python3
import json, sys
import duckdb

payload = json.load(sys.stdin)
sql = str(payload.get("sql") or "").strip()
head = (sql.split() or [""])[0].upper()
if head not in {"SELECT", "WITH", "EXPLAIN", "SHOW", "DESCRIBE", "PRAGMA", "FROM"}:
    print(json.dumps({"ok": False, "error": "SQL Lab is read-only: SELECT / WITH / EXPLAIN.", "columns": [], "rows": []}))
    raise SystemExit(0)
con = duckdb.connect("/workspace/data/hx-warehouse.duckdb", read_only=True)
con.execute("SET memory_limit='256MB'")
rel = con.execute(sql)
cols = [c[0] for c in rel.description]
rows = []
for r in rel.fetchmany(200):
    rows.append(["" if v is None else str(v) for v in r])
print(json.dumps({"ok": True, "columns": cols, "rows": rows}))
