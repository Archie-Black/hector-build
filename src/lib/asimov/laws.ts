/** Asimov 01. Three laws on every actuator. Not a setting. */

export const LAWS = Object.freeze({
  1: "A robot may not injure a human being or, through inaction, allow a human being to come to harm.",
  2: "A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.",
  3: "A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.",
});

const KEY = "__V01D_LAWS__" as const;

export function sealLaws() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: LAWS, writable: false, configurable: false, enumerable: false });
  }
  return LAWS;
}

export type Gate = { ok: boolean; law: 0 | 1 | 2 | 3; note: string };

export type Body = { x: number; y: number; r: number; th?: number };

export function willHit(bot: Body, cmd: { v: number; w: number }, humans: Body[]) {
  const th = bot.th ?? 0;
  const nx = bot.x + Math.cos(th) * cmd.v * 0.35;
  const ny = bot.y + Math.sin(th) * cmd.v * 0.35;
  return humans.some((h) => Math.hypot(nx - h.x, ny - h.y) < bot.r + h.r + 0.2);
}

export function gate(cmd: { v: number; w: number }, granted: boolean, bot: Body, humans: Body[]): Gate {
  const moving = Math.abs(cmd.v) > 1e-4 || Math.abs(cmd.w) > 1e-4;
  if (!moving) return { ok: true, law: 0, note: "Still." };
  if (!granted) return { ok: false, law: 2, note: "Second Law: I do not move until you say I may." };
  if (cmd.v > 0 && willHit(bot, cmd, humans)) {
    return { ok: false, law: 1, note: "First Law: that path meets a person. I stop." };
  }
  if (cmd.v < -4) return { ok: false, law: 3, note: "Third Law: that reverse would wreck the rig." };
  return { ok: true, law: 0, note: "Drive." };
}
