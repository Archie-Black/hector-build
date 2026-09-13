/** Chunk the blob. Parity rebuilds one hole per stripe. Geometry finds the hole. Interpolation is not a trained weight. */

export const CHUNK = 64;
export const STRIPE = 4;

export function energy(c: Uint8Array) {
  if (!c.length) return 0;
  let s = 0;
  for (const b of c) s += b;
  return s / (c.length * 255);
}

/** 1D Laplacian on chunk energy. Peaks are the rotten parts. */
export function lap(e: number[]) {
  return e.map((v, i) => 2 * v - (e[i - 1] ?? v) - (e[i + 1] ?? v));
}

export function rotten(chunks: (Uint8Array | null)[], k = 0.28) {
  const e = chunks.map((c) => (c ? energy(c) : 0));
  const L = lap(e);
  const bad: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (!chunks[i] || Math.abs(L[i]!) > k) bad.push(i);
  }
  return bad;
}

export function split(buf: Uint8Array, size = CHUNK) {
  const out: Uint8Array[] = [];
  for (let i = 0; i < buf.length; i += size) out.push(buf.slice(i, i + size));
  return out;
}

export function xor(parts: Uint8Array[]) {
  const n = Math.max(...parts.map((p) => p.length), 0);
  const p = new Uint8Array(n);
  for (const c of parts) {
    for (let i = 0; i < c.length; i++) p[i]! ^= c[i]!;
  }
  return p;
}

export function stripes(chunks: Uint8Array[], n = STRIPE) {
  const par: Uint8Array[] = [];
  for (let i = 0; i < chunks.length; i += n) par.push(xor(chunks.slice(i, i + n)));
  return par;
}

function oneHole(row: (Uint8Array | null)[], par: Uint8Array) {
  const miss = row.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (miss.length !== 1) return null;
  const rest = row.filter((c): c is Uint8Array => !!c);
  const built = xor([...rest, par]);
  const i = miss[0]!;
  const copy = row.slice() as (Uint8Array | null)[];
  copy[i] = built.slice(0, row.find((c) => c)?.length || built.length);
  return copy as Uint8Array[];
}

export function rebuild(chunks: (Uint8Array | null)[], par: Uint8Array[], n = STRIPE) {
  const out = chunks.slice();
  const healed: number[] = [];
  const fail: number[] = [];
  for (let s = 0; s < par.length; s++) {
    const a = s * n;
    const row = out.slice(a, a + n);
    const holes = row.map((c, i) => (c ? -1 : a + i)).filter((i) => i >= 0);
    if (holes.length === 0) continue;
    const got = oneHole(row, par[s]!);
    if (!got) {
      fail.push(...holes);
      continue;
    }
    for (let i = 0; i < got.length; i++) out[a + i] = got[i]!;
    healed.push(...holes);
  }
  return { chunks: out, healed, fail };
}

/** Neighbor fill so the file has a shape. Not the model. Do not run it. */
export function extrapolate(chunks: (Uint8Array | null)[]) {
  const out = chunks.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i]) continue;
    const L = out.slice(0, i).reverse().find((c) => c);
    const R = out.slice(i + 1).find((c) => c);
    const n = (L || R || new Uint8Array(CHUNK)).length;
    const g = new Uint8Array(n);
    for (let b = 0; b < n; b++) {
      const a = L?.[b] ?? R?.[b] ?? 0;
      const c = R?.[b] ?? L?.[b] ?? 0;
      g[b] = (a + c) >> 1;
    }
    out[i] = g;
  }
  return out as Uint8Array[];
}

export function stitch(chunks: Uint8Array[], total: number) {
  const buf = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    buf.set(c.subarray(0, Math.min(c.length, total - o)), o);
    o += c.length;
    if (o >= total) break;
  }
  return buf;
}

export function repair(buf: Uint8Array, opts?: { size?: number; n?: number; kill?: number[] }) {
  const size = opts?.size ?? CHUNK;
  const n = opts?.n ?? STRIPE;
  const parts = split(buf, size);
  const par = stripes(parts, n);
  const work: (Uint8Array | null)[] = parts.slice();
  for (const i of opts?.kill ?? rotten(work)) work[i] = null;
  const exact = rebuild(work, par, n);
  if (exact.fail.length === 0) {
    return { buf: stitch(exact.chunks as Uint8Array[], buf.length), exact: true, healed: exact.healed, fail: [] as number[] };
  }
  const filled = extrapolate(exact.chunks);
  return { buf: stitch(filled, buf.length), exact: false, healed: exact.healed, fail: exact.fail };
}
