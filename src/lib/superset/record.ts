import { createServerFn } from "@tanstack/react-start";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

export const probeSuperset = createServerFn({ method: "POST" }).handler(async () => {
  const warehouse = existsSync("/workspace/data/hx-metrics.db") || existsSync("/workspace/data/hx-warehouse.duckdb");
  return {
    live: warehouse,
    label: warehouse ? "LIVE warehouse" : "STUB warehouse",
  };
});

export const recordHxJob = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id: string;
      voice: string;
      prompt: string;
      ok: boolean;
      spend: number;
      lanes: { id: string; role: string; title: string; crew: number; status: string }[];
      traces: { name: string; ok: boolean; detail: string }[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const py = "/workspace/.venv-superset/bin/python";
    const ingest = "/workspace/packaging/superset/ingest.py";
    if (!existsSync(py) || !existsSync(ingest)) return { ok: false as const };
    await new Promise<void>((resolve) => {
      const child = spawn(py, [ingest], { stdio: ["pipe", "ignore", "ignore"] });
      child.stdin.write(JSON.stringify(data));
      child.stdin.end();
      child.on("exit", () => resolve());
      child.on("error", () => resolve());
    });
    return { ok: true as const };
  });
