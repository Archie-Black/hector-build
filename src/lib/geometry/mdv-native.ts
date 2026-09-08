import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type MdvHit = {
  path: string;
  offset: number;
  score: number;
  text: string;
  x: number;
  y: number;
  z: number;
  layer: string;
  hits: number;
};

function binPath() {
  const env = process.env.HX_SEARCH_BIN;
  if (env && existsSync(env)) return env;
  const local = join(process.cwd(), "packaging/linux/bin/hx-search");
  if (existsSync(local)) return local;
  return null;
}

export function rustSearchNative(files: Record<string, string>, query: string, k = 8): MdvHit[] | null {
  const bin = binPath();
  if (!bin) return null;
  const input = JSON.stringify({ files, query, k, now_ms: Date.now() });
  const r = spawnSync(bin, [], { input, encoding: "utf8", maxBuffer: 8_000_000 });
  if (r.status !== 0 || !r.stdout) return null;
  try {
    const parsed = JSON.parse(r.stdout) as { hits?: MdvHit[] };
    return parsed.hits ?? null;
  } catch {
    return null;
  }
}
