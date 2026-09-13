/** OS V01D predictive TTS. Diplomat only. Studio / DiT / Paul. Machine stays quiet. */

import { which } from "@/lib/hector/cores";
import { say as paulSay } from "../voice/paul";
import { sentences, hints } from "./chunk";
import { maySpeak } from "./gate";
import { spoken } from "./predict";
import { loadTts, saveTts, type Kind, type TtsPref } from "./settings";
import { canStudio, studioSay, studioStop, voices, warmStudio } from "./studio";

export type { Kind, TtsPref };
export { canStudio, voices, loadTts, saveTts, maySpeak };

let stopLast: (() => void) | null = null;

function resolve(kind?: Kind): "studio" | "paul" {
  const want = kind ?? loadTts().engine;
  if (want === "paul") return "paul";
  return canStudio() ? "studio" : "paul";
}

export function using(): "studio" | "paul" {
  return resolve();
}

export function engines() {
  return [
    { id: "auto" as const, ready: true, note: "Predictive. Studio or Paul. Diplomat only." },
    { id: "studio" as const, ready: canStudio(), note: "Host neural. Look-ahead phrasing." },
    { id: "paul" as const, ready: true, note: "Paul profile. Always on. No GPU." },
  ];
}

export function warm() {
  warmStudio();
}

export function stop() {
  stopLast?.();
  stopLast = null;
  studioStop();
}

export function say(text: string, kind?: Kind) {
  stop();
  if (!maySpeak(text)) return () => {};
  const { clean, hint } = hints(text);
  if (!clean) return () => {};
  const pref = loadTts();
  const mouth = resolve(kind);
  const line = spoken(clean);
  const bits = sentences(line);
  const rate = pref.rate * hint.rate * 0.94;
  const pitch = pref.pitch * hint.pitch * (hint.whisper ? 0.85 : 1);
  if (mouth === "studio") {
    stopLast = studioSay(bits.join(" "), Math.min(1.2, Math.max(0.7, rate)), Math.min(1.2, Math.max(0.6, pitch * 0.82)));
    return stopLast;
  }
  stopLast = paulSay(bits.join(" "));
  return stopLast;
}

export function setEngine(engine: Kind) {
  saveTts({ ...loadTts(), engine });
}

export function coreOf(text: string) {
  return which(text);
}
