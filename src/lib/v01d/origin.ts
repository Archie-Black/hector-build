/** Hector's seat. Geometric 0,0,0. A small partition after the ESP. Never the boot sector. */

export const ORIGIN = Object.freeze({
  x: 0,
  y: 0,
  z: 0,
  path: "/v01d/origin",
  sizeMiB: 16,
  label: "HECTOR",
  guid: "48454354-4f52-2d30-2e30-2e3048454354",
  note: "16 MiB after the EFI system partition. Hardware census, HAL map, firmware plan. LBA 0 stays the GPT header.",
});

export type Seat = { x: number; y: number; z: number; path: string; ready: boolean };

export function seat(ready = true): Seat {
  return { x: ORIGIN.x, y: ORIGIN.y, z: ORIGIN.z, path: ORIGIN.path, ready };
}

export function atOrigin(p: { x: number; y: number; z: number }) {
  return p.x === 0 && p.y === 0 && p.z === 0;
}
