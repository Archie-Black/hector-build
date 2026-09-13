/** Master bus. On from install. Volume lives in Feel. */

import { feel } from "./feel";

const KEY = "v01d-mute";

let ac: AudioContext | null = null;
let gain: GainNode | null = null;
let quiet = false;
const watch = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* */
  }
}

function level() {
  if (quiet) return 0;
  const v = feel().volume;
  return Number.isFinite(v) ? v : 0.72;
}

export function muted() {
  return quiet;
}

export function bus() {
  const C = globalThis.AudioContext || (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  if (!ac) {
    ac = new C();
    gain = ac.createGain();
    quiet = read();
    gain.gain.value = level();
    gain.connect(ac.destination);
  }
  return { ac, gain: gain! };
}

export function unlock() {
  const b = bus();
  if (!b) return;
  if (b.ac.state === "suspended") void b.ac.resume();
}

export function applyGain() {
  const b = bus();
  if (b) b.gain.gain.setTargetAtTime(level(), b.ac.currentTime, 0.03);
}

export function setMuted(v: boolean) {
  quiet = v;
  write(v);
  applyGain();
  for (const fn of watch) fn();
}

export function toggleMute() {
  setMuted(!quiet);
}

export function onMute(fn: () => void) {
  watch.add(fn);
  return () => {
    watch.delete(fn);
  };
}

export function bootSound() {
  quiet = read();
  bus();
  applyGain();
  unlock();
}
