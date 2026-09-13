/** If the catalog is wrong, Hector stamps, skips, or mends. Work does not stop. */

import { byId, inspect, live, type Blob, type Verdict, type Weight, WEIGHTS } from "./weights";
import { repair } from "./weights-repair";

const STORE = "v01d.weights.ledger";
const KEY = "__V01D_WEIGHTS__";

type Stamp = { sha256: string; bytes: number };
let ledger: Record<string, Stamp> = {};

export function recall() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) ledger = JSON.parse(raw) as Record<string, Stamp>;
  } catch {
    /* native */
  }
  return { ...ledger };
}

export function resetLedger() {
  ledger = {};
}

function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(ledger));
  } catch {
    /* native */
  }
}

export function known(id: string): Weight | undefined {
  const w = byId(id);
  if (!w) return;
  const s = ledger[id];
  if (!s) return { ...w };
  return { ...w, sha256: w.sha256 || s.sha256, bytes: w.bytes || s.bytes };
}

export function catalog() {
  return WEIGHTS.map((w) => known(w.id)!);
}

export function mend(raw: Uint8Array, kill?: number[]) {
  const r = repair(raw, { kill });
  if (r.exact) return { ...r, action: "use" as const, note: "Parity rebuilt the rotten stripe. Exact." };
  return { ...r, action: "refetch" as const, note: "Geometry filled the hole so the file has a shape. That is not the trained weight. I fetch the rotten stripes." };
}

export function heal(id: string, blob?: Blob): Verdict {
  const w = known(id);
  if (!w) return { id, job: "", need: false, state: "missing", action: "skip", note: "Unknown weight. Skip." };
  const v = inspect(w, blob);
  if (v.action === "stamp" && blob?.sha256) {
    ledger[id] = { sha256: blob.sha256, bytes: blob.bytes };
    persist();
    return { ...v, state: "ok", action: "use", note: "Stamped. We keep going." };
  }
  return v;
}

export function sweep(have: Record<string, Blob>) {
  return catalog().map((w) => heal(w.id, have[w.id] || have[w.file]));
}

export function keepGoing(have: Record<string, Blob>) {
  const vs = sweep(have);
  return { vs, jobs: live(vs), blocked: vs.filter((v) => v.need && v.action === "refetch") };
}

export function sayHeal(have: Record<string, Blob>) {
  if (!Object.keys(have).length) {
    return "I'll verify weights. Rotten stripes rebuild from parity when we have it. Geometry can plug a hole so the file keeps its shape — that plug is not the trained weight. I fetch what parity cannot finish.";
  }
  const k = keepGoing(have);
  const ok = k.jobs.join(", ") || "none";
  const wait = k.blocked.map((b) => b.id).join(", ");
  if (!wait) return `Weights are well enough. Running: ${ok}.`;
  return `I'll fetch ${wait}. Meanwhile: ${ok}.`;
}

export function sealWeights() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: true, writable: false, configurable: false, enumerable: false });
  }
  recall();
}
