import { RATE, type Frame } from "./frame";

export type Pole = { r: number; th: number };
export type Zero = { r: number; th: number };

const RMAX = 0.995;

export function pole(f: number, bw: number): Pole {
  const r = Math.min(RMAX, Math.exp((-Math.PI * bw) / RATE));
  return { r, th: (2 * Math.PI * f) / RATE };
}

export function ab(p: Pole) {
  return { a: 2 * p.r * Math.cos(p.th), b: p.r * p.r };
}

/** TQC map: poles and zeros as strands. They do not cross. |r|<1. */
export function map(fr: Frame): { poles: Pole[]; zeros: Zero[] } {
  const poles = [pole(fr.f1, fr.b1), pole(fr.f2, fr.b2), pole(fr.f3, fr.b3)].sort((x, y) => x.th - y.th);
  const zeros: Zero[] = [];
  if (fr.z1 && fr.z1 > 0) zeros.push(pole(fr.z1, fr.bz1 || 90));
  return { poles, zeros };
}

export function stable(p: Pole) {
  return p.r > 0 && p.r < 1;
}
