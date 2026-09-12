/** Klatt cascade fused with TQC pole-zero + MDPC. One loop. */
import { compact, RATE, type Frame } from "./frame";
import { predict } from "./mdpc";
import { ab, pole } from "./pz";

export { braid, compact, RATE, type Frame } from "./frame";

const HOP = 160;
const LUT = 1024;
const COS = new Float32Array(LUT);
for (let i = 0; i < LUT; i++) COS[i] = Math.cos((Math.PI * 2 * i) / LUT);

function coef(f: number, bw: number) {
  const fi = Math.max(0, Math.min(LUT - 1, ((f / RATE) * LUT) | 0));
  const r = Math.exp((-Math.PI * bw) / RATE);
  return { a: 2 * r * COS[fi], b: r * r };
}

export function render(raw: Frame[], fs = RATE): Float32Array {
  const frames = compact(raw);
  const n = Math.max(HOP, raw.length * HOP);
  const out = new Float32Array(n);
  let p1 = 0,
    q1 = 0,
    p2 = 0,
    q2 = 0,
    p3 = 0,
    q3 = 0,
    last = 0,
    phase = 0,
    i = 0;
  let a1 = 0,
    b1 = 0,
    a2 = 0,
    b2 = 0,
    a3 = 0,
    b3 = 0;
  let lf1 = -1,
    lf2 = -1,
    lf3 = -1;
  let za = 0,
    zb = 0,
    zp = 0,
    zq = 0,
    lz = -1;
  const hop = Math.max(1, (n / Math.max(1, frames.length)) | 0);
  for (let f = 0; f < frames.length; f++) {
    const want = f + 1 < frames.length ? frames[f + 1] : frames[f];
    const prev = f > 0 ? frames[f - 1] : undefined;
    const fr = predict(prev, frames[f], want);
    if (fr.f1 !== lf1) {
      const c = coef(fr.f1, fr.b1);
      a1 = c.a;
      b1 = c.b;
      lf1 = fr.f1;
    }
    if (fr.f2 !== lf2) {
      const c = coef(fr.f2, fr.b2);
      a2 = c.a;
      b2 = c.b;
      lf2 = fr.f2;
    }
    if (fr.f3 !== lf3) {
      const c = coef(fr.f3, fr.b3);
      a3 = c.a;
      b3 = c.b;
      lf3 = fr.f3;
    }
    if (fr.z1 && fr.z1 !== lz) {
      const z = ab(pole(fr.z1, fr.bz1 || 90));
      za = z.a;
      zb = z.b;
      lz = fr.z1;
    }
    const f0 = fr.f0 / fs;
    const av = fr.av;
    const af = fr.af;
    const end = Math.min(n, i + hop);
    for (; i < end; i++) {
      let g = 0;
      if (f0 > 0 && av > 0) {
        phase += f0;
        if (phase >= 1) {
          phase -= 1;
          g = av;
        }
      }
      if (af > 0) g += (Math.random() * 2 - 1) * af;
      if (fr.z1) {
        const zz = g - za * zp + zb * zq;
        zq = zp;
        zp = g;
        g = zz;
      }
      const y1 = a1 * p1 - b1 * q1 + g;
      q1 = p1;
      p1 = y1;
      const y2 = a2 * p2 - b2 * q2 + y1;
      q2 = p2;
      p2 = y2;
      const y3 = a3 * p3 - b3 * q3 + y2;
      q3 = p3;
      p3 = y3;
      const rad = y3 - last;
      last = y3;
      out[i] = rad * 0.32;
    }
  }
  return out;
}
