import { createServerFn } from "@tanstack/react-start";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

export type BiSnapshot = {
  jobs: number;
  ok: number;
  fail: number;
  traces: number;
  lanes: { role: string; n: number; crew: number }[];
  tools: { name: string; n: number; ok: number }[];
  recent: { id: string; at: number; prompt: string; ok: boolean; lanes: number }[];
};

const empty: BiSnapshot = { jobs: 0, ok: 0, fail: 0, traces: 0, lanes: [], tools: [], recent: [] };

export const loadBiSnapshot = createServerFn({ method: "POST" }).handler(async (): Promise<BiSnapshot> => {
  const py = "/workspace/.venv-superset/bin/python";
  if (!existsSync(py) || !existsSync("/workspace/data/hx-metrics.db")) return empty;
  const code = `
import json, sqlite3
con = sqlite3.connect("/workspace/data/hx-metrics.db")
jobs = con.execute("select count(*), coalesce(sum(ok),0) from hx_jobs").fetchone()
lanes = con.execute("select role, count(*), coalesce(sum(crew),0) from hx_lanes group by role").fetchall()
traces = con.execute("select count(*) from hx_traces").fetchone()
tools = con.execute("select name, count(*), coalesce(sum(ok),0) from hx_traces group by name order by count(*) desc limit 8").fetchall()
recent = con.execute("select id, at, prompt, ok, lanes from hx_jobs order by at desc limit 8").fetchall()
print(json.dumps({
  "jobs": jobs[0] or 0,
  "ok": jobs[1] or 0,
  "fail": (jobs[0] or 0) - (jobs[1] or 0),
  "traces": traces[0] or 0,
  "lanes": [{"role": r, "n": n, "crew": c} for r,n,c in lanes],
  "tools": [{"name": n, "n": c, "ok": o} for n,c,o in tools],
  "recent": [{"id": i, "at": a, "prompt": p, "ok": bool(o), "lanes": l} for i,a,p,o,l in recent],
}))
`;
  const text = await new Promise<string>((resolve) => {
    const chunks: Buffer[] = [];
    const child = spawn(py, ["-c", code]);
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8")));
    child.on("error", () => resolve(""));
  });
  try {
    return JSON.parse(text) as BiSnapshot;
  } catch {
    return empty;
  }
});
