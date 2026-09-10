/** Dual-lens PTZ. Real ONVIF if a host is set. Otherwise a silent workbench twin. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { absoluteMove, type PtzPose } from "./onvif.ts";
import { makeGray, set, type Gray } from "./stereo.ts";

export type CamCfg = {
  host: string;
  user: string;
  pass: string;
  focus: "bench" | "room";
  thermal: boolean;
  pose: PtzPose;
};

const DIR = join(process.cwd(), "data", "os", "vision");
const FILE = join(DIR, "camera.json");

const EMPTY: CamCfg = { host: "", user: "", pass: "", focus: "bench", thermal: false, pose: { pan: 0, tilt: 0, zoom: 0 } };

let live: CamCfg | null = null;

function load(): CamCfg {
  if (live) return live;
  mkdirSync(DIR, { recursive: true });
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<CamCfg>;
      live = { ...EMPTY, ...parsed, pose: { ...EMPTY.pose, ...(parsed.pose ?? {}) } };
      return live;
    } catch {
      /* fall */
    }
  }
  live = { ...EMPTY, pose: { ...EMPTY.pose } };
  return live;
}

function save(cfg: CamCfg) {
  live = cfg;
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cfg));
}

export function cameraCfg() {
  return load();
}

export function setCamera(over: Partial<CamCfg>) {
  const next = { ...load(), ...over, pose: { ...load().pose, ...(over.pose ?? {}) } };
  save(next);
  return next;
}

/** Procedural workbench. LED + capacitor + a wire that can go loose. */
export function benchFrame(opts: { shift?: number; loose?: boolean; led?: "green" | "red"; zoom?: number; thermal?: boolean } = {}): Gray {
  const w = 96;
  const h = 64;
  const g = makeGray(w, h, opts.thermal ? 30 : 18);
  const shift = opts.shift ?? 0;
  const z = Math.max(1, 1 + (opts.zoom ?? 0) * 3);
  const led = opts.led ?? "green";
  const lx = Math.round(28 * z - shift);
  const ly = Math.round(22 * z);
  const color = led === "green" ? 220 : 90;
  for (let y = ly - 3; y <= ly + 3; y++) for (let x = lx - 3; x <= lx + 3; x++) set(g, x, y, color);
  const cx = Math.round(52 * z - shift);
  const cy = Math.round(30 * z);
  for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 4; x <= cx + 4; x++) set(g, x, y, 140);
  const x0 = Math.round(36 * z - shift);
  const x1 = Math.round((opts.loose ? 44 : 52) * z - shift);
  const y = Math.round(40 * z);
  for (let x = x0; x <= x1; x++) {
    set(g, x, y, 200);
    set(g, x, y + 1, 180);
  }
  if (opts.loose) {
    for (let i = 0; i < 6; i++) set(g, x1 + i, y + 2 + (i % 2), 210);
  }
  return g;
}

export function dualFrame(opts?: { loose?: boolean; led?: "green" | "red"; zoom?: number; thermal?: boolean }) {
  const z = opts?.zoom ?? 0;
  return {
    left: benchFrame({ ...opts, zoom: z, shift: 0 }),
    right: benchFrame({ ...opts, zoom: z, shift: 3 }),
  };
}

export async function ptzTo(xNorm: number, yNorm: number, zoom = 0.4) {
  const cfg = load();
  const pose: PtzPose = {
    pan: Math.max(-1, Math.min(1, (xNorm - 0.5) * 2)),
    tilt: Math.max(-1, Math.min(1, (0.5 - yNorm) * 2)),
    zoom: Math.max(0, Math.min(1, zoom)),
  };
  save({ ...cfg, pose });
  if (cfg.host) {
    const moved = await absoluteMove(cfg.host, pose, "Profile_1", cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined);
    return { pose, ...moved };
  }
  return { pose, ok: true, live: false, note: "virtual bench" };
}

export function describeFrame(g: Gray) {
  let bright = 0;
  let dim = 0;
  let hotX = 0;
  let hotY = 0;
  let hot = 0;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const v = g.px[y * g.w + x]!;
      if (v > 180) {
        bright += 1;
        if (v > hot) {
          hot = v;
          hotX = x;
          hotY = y;
        }
      } else if (v < 40) dim += 1;
    }
  }
  const led = hot > 200 ? "green" : hot > 80 ? "red" : "off";
  return {
    w: g.w,
    h: g.h,
    bright,
    dim,
    led,
    hot: { x: hotX, y: hotY, v: hot },
    box: [hotY / g.h, hotX / g.w, (hotY + 6) / g.h, (hotX + 6) / g.w] as [number, number, number, number],
  };
}
