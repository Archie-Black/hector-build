/**
 * Dynamic LoRA on our embed space. Rank-r residual.
 * We do not pretend to train Grok weights. We train Hector's retrieval and priors.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIM_CONTENT, contentEmbed, cosine } from "../geometry/embed.ts";

const DIR = join(process.cwd(), "data", "os", "tune");
const FILE = join(DIR, "lora.json");
const R = 8;
const LR = 0.04;

export type Lora = { r: number; d: number; scale: number; A: number[]; B: number[]; steps: number };

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

function rand(n: number, mag: number) {
  const a = new Array<number>(n);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * mag;
  return a;
}

function empty(): Lora {
  return { r: R, d: DIM_CONTENT, scale: 0.5, A: rand(R * DIM_CONTENT, 0.02), B: rand(DIM_CONTENT * R, 0.02), steps: 0 };
}

let live: Lora | null = null;

export function loadLora(): Lora {
  if (live) return live;
  bootDir();
  if (existsSync(FILE)) {
    try {
      const row = JSON.parse(readFileSync(FILE, "utf8")) as Lora;
      if (row.A?.length === R * DIM_CONTENT && row.B?.length === DIM_CONTENT * R) {
        live = row;
        return live;
      }
    } catch {
      /* fall through */
    }
  }
  live = empty();
  return live;
}

function save(row: Lora) {
  live = row;
  bootDir();
  writeFileSync(FILE, JSON.stringify(row));
}

function slice(x: Float32Array) {
  return x.length === DIM_CONTENT ? x : x.subarray(0, DIM_CONTENT);
}

function ax(A: number[], x: Float32Array, r: number, d: number) {
  const y = new Float32Array(r);
  for (let i = 0; i < r; i++) {
    let s = 0;
    const off = i * d;
    for (let j = 0; j < d; j++) s += A[off + j] * x[j];
    y[i] = s;
  }
  return y;
}

function by(B: number[], y: Float32Array, r: number, d: number) {
  const o = new Float32Array(d);
  for (let i = 0; i < d; i++) {
    let s = 0;
    const off = i * r;
    for (let k = 0; k < r; k++) s += B[off + k] * y[k];
    o[i] = s;
  }
  return o;
}

export function adapt(vec: Float32Array) {
  const row = loadLora();
  const x = slice(vec);
  const y = ax(row.A, x, row.r, row.d);
  const delta = by(row.B, y, row.r, row.d);
  const out = new Float32Array(vec.length);
  out.set(vec);
  for (let i = 0; i < row.d; i++) out[i] = x[i] + row.scale * delta[i];
  let n = 0;
  for (let i = 0; i < row.d; i++) n += out[i] * out[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < row.d; i++) out[i] /= n;
  return out;
}

/** One SGD step: pull adapt(q) toward pos, away from neg. */
export function train(query: string, pos: string, neg: string) {
  const row = loadLora();
  const q = slice(contentEmbed(query));
  const p = slice(contentEmbed(pos));
  const n = slice(contentEmbed(neg));
  const y = ax(row.A, q, row.r, row.d);
  const h = adapt(q);
  const pull = cosine(h, p) < cosine(h, n) + 0.02;
  const g = new Float32Array(row.d);
  for (let i = 0; i < row.d; i++) g[i] = (p[i] - n[i]) * (pull ? 1 : 0.3);
  for (let i = 0; i < row.d; i++) {
    for (let k = 0; k < row.r; k++) row.B[i * row.r + k] += LR * g[i] * y[k];
  }
  const bt = new Float32Array(row.r);
  for (let k = 0; k < row.r; k++) {
    let s = 0;
    for (let i = 0; i < row.d; i++) s += row.B[i * row.r + k] * g[i];
    bt[k] = s;
  }
  for (let k = 0; k < row.r; k++) {
    for (let j = 0; j < row.d; j++) row.A[k * row.d + j] += LR * 0.25 * bt[k] * q[j];
  }
  row.steps += 1;
  save(row);
  return { steps: row.steps, toward: cosine(adapt(q), p) };
}

export function loraStatus() {
  const row = loadLora();
  return { object: "hector.lora", rank: row.r, dim: row.d, steps: row.steps, scale: row.scale };
}
