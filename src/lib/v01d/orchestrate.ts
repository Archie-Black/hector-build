/** Website copies: how many, when to add one, when it is safe to stop one. */

import { farthestCopy } from "./geom";
import type { Row } from "./repair";

export const COPIES = { min: 1, max: 4, keepHealthy: 1 } as const;

export type Move = {
  action: "add-copy" | "stop-copy" | "hold" | "repair-first";
  target: string;
  why: string;
};

export function clampCopies(n: number) {
  if (!Number.isFinite(n)) return COPIES.min;
  return Math.min(COPIES.max, Math.max(COPIES.min, Math.floor(n)));
}

export function websiteCopies(rows: Row[]) {
  return rows.filter((r) => r.service === "v01d" || r.name.includes("v01d"));
}

export function healthyCopies(rows: Row[]) {
  return websiteCopies(rows).filter(
    (r) => r.state === "running" && (r.health === "healthy" || r.health === "none"),
  );
}

export function canStopCopy(healthy: number) {
  return healthy - 1 >= COPIES.keepHealthy;
}

export function planScale(rows: Row[], want: number): Move[] {
  const n = clampCopies(want);
  const copies = websiteCopies(rows);
  const healthy = healthyCopies(rows);
  if (copies.length === 0) return [{ action: "add-copy", target: "v01d", why: "no website copy is running" }];
  if (healthy.length === 0) return [{ action: "repair-first", target: "v01d", why: "no healthy website copy; restart before scaling" }];
  if (n > copies.length) {
    return [{ action: "add-copy", target: "v01d", why: `run ${n} website copies (now ${copies.length})` }];
  }
  if (n < copies.length) {
    if (!canStopCopy(healthy.length)) {
      return [{ action: "hold", target: copies[0].name, why: "would leave zero healthy website copies" }];
    }
    const drop = farthestCopy(copies);
    return [{ action: "stop-copy", target: drop, why: `drop to ${n} website copies` }];
  }
  return [{ action: "hold", target: "v01d", why: `already running ${n} website cop${n === 1 ? "y" : "ies"}` }];
}

/** Start a new copy first. Only stop an old one if a healthy copy remains. */
export function planRoll(rows: Row[]): Move[] {
  const copies = websiteCopies(rows);
  const healthy = healthyCopies(rows);
  if (copies.length === 0) return [{ action: "add-copy", target: "v01d", why: "no website copy is running" }];
  if (healthy.length === 0) return [{ action: "repair-first", target: "v01d", why: "no healthy website copy; restart before replacing" }];
  const drop = farthestCopy(copies);
  return [
    { action: "add-copy", target: "v01d", why: "start a new website copy first" },
    canStopCopy(healthy.length + 1)
      ? { action: "stop-copy", target: drop, why: "new copy is up; stop the farthest copy" }
      : { action: "hold", target: drop, why: "would leave zero healthy website copies" },
  ];
}

export function sayMoves(moves: Move[]) {
  return moves.map((m) => m.why).join(" Then ");
}
