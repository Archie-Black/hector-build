/** Frame-rate Klatt. Coefs once per 10ms. Saw glottis. No formant sorting. */
import { compact, RATE, type Frame } from "./frame";

export { braid, compact, RATE, type Frame } from "./frame";

type R = { p: number; q: number };

function res(): R {
  return { p: 0, q: 0 };
}

function tick(s: R, a: number, b: number, x: number) {
  const y = a * s.p - b * s.q + x;
  if (!Number.isFinite(y) || Math.abs(y) > 20) {
    s.p = 0;
    s.q = 0;
    return 0;
  }
  s.q = s.p;
  s.p = y;
  return y;
}

function coef(f: number, bw: number, fs: number) {
  const r = Math.exp((-Math.PI * Math.max(50, bw)) / fs);
  const th = (2 * Math.PI * Math.max(60, Math.min(fs / 2 - 200, f))) / fs;
  return { a: 2 * r * Math.cos(th), b: r * r };
}

function mix(a: Frame, b: Frame, t: number): Frame {
  const s = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    f0: a.f0 + (b.f0 - a.f0) * s,
    av: a.av + (b.av - a.av) * s,
    af: a.af + (b.af - a.af) * s,
    f1: a.f1 + (b.f1 - a.f1) * s,
    f2: a.f2 + (b.f2 - a.f2) * s,
    f3: a.f3 + (b.f3 - a.f3) * s,
    b1: a.b1,
    b2: a.b2,
    b3: a.b3,
    z1: s > 0.5 ? b.z1 : a.z1,
    bz1: s > 0.5 ? b.bz1 : a.bz1,
  };
}

function peak(out: Float32Array, fs: number) {
  const m = Math.min(out.length, Math.round(fs * 0.008));
  for (let i = 0; i < m; i++) {
    const w = i / m;
    out[i] *= w;
    out[out.length - 1 - i] *= w;
  }
  let p = 1e-6;
  for (const x of out) {
    const a = Math.abs(x);
    if (a > p) p = a;
  }
  const g = 0.78 / p;
  for (let i = 0; i < out.length; i++) out[i] *= g;
}

export function render(raw: Frame[], fs = RATE): Float32Array {
  if (!raw.length) return new Float32Array(0);
  const hop = Math.max(8, Math.round(fs / 100));
  const n = Math.max(hop, raw.length * hop);
  const out = new Float32Array(n);
  const r1 = res();
  const r2 = res();
  const r3 = res();
  const gl = { p: 0 };
  let last = 0;
  let phase = 0;
  let i = 0;
  const gR = Math.exp((-2 * Math.PI * 380) / fs);

  for (let f = 0; f < raw.length; f++) {
    const nxt = f + 1 < raw.length ? raw[f + 1] : raw[f];
    const end = Math.min(n, i + hop);
    const span = Math.max(1, end - i);
    const c1 = coef(raw[f].f1, raw[f].b1, fs);
    const c2 = coef(raw[f].f2, raw[f].b2, fs);
    const c3 = coef(raw[f].f3, raw[f].b3, fs);
    for (let k = 0; i < end; i++, k++) {
      const fr = mix(raw[f], nxt, k / span);
      let src = (Math.random() * 2 - 1) * fr.af;
      if (fr.f0 > 50 && fr.av > 0) {
        phase += fr.f0 / fs;
        if (phase >= 1) phase -= 1;
        const saw = 2 * phase - 1;
        src += saw * fr.av;
      }
      gl.p = (1 - gR) * src + gR * gl.p;
      const y1 = tick(r1, c1.a, c1.b, gl.p);
      const y2 = tick(r2, c2.a, c2.b, y1);
      const y3 = tick(r3, c3.a, c3.b, y2);
      const rad = y3 - last;
      last = y3;
      out[i] = rad;
    }
  }
  peak(out, fs);
  return out;
}

export function resample(pcm: Float32Array, from: number, to: number) {
  if (from === to) return pcm;
  const n = Math.max(1, Math.round((pcm.length * to) / from));
  const out = new Float32Array(n);
  const ratio = from / to;
  for (let i = 0; i < n; i++) {
    const x = i * ratio;
    const j = x | 0;
    const t = x - j;
    const a = pcm[j] ?? 0;
    const b = pcm[j + 1] ?? a;
    out[i] = a + (b - a) * t;
  }
  return out;
}
