/** Isaac-class step. Semi-implicit Euler, friction, restitution, IMU. Laws still gate the command. */

import type { World } from "./sim";

export type Contact = { x: number; y: number; n: number };
export type Imu = { ax: number; ay: number; wz: number };

export function physx(wo: World, dt: number, contacts: Contact[] = []): Imu {
  const b = wo.bot;
  const mu = 0.72;
  const rest = 0.12;
  const prevVx = Math.cos(b.th) * b.v;
  const prevVy = Math.sin(b.th) * b.v;
  b.th += b.w * dt;
  let vx = Math.cos(b.th) * b.v;
  let vy = Math.sin(b.th) * b.v;
  vx *= 1 - mu * dt;
  vy *= 1 - mu * dt;
  const nx = b.x + vx * dt;
  const ny = b.y + vy * dt;
  const hit = nx < b.r || ny < b.r || nx > wo.w - b.r || ny > wo.h - b.r
    || wo.walls.some((wl) => nx > wl.x - b.r && nx < wl.x + wl.w + b.r && ny > wl.y - b.r && ny < wl.y + wl.h + b.r);
  if (hit) {
    vx *= -rest;
    vy *= -rest;
    b.v *= -rest;
    contacts.push({ x: b.x, y: b.y, n: Math.hypot(vx, vy) });
  } else {
    b.x = nx;
    b.y = ny;
    b.v = Math.hypot(vx, vy) * Math.sign(b.v || 1);
  }
  return { ax: (vx - prevVx) / Math.max(dt, 1e-4), ay: (vy - prevVy) / Math.max(dt, 1e-4), wz: b.w };
}
