import { STRANDS, reduceBraid, writhe } from "./braid.ts";
import { pAdd, pClean, pFormat, pMul, type Poly } from "./poly.ts";

const CAP = 12;

function ufParent(p: number[]) {
  return function find(i: number): number {
    while (p[i] !== i) {
      p[i] = p[p[i]];
      i = p[i];
    }
    return i;
  };
}

function circles(word: number[], n: number, mask: number) {
  const layers = word.length + 1;
  const count = layers * n;
  const p = Array.from({ length: count }, (_, i) => i);
  const find = ufParent(p);
  const join = (a: number, b: number) => {
    const x = find(a);
    const y = find(b);
    if (x !== y) p[y] = x;
  };
  const at = (h: number, s: number) => h * n + s;
  for (let h = 0; h < word.length; h++) {
    const g = word[h];
    const i = Math.abs(g) - 1;
    const aSmooth = ((mask >> h) & 1) === 0;
    const useA = g > 0 ? aSmooth : !aSmooth;
    for (let s = 0; s < n; s++) {
      if (s === i || s === i + 1) continue;
      join(at(h, s), at(h + 1, s));
    }
    if (useA) {
      join(at(h, i), at(h + 1, i));
      join(at(h, i + 1), at(h + 1, i + 1));
    } else {
      join(at(h, i), at(h, i + 1));
      join(at(h + 1, i), at(h + 1, i + 1));
    }
  }
  for (let s = 0; s < n; s++) join(at(0, s), at(word.length, s));
  const seen = new Set<number>();
  for (let i = 0; i < count; i++) seen.add(find(i));
  return seen.size;
}

function nOf(word: number[]) {
  let m = 1;
  for (const g of word) m = Math.max(m, Math.abs(g) + 1);
  return Math.min(STRANDS, Math.max(2, m));
}

/** Kauffman bracket as Laurent in A. LIVE for ≤12 crossings of the reduced word. */
export function kauffmanBracket(word: number[]) {
  const w = word.slice(0, CAP);
  const n = nOf(w);
  if (!w.length) return { 0: 1 } as Poly;
  let acc: Poly = {};
  const states = 1 << w.length;
  for (let mask = 0; mask < states; mask++) {
    let a = 0;
    for (let i = 0; i < w.length; i++) if (((mask >> i) & 1) === 0) a += 1;
    const b = w.length - a;
    const circ = circles(w, n, mask);
    const expA = a - b;
    let term: Poly = { [expA]: 1 };
    const d: Poly = { 2: -1, [-2]: -1 };
    for (let k = 0; k < Math.max(0, circ - 1); k++) term = pMul(term, d);
    acc = pAdd(acc, term);
  }
  return pClean(acc);
}

export function jonesPoly(word: number[]) {
  const w = word.slice(0, CAP);
  const wr = writhe(w);
  let bracket = kauffmanBracket(w);
  const factorExp = -3 * wr;
  const sign = wr % 2 === 0 ? 1 : -1;
  const shifted: Poly = {};
  for (const [k, v] of Object.entries(bracket)) shifted[Number(k) + factorExp] = v * sign;
  const inT: Poly = {};
  for (const [k, v] of Object.entries(shifted)) {
    if (Number(k) % 4 !== 0) continue;
    inT[-Number(k) / 4] = (inT[-Number(k) / 4] ?? 0) + v;
  }
  return {
    jones: pClean(inT),
    text: pFormat(pClean(inT), "t"),
    crossings: w.length,
    truncated: word.length > CAP,
  };
}

export function numericSkein(word: number[], a: number, b: number, loop: number) {
  const w = word.slice(0, CAP);
  const n = nOf(w);
  if (!w.length) return 1;
  let acc = 0;
  const states = 1 << w.length;
  for (let mask = 0; mask < states; mask++) {
    let aa = 0;
    for (let i = 0; i < w.length; i++) if (((mask >> i) & 1) === 0) aa += 1;
    const bb = w.length - aa;
    const circ = circles(w, n, mask);
    acc += a ** aa * b ** bb * loop ** Math.max(0, circ - 1);
  }
  return acc;
}
