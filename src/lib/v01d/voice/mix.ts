let wVel = 0.35;
let wWant = 0.65;
let hits = 0;

export function mix() {
  return { wVel, wWant, hits };
}

export function setMix(v: number, w: number, h?: number) {
  wVel = v;
  wWant = w;
  if (typeof h === "number") hits = h;
}

export function bump() {
  hits += 1;
  return hits;
}
