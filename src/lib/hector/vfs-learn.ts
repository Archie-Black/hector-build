/** Horizon packer. Live gen N. Always run N+2. The ceiling is identity + fill, not slogans. */

import { know } from "@/lib/hx/proto";

export const AHEAD = 2;
const FLOOR = 512;
const ROOF = 8192;

export type Recipe = { gen: number; cell: number; fan: number; tail: boolean };

let now = 0;
let lastFill = 0;

export function resetVfs() {
  now = 0;
  lastFill = 0;
}

export function waste(bytes: number, cell: number) {
  if (bytes <= 0) return 0;
  const rem = bytes % cell;
  return rem === 0 ? 0 : cell - rem;
}

export function bestCell(bytes: number) {
  let cell = 4096;
  let w = Infinity;
  let pages = Infinity;
  for (let c = FLOOR; c <= ROOF; c *= 2) {
    const ww = waste(bytes, c);
    const p = Math.ceil(Math.max(1, bytes) / c);
    if (ww < w || (ww === w && p < pages)) {
      cell = c;
      w = ww;
      pages = p;
    }
  }
  return cell;
}

export function recipe(n: number): Recipe {
  const g = Math.max(0, n);
  const cell = Math.min(ROOF, Math.max(FLOOR, 4096 / 2 ** Math.min(g, 4)));
  return { gen: g, cell, fan: g >= 2 ? 8 : 4, tail: g >= 1 };
}

export function forBytes(bytes: number): Recipe {
  const r = recipe(now + AHEAD);
  if (r.gen >= 2) r.cell = bestCell(bytes);
  return r;
}

export function live() {
  return {
    now,
    run: recipe(now + AHEAD),
    next: recipe(now + AHEAD + 1),
    ceiling: { identity: true, fill: 1, io: FLOOR, bound: "bousso" },
    gap: AHEAD,
  };
}

export function cell() {
  return recipe(now + AHEAD).cell;
}

export function fan() {
  return recipe(now + AHEAD).fan;
}

export function improve(t: { bytes: number; pages: number; grain?: number }) {
  const g = t.grain || cell();
  const fill = t.bytes / Math.max(1, t.pages * g);
  if (fill + 1e-9 >= lastFill) now += 1;
  lastFill = fill;
  const run = recipe(now + AHEAD);
  return know("horizon", fill, run.cell, now);
}

export function sayVfs() {
  const L = live();
  return `Horizon packer gen ${L.now}, running gen ${L.run.gen}. Always ${AHEAD} ahead. Ceiling is unpack-identity and fill 1. Grain floor ${FLOOR} B.`;
}
