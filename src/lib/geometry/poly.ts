/** Sparse Laurent polynomial. Keys are exponents. */

export type Poly = Record<number, number>;

export function pAdd(a: Poly, b: Poly): Poly {
  const out: Poly = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const e = Number(k);
    const s = (out[e] ?? 0) + v;
    if (s) out[e] = s;
    else delete out[e];
  }
  return out;
}

export function pScale(a: Poly, s: number): Poly {
  if (!s) return {};
  const out: Poly = {};
  for (const [k, v] of Object.entries(a)) if (v * s) out[Number(k)] = v * s;
  return out;
}

export function pMul(a: Poly, b: Poly): Poly {
  const out: Poly = {};
  for (const [i, x] of Object.entries(a)) {
    for (const [j, y] of Object.entries(b)) {
      const e = Number(i) + Number(j);
      const s = (out[e] ?? 0) + x * y;
      if (s) out[e] = s;
      else delete out[e];
    }
  }
  return out;
}

export function pFormat(p: Poly, v = "t") {
  const keys = Object.keys(p)
    .map(Number)
    .sort((a, b) => a - b);
  if (!keys.length) return "0";
  return keys
    .map((e, i) => {
      const c = p[e];
      const mag = Math.abs(c);
      let body = "";
      if (e === 0) body = String(mag);
      else {
        const coef = mag === 1 ? "" : String(mag);
        body = e === 1 ? `${coef}${v}` : `${coef}${v}^{${e}}`;
      }
      if (i === 0) return c < 0 ? `-${body}` : body;
      return c < 0 ? `- ${body}` : `+ ${body}`;
    })
    .join(" ");
}

export function pClean(p: Poly): Poly {
  const out: Poly = {};
  for (const [k, v] of Object.entries(p)) if (v) out[Number(k)] = v;
  return out;
}
