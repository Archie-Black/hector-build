/** XPBD rigid step. Tiled substeps. This is the AMD world — not PhysX, not CUDA. */

import type { Imu } from "./physx";
import type { World } from "./sim";

const SUB = 8;
const MU = 0.55;
const REST = 0.08;

function hitBox(x: number, y: number, r: number, bx: number, by: number, bw: number, bh: number) {
  const cx = Math.max(bx, Math.min(x, bx + bw));
  const cy = Math.max(by, Math.min(y, by + bh));
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d >= r || d < 1e-8) return null;
  const nx = dx / d;
  const ny = dy / d;
  const pen = r - d;
  return { nx, ny, pen };
}

function project(wo: World) {
  const b = wo.bot;
  const walls = [
    { x: -1, y: -1, w: wo.w + 2, h: 1 + b.r * 0 },
    ...wo.walls,
  ];
  void walls;
  if (b.x < b.r) b.x = b.r;
  if (b.y < b.r) b.y = b.r;
  if (b.x > wo.w - b.r) b.x = wo.w - b.r;
  if (b.y > wo.h - b.r) b.y = wo.h - b.r;
  for (const wl of wo.walls) {
    const h = hitBox(b.x, b.y, b.r, wl.x, wl.y, wl.w, wl.h);
    if (!h) continue;
    b.x += h.nx * h.pen;
    b.y += h.ny * h.pen;
    const vn = Math.cos(b.th) * b.v * h.nx + Math.sin(b.th) * b.v * h.ny;
    if (vn < 0) b.v = b.v * -REST;
  }
}

export function rdnaStep(wo: World, dt: number): Imu {
  const b = wo.bot;
  const h = dt / SUB;
  const v0x = Math.cos(b.th) * b.v;
  const v0y = Math.sin(b.th) * b.v;
  for (let i = 0; i < SUB; i++) {
    b.th += b.w * h;
    b.x += Math.cos(b.th) * b.v * h;
    b.y += Math.sin(b.th) * b.v * h;
    b.v *= 1 - MU * h;
    project(wo);
  }
  const vx = Math.cos(b.th) * b.v;
  const vy = Math.sin(b.th) * b.v;
  lidar(wo);
  return { ax: (vx - v0x) / Math.max(dt, 1e-4), ay: (vy - v0y) / Math.max(dt, 1e-4), wz: b.w };
}

function lidar(wo: World) {
  const b = wo.bot;
  const n = Math.max(wo.scan.length, 72);
  if (wo.scan.length !== n) wo.scan = Array(n).fill(8);
  wo.scan = wo.scan.map((_, i) => {
    const a = b.th + (i / n) * Math.PI * 2 - Math.PI;
    let d = 0.08;
    while (d < 10) {
      const x = b.x + Math.cos(a) * d;
      const y = b.y + Math.sin(a) * d;
      if (x < 0 || y < 0 || x > wo.w || y > wo.h) return d;
      if (wo.walls.some((wl) => x > wl.x && x < wl.x + wl.w && y > wl.y && y < wl.y + wl.h)) return d;
      if (wo.humans.some((hm) => Math.hypot(x - hm.x, y - hm.y) < hm.r)) return d;
      d += 0.1;
    }
    return 10;
  });
}
