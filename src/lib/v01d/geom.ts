/** Discrete geometry on the website graph. Health is a scalar field. */

import type { Row } from "./repair";

/** Directed edges: data and depends-on. Database first in the chain. */
export const EDGES: readonly [string, string][] = [
  ["timescale", "v01d"],
  ["v01d", "traefik"],
  ["v01d", "otel"],
  ["otel", "prometheus"],
  ["prometheus", "alertmanager"],
];

export const DEPTH: Record<string, number> = {
  timescale: 0,
  v01d: 1,
  otel: 2,
  traefik: 2,
  prometheus: 3,
  alertmanager: 4,
  vector: 3,
};

export function height(row: Row) {
  if (row.state === "running" && (row.health === "healthy" || row.health === "starting" || row.health === "none")) return 1;
  if (row.state === "running" && row.health === "unhealthy") return 0.25;
  if (row.state === "restarting") return 0.1;
  return 0;
}

export function field(rows: Row[]) {
  const h: Record<string, number> = {};
  for (const r of rows) {
    const s = r.service;
    h[s] = Math.max(h[s] ?? 0, height(r));
  }
  return h;
}

function neighbors(v: string) {
  const n: string[] = [];
  for (const [a, b] of EDGES) {
    if (a === v) n.push(b);
    if (b === v) n.push(a);
  }
  return n;
}

const W: Record<string, number> = {};
let DT = 0.25;
let DELAY = 1;

function wk(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function edgeWeight(a: string, b: string) {
  return W[wk(a, b)] ?? 1;
}

export function setEdgeWeights(w: Record<string, number>) {
  for (const k of Object.keys(W)) delete W[k];
  Object.assign(W, w);
}

export function setAdapt(dt: number, delay: number) {
  DT = dt;
  DELAY = delay;
}

/** Discrete Laplacian of health. Learned edge weights scale the difference. */
export function laplacian(v: string, h: Record<string, number>) {
  const hv = h[v] ?? 0;
  let s = 0;
  for (const w of neighbors(v)) s += edgeWeight(v, w) * ((h[w] ?? 0) - hv);
  return s;
}

/** Mean |Laplacian|. Near 0 the stack is flat (safe to snapshot). */
export function curvature(h: Record<string, number>) {
  const keys = Object.keys(h);
  if (keys.length === 0) return 1;
  let s = 0;
  for (const v of keys) s += Math.abs(laplacian(v, h));
  return s / keys.length;
}

export function calm(rows: Row[]) {
  const h = field(rows);
  const core = ["timescale", "v01d", "traefik"];
  if (core.some((s) => (h[s] ?? 0) < 1)) return false;
  return curvature(h) < 0.45;
}

/** Lower rank repairs first: deeper dependencies, then isolated failures (high Laplacian). */
export function repairRank(service: string, rows: Row[]) {
  const h = field(rows);
  const depth = DEPTH[service] ?? 9;
  const lap = laplacian(service, h);
  let ricci = 0;
  let n = 0;
  for (const [a, b] of EDGES) {
    if (a === service || b === service) {
      ricci += forman(a, b, h);
      n += 1;
    }
  }
  const meanF = n ? ricci / n : 0;
  const clip = (x: number) => Math.max(-4, Math.min(4, x));
  return depth * 10 - clip(lap) - clip(meanF);
}

/** Replica as a point (health, 1/(1+restarts)). Stop the one farthest from the healthy cluster. */
export function farthestCopy(rows: Row[]) {
  const pts = rows.map((r) => ({
    name: r.name,
    x: height(r),
    y: 1 / (1 + r.restarts),
  }));
  const healthy = pts.filter((p) => p.x >= 1);
  const cx = healthy.length ? healthy.reduce((s, p) => s + p.x, 0) / healthy.length : 0;
  const cy = healthy.length ? healthy.reduce((s, p) => s + p.y, 0) / healthy.length : 0;
  let best = pts[0];
  let bestD = -1;
  for (const p of pts) {
    const d = (p.x - cx) ** 2 + (p.y - cy) ** 2;
    if (d >= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best?.name || rows[0]?.name || "v01d";
}

/** Forman-Ricci on one edge. Negative means a bottleneck between those two services. */
export function forman(u: string, v: string, h: Record<string, number>) {
  const hu = h[u] ?? 0;
  const hv = h[v] ?? 0;
  const du = Math.max(1, neighbors(u).length);
  const dv = Math.max(1, neighbors(v).length);
  return hu + hv - (du - 1) * hu - (dv - 1) * hv;
}

/** One heat-flow step on the health field. Predicts the next height of each service. */
export function heat(h: Record<string, number>, dt = DT) {
  const n: Record<string, number> = {};
  for (const v of Object.keys(h)) {
    n[v] = Math.max(0, Math.min(1, h[v] + dt * laplacian(v, h)));
  }
  return n;
}

export function predictFail(rows: Row[]) {
  const h0 = field(rows);
  let worst: string | null = null;
  let min = 1;
  for (const [k, v] of Object.entries(h0)) {
    if (v < min) {
      min = v;
      worst = k;
    }
  }
  if (min < 1) return worst;
  const h1 = heat(h0);
  worst = null;
  min = 1;
  for (const [k, v] of Object.entries(h1)) {
    if (v < min) {
      min = v;
      worst = k;
    }
  }
  return min < 0.92 ? worst : null;
}

/** Geometric mean of website-copy health. One number the UI can use for timing. */
export function braidHealth(rows: Row[]) {
  const copies = rows.filter((r) => r.service === "v01d");
  if (copies.length === 0) return 0;
  let acc = 1;
  for (const c of copies) acc *= Math.max(0.01, height(c) / (1 + c.restarts));
  return acc ** (1 / copies.length);
}

export type TqcOp = {
  curvature: number;
  calm: boolean;
  next: string | null;
  copies: number;
  delayMs: number;
  braid: number;
};

/** Compact ops snapshot. UI uses delayMs. Repair uses next. No extra chrome. */
export function tqcOp(rows: Row[]): TqcOp {
  const h = field(rows);
  const k = curvature(h);
  return {
    curvature: k,
    calm: calm(rows),
    next: predictFail(rows),
    copies: rows.filter((r) => r.service === "v01d").length,
    delayMs: Math.round((32 + k * 160) * DELAY),
    braid: braidHealth(rows),
  };
}
