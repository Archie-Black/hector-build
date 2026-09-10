/** Optical flow and anomaly. Baseline the bench. Fire only when a pixel family moves. */
import { at, makeGray, type Gray } from "./stereo.ts";

export type FlowHit = { x: number; y: number; dx: number; dy: number; mag: number };

export function blockFlow(prev: Gray, next: Gray, step = 6, search = 4): FlowHit[] {
  const hits: FlowHit[] = [];
  for (let y = search + 2; y < prev.h - search - 2; y += step) {
    for (let x = search + 2; x < prev.w - search - 2; x += step) {
      let best = Infinity;
      let dx = 0;
      let dy = 0;
      const origin = at(prev, x, y);
      for (let oy = -search; oy <= search; oy++) {
        for (let ox = -search; ox <= search; ox++) {
          const d = Math.abs(origin - at(next, x + ox, y + oy));
          if (d < best) {
            best = d;
            dx = ox;
            dy = oy;
          }
        }
      }
      const mag = Math.hypot(dx, dy);
      if (mag >= 1.5 && best < 40) hits.push({ x, y, dx, dy, mag });
    }
  }
  return hits.sort((a, b) => b.mag - a.mag).slice(0, 24);
}

export function anomaly(baseline: Gray, now: Gray, thresh = 28) {
  const heat = makeGray(now.w, now.h);
  let max = 0;
  let mx = 0;
  let my = 0;
  let n = 0;
  for (let y = 0; y < now.h; y++) {
    for (let x = 0; x < now.w; x++) {
      const d = Math.abs(at(baseline, x, y) - at(now, x, y));
      heat.px[y * now.w + x] = d;
      if (d > thresh) {
        n += 1;
        if (d > max) {
          max = d;
          mx = x;
          my = y;
        }
      }
    }
  }
  return { heat, count: n, x: mx, y: my, mag: max, hit: n > 8 };
}

export function blobBox(g: Gray, cx: number, cy: number, r = 10) {
  const x0 = Math.max(0, cx - r);
  const y0 = Math.max(0, cy - r);
  const x1 = Math.min(g.w - 1, cx + r);
  const y1 = Math.min(g.h - 1, cy + r);
  return { ymin: y0 / g.h, xmin: x0 / g.w, ymax: y1 / g.h, xmax: x1 / g.w };
}
