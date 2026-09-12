/** Classical TQC: braid the motion. User sees glass, not algebra. */
export function wobble(vx: number, vy: number) {
  const e = Math.hypot(vx, vy);
  const s = Math.tanh(e * 0.04);
  return {
    x: clamp(-vy * 0.2 * s, -8, 8),
    y: clamp(vx * 0.22 * s, -10, 10),
  };
}

export function braidDelay(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1);
  return 40 + t * 180 + Math.sin(t * Math.PI) * 40;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
