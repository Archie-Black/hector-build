/** OpenCV-class ops. Gray, blur, Sobel edges, a blob track. Runs in the lab. */

export type Frame = { w: number; h: number; px: Uint8ClampedArray };

export function gray(src: Frame): Frame {
  const px = new Uint8ClampedArray(src.w * src.h);
  for (let i = 0, j = 0; i < src.px.length; i += 4, j++) {
    px[j] = (src.px[i] * 77 + src.px[i + 1] * 150 + src.px[i + 2] * 29) >> 8;
  }
  return { w: src.w, h: src.h, px };
}

export function blur(src: Frame): Frame {
  const px = new Uint8ClampedArray(src.px.length);
  const { w, h } = src;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += src.px[(y + dy) * w + (x + dx)];
      px[y * w + x] = s / 9;
    }
  }
  return { w, h, px };
}

export function sobel(src: Frame): Frame {
  const px = new Uint8ClampedArray(src.px.length);
  const { w, h } = src;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -src.px[i - w - 1] + src.px[i - w + 1] - 2 * src.px[i - 1] + 2 * src.px[i + 1] - src.px[i + w - 1] + src.px[i + w + 1];
      const gy = -src.px[i - w - 1] - 2 * src.px[i - w] - src.px[i - w + 1] + src.px[i + w - 1] + 2 * src.px[i + w] + src.px[i + w + 1];
      px[i] = Math.min(255, Math.hypot(gx, gy));
    }
  }
  return { w, h, px };
}

export function track(src: Frame) {
  let best = 0;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const v = src.px[y * src.w + x];
      if (v > 140) {
        sx += x;
        sy += y;
        n++;
        if (v > best) best = v;
      }
    }
  }
  if (!n) return { x: src.w / 2, y: src.h / 2, hit: false };
  return { x: sx / n, y: sy / n, hit: true };
}
