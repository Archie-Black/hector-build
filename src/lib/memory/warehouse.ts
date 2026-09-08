import { createServerFn } from "@tanstack/react-start";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { CONSTITUTION, type RecalledItem } from "./lattice";

const PY = "/workspace/.venv-superset/bin/python";
const SEED = "/workspace/packaging/memory/seed_warehouse.py";
const DB = "/workspace/data/hx-warehouse.duckdb";

function runPy(code: string): Promise<string> {
  return new Promise((resolve) => {
    if (!existsSync(PY)) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    const child = spawn(PY, ["-c", code], { env: process.env });
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", () => undefined);
    child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8").trim()));
    child.on("error", () => resolve(""));
  });
}

export const ensureWarehouse = createServerFn({ method: "POST" }).handler(async () => {
  if (!existsSync(DB) && existsSync(SEED) && existsSync(PY)) {
    await new Promise<void>((resolve) => {
      const child = spawn(PY, [SEED]);
      child.on("exit", () => resolve());
      child.on("error", () => resolve());
    });
  }
  return { live: existsSync(DB), engine: existsSync(PY) ? "duckdb" : "none" };
});

export const recallMemory = createServerFn({ method: "POST" })
  .validator((query: string) => String(query || "").slice(0, 400))
  .handler(async ({ data: query }): Promise<RecalledItem[]> => {
    const fallback: RecalledItem[] = CONSTITUTION.map((text) => ({
      layer: "constitutional",
      text,
      score: 1,
    }));
    const script = "/workspace/packaging/memory/recall.py";
    if (!existsSync(DB) || !existsSync(PY) || !existsSync(script)) return fallback;
    const raw = await new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];
      const child = spawn(PY, [script], { stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.on("data", (d: Buffer) => chunks.push(d));
      child.stdin?.write(JSON.stringify({ query }));
      child.stdin?.end();
      child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8")));
      child.on("error", () => resolve(""));
    });
    try {
      const parsed = JSON.parse(raw) as RecalledItem[];
      return parsed.sort((a, b) => b.score - a.score).slice(0, 14);
    } catch {
      return fallback;
    }
  });

export const graphSnapshot = createServerFn({ method: "POST" }).handler(async () => {
  const script = "/workspace/packaging/memory/snapshot.py";
  if (!existsSync(PY) || !existsSync(script)) return { nodes: [], edges: [], engine: "none" };
  const raw = await new Promise<string>((resolve) => {
    const chunks: Buffer[] = [];
    const child = spawn(PY, [script]);
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8")));
    child.on("error", () => resolve(""));
  });
  try {
    return JSON.parse(raw) as { nodes: { id: string; layer: string; text: string; salience: number }[]; edges: { from: string; to: string; rel: string }[]; engine: string };
  } catch {
    return { nodes: [], edges: [], engine: "none" };
  }
});

export const writeEpisode = createServerFn({ method: "POST" })
  .validator(
    (input: { id: string; voice: string; prompt: string; outcome: string; ok: boolean; spend: number; traces: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    const script = "/workspace/packaging/memory/write_episode.py";
    if (!existsSync(PY) || !existsSync(script) || !existsSync(DB)) return { ok: false };
    await new Promise<void>((resolve) => {
      const child = spawn(PY, [script], { stdio: ["pipe", "ignore", "ignore"] });
      child.stdin?.write(JSON.stringify(data));
      child.stdin?.end();
      child.on("exit", () => resolve());
      child.on("error", () => resolve());
    });
    return { ok: true };
  });

export const runSqlLab = createServerFn({ method: "POST" })
  .validator((sql: string) => String(sql || "").slice(0, 8000))
  .handler(async ({ data: sql }) => {
    const script = "/workspace/packaging/memory/sql_lab.py";
    if (!existsSync(PY) || !existsSync(script) || !existsSync(DB)) {
      return { ok: false, error: "STUB DuckDB warehouse missing.", columns: [] as string[], rows: [] as string[][] };
    }
    const raw = await new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];
      const child = spawn(PY, [script], { stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.on("data", (d: Buffer) => chunks.push(d));
      child.stdin?.write(JSON.stringify({ sql }));
      child.stdin?.end();
      child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8")));
      child.on("error", () => resolve(""));
    });
    try {
      const parsed = JSON.parse(raw) as { ok: boolean; columns: string[]; rows: string[][]; error?: string };
      return {
        ok: Boolean(parsed.ok),
        error: parsed.error,
        columns: parsed.columns ?? [],
        rows: (parsed.rows ?? []).map((r) => r.map((c) => String(c))),
      };
    } catch {
      return { ok: false, error: raw.slice(0, 240) || "Query failed.", columns: [] as string[], rows: [] as string[][] };
    }
  });

export const listDatasets = createServerFn({ method: "POST" }).handler(async () => {
  if (!existsSync(DB) || !existsSync(PY)) {
    return [{ name: "memory.constitution", kind: "immutable rules", status: "LIVE" }];
  }
  const raw = await runPy(`
import json, duckdb
con = duckdb.connect("${DB}", read_only=True)
print(json.dumps([{"name":n,"kind":k,"status":s} for n,k,s in con.execute("select name, kind, status from catalog.datasets").fetchall()]))
`);
  try {
    return JSON.parse(raw) as { name: string; kind: string; status: string }[];
  } catch {
    return [];
  }
});
