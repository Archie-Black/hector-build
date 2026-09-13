/** Hector watches RDNA and CUDA. He remembers who was faster, tries the other, never gives up. */

import type { Seat } from "@/lib/asimov/team";
import { act, learn, qrow, resetRl, reward } from "./rl";

type Stat = { n: number; ema: number; ok: number };
type Row = { rdna: Stat; cuda: Stat };
const MEM = new Map<string, Row>();
const KEY = "v01d-metal-learn";
let lastNote = "";

function empty(): Stat {
  return { n: 0, ema: 0, ok: 0 };
}

function row(job: string): Row {
  let r = MEM.get(job);
  if (!r) {
    r = { rdna: empty(), cuda: empty() };
    MEM.set(job, r);
  }
  return r;
}

function mean(s: Stat) {
  if (!s.n) return Number.POSITIVE_INFINITY;
  return s.ema;
}

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return;
    const o = JSON.parse(raw) as Record<string, Row>;
    for (const [k, v] of Object.entries(o)) MEM.set(k, v);
  } catch {
    /* empty */
  }
}

function save() {
  try {
    const o: Record<string, Row> = {};
    MEM.forEach((v, k) => {
      o[k] = v;
    });
    globalThis.localStorage?.setItem(KEY, JSON.stringify(o));
  } catch {
    /* empty */
  }
}

load();

export function watch(job: string, metal: Seat, ms: number, ok = true) {
  const r = row(job);
  const s = r[metal];
  s.n += 1;
  s.ema = s.n === 1 ? ms : s.ema * 0.8 + Math.max(0, ms) * 0.2;
  if (ok) s.ok += 1;
  learn(job, metal, reward(ms, ok), job);
  save();
}

export function prefer(job: string, fallback: Seat, explore = true): Seat {
  const visits = Object.values(qrow(job).n).reduce((a, b) => a + b, 0);
  if (visits >= 6) {
    const a = act(job, explore);
    return a === "cuda" ? "cuda" : "rdna";
  }
  const r = row(job);
  if (!r.rdna.n && !r.cuda.n) return fallback;
  if (!r.rdna.n) return explore ? "rdna" : fallback;
  if (!r.cuda.n) return explore ? "cuda" : fallback;
  if (explore && Math.random() < 0.12) return fallback === "rdna" ? "cuda" : "rdna";
  const a = mean(r.rdna);
  const b = mean(r.cuda);
  if (a === b) return fallback;
  return a < b ? "rdna" : "cuda";
}

export function evolveSplit(world: Seat, eyes: Seat) {
  const w = prefer("step", world, false);
  const e = prefer("vision", eyes, false);
  const note =
    w === e
      ? `Hector: ${w} is carrying both until the other earns it back.`
      : `Hector: ${w} drives, ${e} sees. They keep score.`;
  lastNote = note;
  return { world: w, eyes: e, note };
}

export function sayMetal() {
  const jobs = ["step", "lidar", "vision", "imu"];
  const bits = jobs.map((j) => {
    const r = row(j);
    if (!r.rdna.n && !r.cuda.n) return `${j}: still learning`;
    return `${j}: RDNA ${r.rdna.n ? mean(r.rdna).toFixed(1) : "—"} CUDA ${r.cuda.n ? mean(r.cuda).toFixed(1) : "—"}`;
  });
  return lastNote ? `${lastNote} ${bits.join(". ")}.` : `Hector is scoring RDNA and CUDA. ${bits.join(". ")}.`;
}

export function resetMetal() {
  MEM.clear();
  lastNote = "";
  resetRl();
  save();
}
