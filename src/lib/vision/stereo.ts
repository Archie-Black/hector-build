/** Stereoscopic depth. Two lenses, one disparity map. Pure geometry, no OpenCV. */

export type Gray = { w: number; h: number; px: Uint8Array };

export function makeGray(w: number, h: number, fill = 0): Gray {
  return { w, h, px: new Uint8Array(w * h).fill(fill) };
}

export function at(g: Gray, x: number, y: number) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return 0;
  return g.px[y * g.w + x]!;
}

export function set(g: Gray, x: number, y: number, v: number) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return;
  g.px[y * g.w + x] = v & 255;
}

/** SAD disparity. Right lens is shifted left of the left lens. */
export function disparity(left: Gray, right: Gray, maxD = 12, win = 3): Gray {
  const out = makeGray(left.w, left.h);
  const half = Math.floor(win / 2);
  for (let y = half; y < left.h - half; y++) {
    for (let x = half + maxD; x < left.w - half; x++) {
      let best = Infinity;
      let dHit = 0;
      for (let d = 0; d <= maxD; d++) {
        let sad = 0;
        for (let yy = -half; yy <= half; yy++) {
          for (let xx = -half; xx <= half; xx++) {
            sad += Math.abs(at(left, x + xx, y + yy) - at(right, x + xx - d, y + yy));
          }
        }
        if (sad < best) {
          best = sad;
          dHit = d;
        }
      }
      set(out, x, y, Math.round((dHit / maxD) * 255));
    }
  }
  return out;
}

export function depthAt(map: Gray, x: number, y: number) {
  return at(map, Math.round(x), Math.round(y)) / 255;
}

export function volumeOf(map: Gray, cx: number, cy: number, r = 4) {
  let n = 0;
  let s = 0;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      s += depthAt(map, x, y);
      n += 1;
    }
  }
  return n ? s / n : 0;
}
