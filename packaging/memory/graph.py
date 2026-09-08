"""Kuzu graph of memory relationships."""
from __future__ import annotations

from pathlib import Path

import kuzu

GRAPH = "/workspace/data/hx-graph.kuzu"


def connect() -> kuzu.Connection:
    Path("/workspace/data").mkdir(parents=True, exist_ok=True)
    db = kuzu.Database(GRAPH)
    conn = kuzu.Connection(db)
    ddl = [
        "CREATE NODE TABLE Memory(id STRING, layer STRING, text STRING, salience DOUBLE, PRIMARY KEY(id))",
        "CREATE NODE TABLE Tool(name STRING, PRIMARY KEY(name))",
        "CREATE NODE TABLE Agent(role STRING, PRIMARY KEY(role))",
        "CREATE REL TABLE Distills(FROM Memory TO Memory)",
        "CREATE REL TABLE Similar(FROM Memory TO Memory, score DOUBLE)",
        "CREATE REL TABLE Next(FROM Memory TO Memory)",
        "CREATE REL TABLE Used(FROM Memory TO Tool)",
        "CREATE REL TABLE Assigned(FROM Memory TO Agent)",
    ]
    for stmt in ddl:
        try:
            conn.execute(stmt)
        except Exception:
            pass
    return conn


def upsert_memory(conn: kuzu.Connection, mid: str, layer: str, text: str, salience: float) -> None:
    safe = text.replace("'", "\\'")[:240]
    try:
        conn.execute(
            f"CREATE (m:Memory {{id: '{mid}', layer: '{layer}', text: '{safe}', salience: {float(salience)}}})"
        )
    except Exception:
        conn.execute(
            f"MATCH (m:Memory) WHERE m.id = '{mid}' SET m.text = '{safe}', m.salience = {float(salience)}"
        )


def relate(conn: kuzu.Connection, rel: str, src: str, dst: str, score: float | None = None) -> None:
    extra = f", score: {float(score)}" if score is not None and rel == "Similar" else ""
    try:
        conn.execute(
            f"MATCH (a:Memory), (b:Memory) WHERE a.id = '{src}' AND b.id = '{dst}' "
            f"CREATE (a)-[:{rel} {{{extra.strip(', ')}}}]->(b)"
            if extra
            else f"MATCH (a:Memory), (b:Memory) WHERE a.id = '{src}' AND b.id = '{dst}' CREATE (a)-[:{rel}]->(b)"
        )
    except Exception:
        pass


def used_tool(conn: kuzu.Connection, mid: str, tool: str) -> None:
    name = "".join(ch for ch in tool if ch.isalnum() or ch in "_-")[:40]
    if not name:
        return
    try:
        conn.execute(f"CREATE (t:Tool {{name: '{name}'}})")
    except Exception:
        pass
    try:
        conn.execute(
            f"MATCH (m:Memory), (t:Tool) WHERE m.id = '{mid}' AND t.name = '{name}' CREATE (m)-[:Used]->(t)"
        )
    except Exception:
        pass


def assigned(conn: kuzu.Connection, mid: str, role: str) -> None:
    role = "".join(ch for ch in role if ch.isalnum())[:20] or "hx"
    try:
        conn.execute(f"CREATE (a:Agent {{role: '{role}'}})")
    except Exception:
        pass
    try:
        conn.execute(
            f"MATCH (m:Memory), (a:Agent) WHERE m.id = '{mid}' AND a.role = '{role}' CREATE (m)-[:Assigned]->(a)"
        )
    except Exception:
        pass


def neighbors(conn: kuzu.Connection, mid: str, limit: int = 8) -> list[dict]:
    try:
        result = conn.execute(
            f"MATCH (m:Memory)-[r]->(n:Memory) WHERE m.id = '{mid}' RETURN n.id, n.layer, n.text LIMIT {int(limit)}"
        )
        rows = result.get_as_df().values.tolist() if hasattr(result, "get_as_df") else []
        out = []
        for row in rows:
            out.append({"id": str(row[0]), "layer": str(row[1]), "text": str(row[2])[:160]})
        return out
    except Exception:
        return []


def snapshot(conn: kuzu.Connection) -> dict:
    nodes: list[dict] = []
    edges: list[dict] = []
    try:
        res = conn.execute("MATCH (m:Memory) RETURN m.id, m.layer, m.text, m.salience LIMIT 80")
        df = res.get_as_df()
        for row in df.itertuples(index=False):
            nodes.append({"id": str(row[0]), "layer": str(row[1]), "text": str(row[2])[:80], "salience": float(row[3] or 0)})
    except Exception:
        pass
    try:
        res = conn.execute("MATCH (a:Memory)-[r]->(b:Memory) RETURN a.id, b.id, label(r) LIMIT 120")
        df = res.get_as_df()
        for row in df.itertuples(index=False):
            edges.append({"from": str(row[0]), "to": str(row[1]), "rel": str(row[2])})
    except Exception:
        try:
            res = conn.execute("MATCH (a:Memory)-[:Distills]->(b:Memory) RETURN a.id, b.id LIMIT 80")
            df = res.get_as_df()
            for row in df.itertuples(index=False):
                edges.append({"from": str(row[0]), "to": str(row[1]), "rel": "Distills"})
        except Exception:
            pass
    return {"nodes": nodes, "edges": edges, "engine": "kuzu"}
