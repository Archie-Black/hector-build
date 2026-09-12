import { braid, RATE, type Frame } from "./frame";
import { mix } from "./mix";
import { map, type Pole } from "./pz";

/** Meta dynamic prediction coding. Predict the next tract, not the waveform. */
export function predict(prev: Frame | undefined, last: Frame, want: Frame): Frame {
  if (!prev) return braid(last, want, 0.55);
  const A = map(prev).poles;
  const B = map(last).poles;
  const C = map(want).poles;
  const next = C.map((c, i) => step(A[i] || c, B[i] || c, c));
  return {
    ...braid(last, want, 0.4),
    f1: freq(next[0]),
    f2: freq(next[1]),
    f3: freq(next[2]),
  };
}

function step(a: Pole, b: Pole, c: Pole): Pole {
  const { wVel, wWant } = mix();
  const vr = b.r - a.r;
  const vt = b.th - a.th;
  const r = Math.min(0.995, Math.max(0.05, b.r + vr * wVel + (c.r - b.r) * wWant));
  const th = b.th + vt * wVel + (c.th - b.th) * wWant;
  return { r, th };
}

function freq(p: Pole) {
  return (p.th * RATE) / (2 * Math.PI);
}

export function miss(pred: Frame, want: Frame) {
  return Math.abs(pred.f1 - want.f1) + Math.abs(pred.f2 - want.f2) + Math.abs(pred.f3 - want.f3);
}
