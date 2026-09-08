/** Meta-dynamic embeddings. Matches crates/hx-vector (256 content + 32 live meta). */

export const DIM_CONTENT = 256;
export const DIM_META = 32;
export const DIM = DIM_CONTENT + DIM_META;
export const LAYERS = ["working", "episodic", "semantic", "procedural", "constitutional"] as const;

function mix(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return n ^ (n >>> 16);
}

function tokenHash(token: string) {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) h = Math.imul(h ^ token.charCodeAt(i), 16777619);
  return mix(h >>> 0);
}

function l2(vec: Float32Array) {
  let n = 0;
  for (let i = 0; i < vec.length; i++) n += vec[i] * vec[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= n;
}

export function contentEmbed(text: string): Float32Array {
  const vec = new Float32Array(DIM_CONTENT);
  const tokens = text.toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length > 1).slice(0, 80);
  for (const tok of tokens) {
    const h = tokenHash(tok);
    const idx = (h >>> 0) % DIM_CONTENT;
    const sign = h & 1 ? 1 : -1;
    vec[idx] += sign;
    vec[(idx + 7) % DIM_CONTENT] += sign * 0.5;
  }
  l2(vec);
  return vec;
}

export function metaEmbed(layer: string, salience: number, hits: number, lastHitMs: number, nowMs = Date.now()) {
  const vec = new Float32Array(DIM_META);
  const i = LAYERS.indexOf(layer as (typeof LAYERS)[number]);
  if (i >= 0) vec[i] = 1;
  const ageDays = Math.max(0, (nowMs - lastHitMs) / 86400000);
  vec[8] = Math.min(1, Math.max(0, salience));
  vec[9] = Math.log1p(Math.max(0, hits)) / 8;
  vec[10] = Math.exp(-ageDays / 14);
  vec[11] = layer === "constitutional" ? 1 : 0;
  return vec;
}

export function fuse(content: Float32Array, meta: Float32Array) {
  const out = new Float32Array(DIM);
  out.set(content, 0);
  out.set(meta, DIM_CONTENT);
  l2(out);
  return out;
}

export function embed(
  text: string,
  layer = "semantic",
  salience = 0.5,
  hits = 0,
  lastHitMs = Date.now(),
) {
  return fuse(contentEmbed(text), metaEmbed(layer, salience, hits, lastHitMs));
}

export function cosine(a: Float32Array, b: Float32Array) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function pointOf(vec: Float32Array) {
  const band = Math.floor(DIM_CONTENT / 3);
  const axis = (start: number) => {
    let s = 0;
    for (let i = start; i < start + band; i++) s += vec[i] ?? 0;
    return Math.min(1, Math.max(0, (s + 1) / 2));
  };
  return { x: axis(0), y: axis(band), z: axis(band * 2) };
}

export function layerOfPath(path: string) {
  const p = path.toLowerCase();
  if (p.includes("hector.md") || p.includes("constitution")) return "constitutional";
  if (p.includes(".test.") || p.includes("spec.")) return "procedural";
  if (p.endsWith(".md")) return "episodic";
  return "semantic";
}
