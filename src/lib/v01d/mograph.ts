/** Cinema 4D MoGraph, minus the dongle. Cloner, Step, Plain+field, Delay spring. */

export function step(i: number, n: number) {
  if (n <= 1) return 1;
  return i / (n - 1);
}

/** Linear field along +X. Weight 1 on the left, 0 on the right, then invert as it travels. */
export function linearField(x: number, pos: number, width = 0.35) {
  const u = (x - pos) / Math.max(0.001, width);
  if (u <= 0) return 1;
  if (u >= 1) return 0;
  return 1 - u;
}

/** Delay effector, Spring mode. Overshoot, then rest. */
export function spring(t: number, w = 8.2, c = 3.05) {
  const x = Math.max(0, t);
  return 1 - Math.exp(-c * x) * Math.cos(w * x);
}

export function blend(t: number, lag = 0.28) {
  const x = Math.max(0, t);
  return 1 - Math.exp(-x / lag);
}
