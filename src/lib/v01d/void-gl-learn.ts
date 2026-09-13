/** Field quality. Smoothness first. It only keeps a change if the frame got cheaper. */

let q = 1;
let best = 1e9;

export function mixQ() {
  return q;
}

export function resetQ() {
  q = 1;
  best = 1e9;
}

export function tune(dt: number) {
  if (dt + 0.05 < best) best = dt;
  if (dt > 18) q = Math.max(0.42, q * 0.97);
  else if (dt < 12 && dt <= best + 0.8) q = Math.min(1, q * 1.008);
  return q;
}
