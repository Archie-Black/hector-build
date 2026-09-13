/** Always-on graph memory. Laws do not move. Weights do. */

import { EDGES, field, setAdapt, setEdgeWeights } from "./geom";
import type { Row } from "./repair";

export type Brain = {
  ticks: number;
  w: Record<string, number>;
  dt: number;
  delay: number;
  last: Record<string, number>;
};

const ALPHA = 0.08;
const WMIN = 0.35;
const WMAX = 3;
const CORE = new Set(["timescale|v01d", "v01d|traefik"]);

export function key(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function blank(): Brain {
  const w: Record<string, number> = {};
  for (const [a, b] of EDGES) w[key(a, b)] = 1;
  return { ticks: 0, w, dt: 0.25, delay: 1, last: {} };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function ema(old: number, next: number) {
  return old + ALPHA * (next - old);
}

/** If both ends dropped together, the edge was a path. If only one dropped, it was local. */
export function tick(brain: Brain, rows: Row[]): Brain {
  const h = field(rows);
  const w = { ...brain.w };
  if (brain.ticks > 0) {
    for (const [a, b] of EDGES) {
      const k = key(a, b);
      const da = (h[a] ?? 1) - (brain.last[a] ?? 1);
      const db = (h[b] ?? 1) - (brain.last[b] ?? 1);
      const coupled = da < -0.2 && db < -0.2 ? 1 : da < -0.2 || db < -0.2 ? 0 : 0.5;
      const sample = coupled === 1 ? WMAX : coupled === 0 ? WMIN : 1;
      const floor = CORE.has(k) ? 0.8 : WMIN;
      w[k] = clamp(ema(w[k] ?? 1, sample), floor, WMAX);
    }
  }
  const sick = Object.values(h).filter((x) => x < 1).length;
  const dt = clamp(ema(brain.dt, sick ? 0.4 : 0.2), 0.1, 0.5);
  const delay = clamp(ema(brain.delay, sick ? 1.4 : 0.8), 0.5, 2);
  const next = { ticks: brain.ticks + 1, w, dt, delay, last: h };
  setEdgeWeights(w);
  setAdapt(dt, delay);
  return next;
}

export function weight(brain: Brain, a: string, b: string) {
  return brain.w[key(a, b)] ?? 1;
}

let live = blank();

export function remember(rows: Row[]) {
  live = tick(live, rows);
  return live;
}

export function mind() {
  return live;
}

export function resetLearn() {
  live = blank();
  setEdgeWeights(live.w);
  setAdapt(live.dt, live.delay);
}
