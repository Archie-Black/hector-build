/** Space-filling layout for GeoPack. Morton (Z-order) bins cluster similar hashes. */

function part1by1(n: number) {
  let x = n & 0xff;
  x = (x | (x << 4)) & 0x0f0f;
  x = (x | (x << 2)) & 0x3333;
  x = (x | (x << 1)) & 0x5555;
  return x;
}

export function morton(x: number, y: number) {
  return part1by1(x) | (part1by1(y) << 1);
}

/** Map a content hash to a 16-bit Z-order bin on a 256×256 lattice. */
export function binOfHash(hex: string) {
  const hi = parseInt(hex.slice(0, 2), 16) || 0;
  const lo = parseInt(hex.slice(2, 4), 16) || 0;
  return morton(hi, lo);
}

export function binXY(bin: number) {
  const x = compact1by1(bin);
  const y = compact1by1(bin >> 1);
  return { x, y };
}

function compact1by1(n: number) {
  let x = n & 0x5555;
  x = (x | (x >> 1)) & 0x3333;
  x = (x | (x >> 2)) & 0x0f0f;
  x = (x | (x >> 4)) & 0x00ff;
  return x;
}
