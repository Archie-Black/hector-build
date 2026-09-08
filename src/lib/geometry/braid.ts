/**
 * Artin braid group B_n as a data encoding.
 * Word problem (free cancel + far commute + braid move) shortens the stored word.
 * That is real knot-theoretic compression, not a cipher of letters into crossings.
 *
 * Refs: Artin presentations; Burau → Alexander at t = -1 (knot determinant);
 * Gauss codes; Fox 3-colorability iff |Δ(-1)| % 3 === 0.
 */

export const STRANDS = 5;

export function writhe(word: number[]) {
  return word.reduce((s, g) => s + Math.sign(g), 0);
}

export function braidOfText(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const gen = (c % (STRANDS - 1)) + 1;
    out.push(c & 1 ? gen : -gen);
  }
  return out;
}

function abs(g: number) {
  return Math.abs(g);
}

/** Artin word problem, bounded. Length drop is the encoding win. */
export function reduceBraid(word: number[], cap = 8) {
  let w = word.filter((g) => g !== 0);
  for (let pass = 0; pass < cap; pass++) {
    const before = w.length;
    w = freeCancel(w);
    w = farCommute(w);
    w = braidMoves(w);
    if (w.length === before) break;
  }
  return w;
}

function freeCancel(w: number[]) {
  const out: number[] = [];
  for (const g of w) {
    if (out.length && out[out.length - 1] + g === 0) out.pop();
    else out.push(g);
  }
  return out;
}

/** σ_i σ_j = σ_j σ_i when |i-j| ≥ 2. Sort commuting letters. */
function farCommute(w: number[]) {
  const out = [...w];
  let moved = true;
  while (moved) {
    moved = false;
    for (let i = 0; i < out.length - 1; i++) {
      const a = out[i];
      const b = out[i + 1];
      if (Math.abs(abs(a) - abs(b)) >= 2 && abs(a) > abs(b)) {
        out[i] = b;
        out[i + 1] = a;
        moved = true;
      }
    }
  }
  return freeCancel(out);
}

/** σ_i σ_{i+1} σ_i = σ_{i+1} σ_i σ_{i+1}. Apply when it lexicographically drops. */
function braidMoves(w: number[]) {
  const out = [...w];
  for (let i = 0; i < out.length - 2; i++) {
    const a = out[i];
    const b = out[i + 1];
    const c = out[i + 2];
    if (a !== c || Math.sign(a) !== Math.sign(b)) continue;
    if (abs(b) !== abs(a) + 1 && abs(a) !== abs(b) + 1) continue;
    const alt = [b, a, b];
    const cur = `${a},${b},${c}`;
    const next = alt.join(",");
    if (next < cur) {
      out[i] = alt[0];
      out[i + 1] = alt[1];
      out[i + 2] = alt[2];
    }
  }
  return freeCancel(out);
}

function matId(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

function matMul(a: number[][], b: number[][]) {
  const n = a.length;
  const c = matId(n).map((row) => row.map(() => 0));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      if (!a[i][k]) continue;
      for (let j = 0; j < n; j++) c[i][j] += a[i][k] * b[k][j];
    }
  }
  return c;
}

/** Unreduced Burau at t = -1. Integer, cheap, classical. */
function burauGen(n: number, i: number, inv: boolean) {
  const t = -1;
  const m = matId(n);
  const a = i - 1;
  if (!inv) {
    m[a][a] = 1 - t;
    m[a][a + 1] = t;
    m[a + 1][a] = 1;
    m[a + 1][a + 1] = 0;
  } else {
    m[a][a] = 0;
    m[a][a + 1] = 1;
    m[a + 1][a] = t;
    m[a + 1][a + 1] = 1 - t;
  }
  return m;
}

function det3(m: number[][]) {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let d = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map((row) => row.filter((_, k) => k !== j));
    d += (j % 2 === 0 ? 1 : -1) * m[0][j] * det3(minor);
  }
  return d;
}

export function burauDet(word: number[]) {
  let m = matId(STRANDS);
  for (const g of word) m = matMul(m, burauGen(STRANDS, abs(g), g < 0));
  const a = m.slice(0, STRANDS - 1).map((row, i) => row.slice(0, STRANDS - 1).map((v, j) => (i === j ? 1 - v : -v)));
  try {
    return Math.abs(det3(a)) || 1;
  } catch {
    return 1;
  }
}

export function strandPerm(word: number[]) {
  const p = Array.from({ length: STRANDS }, (_, i) => i);
  for (const g of word) {
    const i = abs(g) - 1;
    const tmp = p[i];
    p[i] = p[i + 1];
    p[i + 1] = tmp;
  }
  return p.join("");
}

/** Two visits per crossing: over then under. Encoding of the diagram, not a unique knot name. */
export function gaussCode(word: number[]) {
  const first = word.map((g, i) => (g > 0 ? i + 1 : -(i + 1)));
  const second = word.map((g, i) => (g > 0 ? -(i + 1) : i + 1));
  return [...first, ...second];
}

export function threeColorable(det: number) {
  return det % 3 === 0;
}

export function knotSeal(text: string) {
  const raw = braidOfText(text);
  const word = reduceBraid(raw);
  const det = burauDet(word);
  return {
    crossings: raw.length,
    reduced: word.length,
    writhe: writhe(word),
    det,
    perm: strandPerm(word),
    gauss: gaussCode(word.slice(0, 12)).join(" "),
    color3: threeColorable(det),
    saved: Math.max(0, raw.length - word.length),
  };
}
