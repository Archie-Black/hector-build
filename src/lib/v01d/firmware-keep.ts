/** Autonomous BIOS care. Weekly LVFS. Same gates as install. This chassis is home. */

import { plan, type Census, type Plan, type Update } from "./firmware";

const WEEK = 7 * 24 * 3600 * 1000;
let last = 0;

export function resetKeep() {
  last = 0;
}

export function due(now = Date.now(), every = WEEK) {
  return now - last >= every;
}

export function keep(c: Census, ups: Update[], now = Date.now()): Plan & { autonomous: boolean; next: number } {
  const p = plan(c, ups);
  last = now;
  return { ...p, autonomous: p.flash, next: now + WEEK };
}
