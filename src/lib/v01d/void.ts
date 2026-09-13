/** OS V01D void desk. Ridley Scott open. 3D icon carousel. HAL + UE + Godot. */

import { learn, reward } from "@/lib/hector/rl";
import { bind } from "./hal";

export const VOID = Object.freeze({
  wallpaper: "/horsemen/void.jpg",
  saved: "/horsemen/field-dawn.jpg",
  ue: "native/horizon/UE/VoidDesktop/VoidDesktop.uproject",
  godot: "native/horizon/Godot/void/project.godot",
  spin: 140,
  radius: 240,
});

const TAU = Math.PI * 2;

export function ring(n: number, i: number, t = 0, r = VOID.radius) {
  const a = (i / Math.max(1, n)) * TAU + t;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, a };
}

export function carousel(n: number, i: number, rot: number, r = VOID.radius) {
  const th = (i / Math.max(1, n)) * TAU + rot;
  const x = Math.sin(th) * r;
  const z = Math.cos(th) * r;
  const depth = (z + r) / (2 * r);
  const front = Math.cos(th);
  const scale = 0.38 + depth * 0.72;
  const yaw = -Math.sin(th) * 42;
  return { x, z, scale, yaw, depth, front, th };
}

export function nearest(n: number, rot: number) {
  const u = ((-rot / TAU) * n);
  const i = ((Math.round(u) % n) + n) % n;
  const snap = -(i / Math.max(1, n)) * TAU;
  let d = rot - snap;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return { i, snap, aligned: Math.abs(d) < 0.12 };
}

export function aim(n: number, i: number) {
  return -(i / Math.max(1, n)) * TAU;
}

export function lift(scale: number, armed: boolean, on: boolean) {
  if (!armed || !on) return scale;
  return Math.max(1.18, scale * 1.35);
}

export { opening } from "./overture";

export function frame(ms: number) {
  const d = bind("vision", false);
  learn("vision", d.backend, reward(ms, ms < 22));
  return { device: d.id, backend: d.backend, family: "compute" as const, fence: 1, ok: ms < 22, ms };
}
