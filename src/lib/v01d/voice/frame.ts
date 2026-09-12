export const RATE = 16000;

export type Frame = {
  f0: number;
  av: number;
  af: number;
  f1: number;
  f2: number;
  f3: number;
  b1: number;
  b2: number;
  b3: number;
  z1?: number;
  bz1?: number;
};

export function braid(a: Frame, b: Frame, t: number): Frame {
  const s = t * t * (3 - 2 * t);
  const F = [a.f1 + (b.f1 - a.f1) * s, a.f2 + (b.f2 - a.f2) * s, a.f3 + (b.f3 - a.f3) * s].sort((x, y) => x - y);
  return {
    f0: a.f0 + (b.f0 - a.f0) * s,
    av: a.av + (b.av - a.av) * s,
    af: a.af + (b.af - a.af) * s,
    f1: F[0],
    f2: F[1],
    f3: F[2],
    b1: a.b1,
    b2: a.b2,
    b3: a.b3,
    z1: b.z1 ?? a.z1,
    bz1: b.bz1 ?? a.bz1,
  };
}

export function compact(frames: Frame[]): Frame[] {
  if (frames.length < 2) return frames;
  const out: Frame[] = [frames[0]];
  for (let i = 1; i < frames.length; i++) {
    const p = out[out.length - 1];
    const n = frames[i];
    if (Math.abs(p.f1 - n.f1) < 8 && Math.abs(p.f2 - n.f2) < 8 && p.av === n.av) continue;
    out.push(n);
  }
  return out;
}
