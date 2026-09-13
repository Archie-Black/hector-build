/** Holographic ceiling on a node. Bousso bound on a sphere. Classical. Not a qubit. */

export const LP = 1.616255e-35;
export const LN2 = Math.log(2);

export function volume(r: number) {
  return (4 / 3) * Math.PI * r * r * r;
}

/** Area bound: π r² / (ln 2 · ℓp²) bits. */
export function maxBits(r: number) {
  return (Math.PI * r * r) / (LN2 * LP * LP);
}

/** Smear that area over the ball: 3 / (4 ln 2 · ℓp² · r) bits/m³. */
export function density(r: number) {
  return 3 / (4 * LN2 * LP * LP * r);
}

export function bitsOf(bytes: number) {
  return Math.max(0, bytes) * 8;
}

export function fits(bytes: number, r: number) {
  if (!(r > 0) || !(bytes >= 0)) return false;
  return bitsOf(bytes) <= maxBits(r) * (1 + 1e-6);
}

export function radiusFor(bits: number) {
  const need = Math.max(8, bits);
  let r = Math.sqrt((need * LN2 * LP * LP) / Math.PI);
  if (!Number.isFinite(r) || r < LP) r = LP * 8;
  for (let i = 0; i < 8 && !fits(need / 8, r); i++) r *= 1 + 1e-3;
  return r;
}

export function audit(r: number) {
  return {
    r,
    volume: volume(r),
    bits: maxBits(r),
    density: density(r),
  };
}

export function wantsDensity(text: string) {
  return /\b(bousso|holographic bound|spatial density|planck|information density)\b/i.test(text);
}

export function sayDensity(r = 1e-9) {
  const a = audit(r);
  return `Holographic ceiling at r=${r} m: ${a.bits.toExponential(3)} bits. Density ${a.density.toExponential(3)} bits/m³. We do not store past that.`;
}
