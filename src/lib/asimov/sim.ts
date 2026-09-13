/** Gazebo-class floor. Diff-drive, walls, a person, a lidar. */

import type { Body } from "./laws";
import { rdnaStep } from "./rdna-step";

export type Bot = Body & { th: number; v: number; w: number };
export type Wall = { x: number; y: number; w: number; h: number };
export type World = { w: number; h: number; bot: Bot; humans: Body[]; walls: Wall[]; scan: number[] };

export function world(): World {
  return {
    w: 16,
    h: 10,
    bot: { x: 3, y: 5, r: 0.35, th: 0, v: 0, w: 0 },
    humans: [{ x: 11, y: 5, r: 0.4 }],
    walls: [
      { x: 0, y: 0, w: 16, h: 0.3 },
      { x: 0, y: 9.7, w: 16, h: 0.3 },
      { x: 0, y: 0, w: 0.3, h: 10 },
      { x: 15.7, y: 0, w: 0.3, h: 10 },
      { x: 7.2, y: 2.2, w: 0.4, h: 3.2 },
    ],
    scan: Array(36).fill(8),
  };
}

function blocked(wo: World, x: number, y: number, r: number) {
  if (x < r || y < r || x > wo.w - r || y > wo.h - r) return true;
  return wo.walls.some((wl) => x > wl.x - r && x < wl.x + wl.w + r && y > wl.y - r && y < wl.y + wl.h + r);
}

export function step(wo: World, dt: number) {
  return rdnaStep(wo, dt);
}

export function camera(wo: World, w = 80, h = 48): { w: number; h: number; px: Uint8ClampedArray } {
  const px = new Uint8ClampedArray(w * h * 4);
  const b = wo.bot;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const yaw = b.th + ((x / w) - 0.5) * 1.1;
      const dist = 0.4 + (1 - y / h) * 7;
      const wx = b.x + Math.cos(yaw) * dist;
      const wy = b.y + Math.sin(yaw) * dist;
      const wall = blocked(wo, wx, wy, 0.02);
      const person = wo.humans.some((hm) => Math.hypot(wx - hm.x, wy - hm.y) < hm.r);
      const i = (y * w + x) * 4;
      if (person) {
        px[i] = 230; px[i + 1] = 230; px[i + 2] = 40; px[i + 3] = 255;
      } else if (wall) {
        px[i] = 20; px[i + 1] = 50; px[i + 2] = 140; px[i + 3] = 255;
      } else {
        px[i] = 8; px[i + 1] = 10; px[i + 2] = 16; px[i + 3] = 255;
      }
    }
  }
  return { w, h, px };
}
