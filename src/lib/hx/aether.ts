/** Spectral HX Aether. SN3D sphere. B3 braid for motion and room. Quality only climbs. */

import { improve, mixQ, sealAether } from "./aether-learn";
import { echoMs, knot, step, type Place } from "./aether-tqc";

export const AETHER = Object.freeze({
  name: "Spectral HX Aether",
  order: 2,
  basis: "ACN/SN3D",
  braid: "B3",
  out: "binaural",
  rate: 48000,
  note: "Sources live on a sphere. Motion is a braid. Room taps are braid delay. Quality only improves.",
});

export type { Place } from "./aether-tqc";
export type Src = { id: string; pcm: Float32Array; at: Place };

const SQRT2 = Math.SQRT2;
const C = 343;
const EAR = 0.0875;

export function cart(at: Place) {
  const ce = Math.cos(at.el);
  return { x: ce * Math.cos(at.az), y: ce * Math.sin(at.az), z: Math.sin(at.el), r: Math.max(0.25, at.r) };
}

export function encode(s: number, at: Place) {
  const p = cart(at);
  const g = 1 / p.r;
  return { w: (s * g) / SQRT2, y: s * g * p.y, z: s * g * p.z, x: s * g * p.x };
}

export function stereo(b: { w: number; x: number; y: number; z: number }, width = 1) {
  void b.z;
  return { l: 0.5 * (b.w * SQRT2 + b.x + b.y * width), r: 0.5 * (b.w * SQRT2 + b.x - b.y * width) };
}

export function itd(at: Place, rate: number) {
  const az = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, at.az));
  return (EAR / C) * (Math.sin(az) + az) * rate;
}

export function braid(from: Place, to: Place) {
  return step(from, to);
}

function onePole(prev: number, x: number, fc: number, rate: number) {
  const a = Math.exp((-2 * Math.PI * fc) / rate);
  return a * prev + (1 - a) * x;
}

function limit(x: number, env: { v: number }) {
  env.v = Math.max(Math.abs(x), env.v * 0.9992);
  const g = env.v > 0.98 ? 0.98 / env.v : 1;
  return x * g;
}

function walls(at: Place): Place[] {
  return [
    { az: Math.PI - at.az, el: at.el * 0.4, r: at.r + 3.2 },
    { az: -at.az, el: at.el * 0.3, r: at.r + 2.4 },
    { az: at.az, el: -Math.abs(at.el) * 0.5, r: at.r + 1.8 },
  ];
}

function write(dst: Float32Array, t: number, x: number) {
  const i = Math.floor(t);
  const f = t - i;
  if (i >= 0 && i < dst.length) dst[i]! += x * (1 - f);
  if (i + 1 >= 0 && i + 1 < dst.length) dst[i + 1]! += x * f;
}

export function render(srcs: Src[], rate = AETHER.rate) {
  sealAether();
  const q = mixQ();
  const extra = srcs.reduce((m, s) => Math.max(m, echoMs(2, s.at)), 80);
  const n = srcs.reduce((m, s) => Math.max(m, s.pcm.length), 0) + Math.floor((rate * extra) / 1000) + 8;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (const s of srcs) {
    const k = knot(s.at);
    const images = [{ at: s.at, g: 1, pre: 0 }, ...walls(s.at).map((at, i) => ({ at, g: 0.14 / at.r, pre: (echoMs(i, s.at) * rate) / 1000 }))];
    for (const im of images) {
      const shift = itd(im.at, rate);
      const fc = 15500 * Math.exp(-0.11 * Math.max(0, im.at.r - 1)) * q.air;
      const pinna = 1 - 0.18 * Math.max(0, -im.at.el);
      let lpL = 0;
      let lpR = 0;
      for (let i = 0; i < s.pcm.length; i++) {
        const b = stereo(encode(s.pcm[i]! * im.g * pinna, im.at), q.width);
        lpL = onePole(lpL, b.l, fc, rate);
        lpR = onePole(lpR, b.r, fc, rate);
        write(l, i + im.pre + Math.max(0, shift) + k.k, lpL);
        write(r, i + im.pre + Math.max(0, -shift) + k.k, lpR);
      }
    }
  }
  const envL = { v: 0 };
  const envR = { v: 0 };
  for (let i = 0; i < n; i++) {
    l[i] = limit(l[i]! * q.makeup, envL);
    r[i] = limit(r[i]! * q.makeup, envR);
  }
  improve(l, r, srcs[0]?.at.az ?? 0);
  return { l, r, rate };
}

export function ping(at: Place, rate = AETHER.rate, ms = 220) {
  const n = Math.floor((ms / 1000) * rate);
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const env = Math.exp(-t * 14);
    pcm[i] = (Math.sin(2 * Math.PI * 880 * t) + 0.25 * Math.sin(2 * Math.PI * 1760 * t)) * env * 0.32;
  }
  return render([{ id: "ping", pcm, at }], rate);
}

export function wantsAether(text: string) {
  return /\b(spatial audio|ambisonic|binaural|aether|3d audio|surround|hrtf)\b/i.test(text);
}
