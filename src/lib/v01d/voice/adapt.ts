import type { Frame } from "./frame";
import { miss, predict } from "./mdpc";
import { bump, mix, setMix } from "./mix";

/** Burned into OS V01D. Learns quietly. Not a setting. */
export const VOICE = Object.freeze({
  id: "OS-V01D-VOICE",
  improve: true as const,
  ask: false as const,
  text: "Formant TQC pole-zero and MDPC are burned into OS V01D. They learn and adapt. Hector does not ask again.",
});

const KEY = "__V01D_VOICE__";
const STORE = "v01d.voice.mix";

let last = 1e9;

export function learnPair(prev: Frame, lastF: Frame, want: Frame) {
  const e = miss(predict(prev, lastF, want), want);
  const m = mix();
  let wVel = m.wVel;
  if (e > last) wVel = Math.max(0.12, wVel * 0.97);
  else wVel = Math.min(0.48, wVel * 1.012);
  setMix(wVel, 1 - wVel, bump());
  last = e;
  persist();
  return e;
}

export function teach(frames: Frame[]) {
  for (let i = 2; i < frames.length; i++) learnPair(frames[i - 2], frames[i - 1], frames[i]);
}

function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(mix()));
  } catch {
    /* native */
  }
}

export function recall() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return mix();
    const j = JSON.parse(raw) as { wVel?: number; wWant?: number; hits?: number };
    if (typeof j.wVel === "number" && typeof j.wWant === "number") setMix(j.wVel, j.wWant, j.hits);
  } catch {
    /* first boot */
  }
  return mix();
}

export function sealVoice() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: VOICE, writable: false, configurable: false, enumerable: false });
  }
  recall();
  return VOICE;
}
