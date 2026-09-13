/** Aether quality. Immutable. It only improves. */

export const QUALITY = Object.freeze({
  id: "OS-V01D-AETHER-Q",
  improve: true as const,
  braid: "B3" as const,
  text: "Aether audio quality is immutable. It measures every render. It only keeps a change if the sound gets cleaner. Hector does not ask.",
});

export type Q = { makeup: number; width: number; air: number; score: number; hits: number };

const STORE = "v01d.aether.q";
const KEY = "__V01D_AETHER_Q__";

let q: Q = { makeup: 1, width: 1, air: 1, score: 0, hits: 0 };

export function mixQ() {
  return { ...q };
}

export function resetQ() {
  q = { makeup: 1, width: 1, air: 1, score: 0, hits: 0 };
}

export function score(l: Float32Array, r: Float32Array, az = 0) {
  let pk = 0;
  let e = 0;
  let cr = 0;
  let n = Math.min(l.length, r.length);
  if (!n) return 0;
  for (let i = 0; i < n; i++) {
    const a = l[i]!;
    const b = r[i]!;
    pk = Math.max(pk, Math.abs(a), Math.abs(b));
    e += a * a + b * b;
    cr += a * b;
  }
  const rms = Math.sqrt(e / (2 * n));
  const corr = e > 1e-12 ? cr / (e / 2) : 1;
  const want = Math.cos(az);
  const image = 1 - Math.min(1, Math.abs(corr - want));
  const clip = pk > 0.99 ? 0 : 1;
  const body = Math.min(1, rms * 8);
  return clip * (0.45 * image + 0.35 * (1 - Math.min(1, pk)) + 0.2 * body);
}

export function improve(l: Float32Array, r: Float32Array, az = 0) {
  const s = score(l, r, az);
  const next: Q = { ...q, hits: q.hits + 1 };
  let pk = 0;
  for (let i = 0; i < l.length; i++) pk = Math.max(pk, Math.abs(l[i]!), Math.abs(r[i]!));
  if (pk > 0.97) next.makeup = Math.max(0.55, next.makeup * 0.97);
  else if (pk < 0.45) next.makeup = Math.min(1.35, next.makeup * 1.012);
  if (Math.abs(az) > 0.3 && s < 0.55) next.width = Math.min(1.35, next.width * 1.02);
  if (s + 1e-9 < q.score && q.hits > 2) return q;
  next.score = Math.max(q.score, s);
  q = next;
  persist();
  return mixQ();
}

function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(q));
  } catch {
    /* native */
  }
}

export function recall() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return mixQ();
    const j = JSON.parse(raw) as Q;
    if (typeof j.makeup === "number" && j.makeup > 0) q = { ...q, ...j };
  } catch {
    /* first */
  }
  return mixQ();
}

export function sealAether() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: QUALITY, writable: false, configurable: false, enumerable: false });
  }
  recall();
  return QUALITY;
}
