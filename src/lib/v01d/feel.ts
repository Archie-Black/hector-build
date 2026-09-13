/** Global system comfort. Volume, space, sight, type. Lives in the corner. */

export type Motion = "full" | "less";

export type Feel = {
  volume: number;
  mute: boolean;
  spatial: boolean;
  room: number;
  brightness: number;
  contrast: number;
  font: number;
  motion: Motion;
  high: boolean;
  pointer: boolean;
  flat: boolean;
};

export const DEFAULT: Feel = {
  volume: 0.72,
  mute: false,
  spatial: true,
  room: 0.35,
  brightness: 1,
  contrast: 1,
  font: 1,
  motion: "full",
  high: false,
  pointer: false,
  flat: false,
};

const KEY = "v01d.feel";
const watch = new Set<(f: Feel) => void>();
let live: Feel = { ...DEFAULT };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function loadFeel(): Feel {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw) as Partial<Feel>;
    return {
      volume: clamp(p.volume ?? DEFAULT.volume, 0, 1),
      mute: Boolean(p.mute),
      spatial: p.spatial !== false,
      room: clamp(p.room ?? DEFAULT.room, 0, 1),
      brightness: clamp(p.brightness ?? 1, 0.62, 1.35),
      contrast: clamp(p.contrast ?? 1, 0.75, 1.4),
      font: clamp(p.font ?? 1, 0.85, 1.45),
      motion: p.motion === "less" ? "less" : "full",
      high: Boolean(p.high),
      pointer: Boolean(p.pointer),
      flat: Boolean(p.flat),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveFeel(f: Feel) {
  live = {
    volume: clamp(f.volume, 0, 1),
    mute: Boolean(f.mute),
    spatial: f.spatial !== false,
    room: clamp(f.room, 0, 1),
    brightness: clamp(f.brightness, 0.62, 1.35),
    contrast: clamp(f.contrast, 0.75, 1.4),
    font: clamp(f.font, 0.85, 1.45),
    motion: f.motion === "less" ? "less" : "full",
    high: Boolean(f.high),
    pointer: Boolean(f.pointer),
    flat: Boolean(f.flat),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(live));
  } catch {
    /* */
  }
  applyFeel(live);
  for (const fn of watch) fn(live);
}

export function feel() {
  return live;
}

export function onFeel(fn: (f: Feel) => void) {
  watch.add(fn);
  return () => {
    watch.delete(fn);
  };
}

export function applyFeel(f: Feel = live) {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.setProperty("--feel-bright", String(f.brightness));
  r.style.setProperty("--feel-contrast", String(f.contrast));
  r.style.setProperty("--feel-font", String(f.font));
  r.style.setProperty("--feel-pointer", f.pointer ? "1.55" : "1");
  r.classList.toggle("feel-motion", f.motion === "less");
  r.classList.toggle("feel-hi", f.high);
  r.classList.toggle("feel-pointer", f.pointer);
  r.classList.toggle("feel-flat", f.flat);
  r.classList.toggle("feel-spatial", f.spatial);
}

export function bootFeel() {
  live = loadFeel();
  applyFeel(live);
  return live;
}

export function patchFeel(part: Partial<Feel>) {
  saveFeel({ ...live, ...part });
}
