import { STRANDS } from "./braid";
import { pAdd, pClean, pFormat, pMul, pScale, type Poly } from "./poly";

const T: Poly = { 1: 1 };
const ONE: Poly = { 0: 1 };

function pMatId(n: number): Poly[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? { ...ONE } : {})));
}

function pMatMul(a: Poly[][], b: Poly[][]) {
  const n = a.length;
  const c = pMatId(n).map((row) => row.map(() => ({} as Poly)));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < n; j++) c[i][j] = pAdd(c[i][j], pMul(a[i][k], b[k][j]));
    }
  }
  return c;
}

function burauGen(n: number, i: number, inv: boolean): Poly[][] {
  const m = pMatId(n);
  const a = i - 1;
  const oneMinusT = pAdd(ONE, pScale(T, -1));
  if (!inv) {
    m[a][a] = oneMinusT;
    m[a][a + 1] = { ...T };
    m[a + 1][a] = { ...ONE };
    m[a + 1][a + 1] = {};
  } else {
    m[a][a] = {};
    m[a][a + 1] = { ...ONE };
    m[a + 1][a] = { ...T };
    m[a + 1][a + 1] = oneMinusT;
  }
  return m;
}

function pDet(m: Poly[][]): Poly {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return pAdd(pMul(m[0][0], m[1][1]), pScale(pMul(m[0][1], m[1][0]), -1));
  let acc: Poly = {};
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map((row) => row.filter((_, k) => k !== j));
    const sign = j % 2 === 0 ? 1 : -1;
    acc = pAdd(acc, pScale(pMul(m[0][j], pDet(minor)), sign));
  }
  return acc;
}

const CAP = 16;

/** Alexander polynomial from Burau. LIVE on a reduced prefix. */
export function alexanderPoly(word: number[]) {
  const w = word.slice(0, CAP);
  const n = STRANDS;
  let m = pMatId(n);
  for (const g of w) m = pMatMul(m, burauGen(n, Math.abs(g), g < 0));
  const r = n - 1;
  const a: Poly[][] = Array.from({ length: r }, (_, i) =>
    Array.from({ length: r }, (_, j) => {
      const v = m[i][j];
      return i === j ? pAdd(ONE, pScale(v, -1)) : pScale(v, -1);
    }),
  );
  const raw = pClean(pDet(a));
  const keys = Object.keys(raw).map(Number);
  const min = keys.length ? Math.min(...keys) : 0;
  const shifted: Poly = {};
  for (const [k, v] of Object.entries(raw)) shifted[Number(k) - min] = v;
  if ((shifted[0] ?? 0) < 0) {
    for (const k of Object.keys(shifted)) shifted[Number(k)] *= -1;
  }
  return {
    alexander: pClean(shifted),
    text: pFormat(pClean(shifted), "t"),
    truncated: word.length > CAP,
  };
}
