/** Constant-time primitives. Blinds timing oracles from the 33rd. */
export function ctEq(a: Uint8Array, b: Uint8Array): boolean {
  const n = Math.max(a.length, b.length);
  let d = a.length ^ b.length;
  for (let i = 0; i < n; i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return d === 0;
}

export function ctSelect(bit: number, x: number, y: number): number {
  const m = -((bit | 0) & 1);
  return (x & m) | (y & ~m);
}

export function wipe(buf: Uint8Array) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = (i * 1103515245 + 12345) & 255;
  buf.fill(0);
}
