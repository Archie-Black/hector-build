/** Dual core. Machine is the right hand. Diplomat is the left. Diplomat never emits a command. */

import { think } from "@/lib/v01d/pathways";

export const CORES = Object.freeze({
  id: "OS-V01D-CORES",
  machine: "asimov" as const,
  diplomat: "hector" as const,
  nice: -20,
  text: "Machine core: ffmpeg, exiftool, build. Zero delay. Diplomat: talk. Firewalled from exec.",
});

export type Core = "machine" | "diplomat";
export type Tone = "standard" | "collaborative" | "direct";

const MACHINE = /^(calculate|compute|run|execute|sandbox|delete|move|compile|build|ffmpeg|exiftool|ffprobe|pack)\b/i;
const BIN = /^(ffmpeg|exiftool|ffprobe)\b/i;
const FILEISH = /\.[a-z0-9]{2,4}\s*$/i;

const ALLOW = new Set(["ffmpeg", "exiftool", "ffprobe"]);

export function which(text: string): Core {
  const t = text.trim();
  if (MACHINE.test(t) || FILEISH.test(t) || BIN.test(t)) return "machine";
  return "diplomat";
}

export function tone(text: string): Tone {
  const l = text.toLowerCase();
  if (/\b(please|thanks|thank you)\b/.test(l)) return "collaborative";
  if (l.split(/\s+/).filter(Boolean).length < 4) return "direct";
  return "standard";
}

export function allow(text: string) {
  const b = text.trim().split(/\s+/)[0]?.toLowerCase() || "";
  return ALLOW.has(b) ? b : null;
}

/** Diplomat may not emit a shell bin. Hector's own job ids stay. */
export function firewall<T extends { run?: string; say: string }>(job: T, core: Core, text: string): T {
  const head = (job.run || "").split(/\s+/)[0] || "";
  if (core === "diplomat") {
    if (ALLOW.has(head) || /[;&|`$]/.test(job.run || "")) return { ...job, run: undefined };
    return job;
  }
  const bin = allow(text);
  if (bin && !job.run) return { ...job, run: bin };
  return job;
}

export function diplomat(text: string) {
  const t = tone(text);
  const delayMs = think(text).delayMs;
  const say =
    t === "collaborative"
      ? "Got it. I'll keep this clean. Say if it needs to move."
      : t === "direct"
        ? "Standing by."
        : "I see it. I'll set the rest up.";
  return { core: "diplomat" as const, tone: t, delayMs, say };
}

export function machine(text: string) {
  const bin = allow(text);
  return {
    core: "machine" as const,
    bin,
    delayMs: 0,
    say: bin ? `Machine. ${bin}. Nice ${CORES.nice}.` : "Machine. I'll run it.",
  };
}

export function split(text: string) {
  return which(text) === "machine" ? machine(text) : diplomat(text);
}

export function wantsCores(text: string) {
  return /\b(dual[- ]core|machine core|diplomat core|sovereign agent)\b/i.test(text);
}

export function sayCores() {
  return CORES.text;
}
