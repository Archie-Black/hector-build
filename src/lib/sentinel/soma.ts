/** Proprioception. Hardware is the body. Precision follows VRAM, not hope. */

export type Soma = {
  cpu: number;
  mem: number;
  idleMs: number;
  precision: "fp16" | "int4";
  window: number;
};

let lastUser = Date.now();

export function poke() {
  lastUser = Date.now();
}

export function idleMs() {
  return Date.now() - lastUser;
}

function readMem() {
  if (typeof process === "undefined" || !process.memoryUsage) return 0.4;
  const m = process.memoryUsage();
  const rss = m.rss / (256 * 1024 * 1024);
  return Math.max(0, Math.min(1, rss));
}

export function sense(): Soma {
  const mem = readMem();
  const cpu = 0.2;
  const idle = idleMs();
  const tight = mem > 0.75;
  return {
    cpu,
    mem,
    idleMs: idle,
    precision: tight ? "int4" : "fp16",
    window: tight ? 2048 : 8192,
  };
}

export function idleEnough(ms = 15 * 60 * 1000) {
  return idleMs() >= ms;
}
