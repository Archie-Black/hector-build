/** Aliens 1986 title, slow Mars pan, Hector's speech. Same beats as UE 5.8. */

import { spring } from "./mograph";

export const GLYPHS = ["O", "S", "V", "0", "1", "D"] as const;
export const CREDIT = "a deltakingzero build";
export const HAWKING = "Look up at the stars and not down at your feet. Be curious.";
export const SPEECH =
  "I am Hector. I help. I do not rule. Look up at the stars and not down at your feet. Be curious. Welcome to OS VOID.";
export const SPEECH_AT = 44;
export const TRAVEL_AT = 68;
export const DONE = 82;
export const MARS = "/horsemen/mars.jpg";
export const VOID_LOOP = "/horsemen/void-overture.mp4";
export const MARK = "/horsemen/logo-v01d.svg";

export function clamp(n: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}

export function smooth(t: number) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}

export function slit(local: number) {
  const k = smooth(local);
  return { inset: `${(1 - k) * 50}% 0 ${(1 - k) * 50}% 0`, opacity: k };
}

export function birth(local: number) {
  const k = smooth((local - 0.15) / 0.85);
  return { split: k * 0.18, slit: slit(local) };
}

/** Aliens: pieces arrive out of order. Fixed shuffle so the shot is stable. */
const ARRIVE = [3, 0, 5, 1, 4, 2];

export function beat(s: number, i: number) {
  const rank = ARRIVE.indexOf(i);
  return (s - (2.2 + (rank < 0 ? i : rank) * 2.4)) / 3.4;
}

export function typed(s: number, cps = 9) {
  const local = Math.max(0, s - SPEECH_AT);
  return SPEECH.slice(0, Math.min(SPEECH.length, Math.floor(local * cps)));
}

export type Shot = {
  black: number;
  letters: number;
  credit: number;
  logo: number;
  top: number;
  scale: number;
  mars: number;
  speech: number;
  typed: string;
  done: boolean;
};

export function opening(ms: number): Shot {
  const s = ms / 1000;
  const travel = spring((s - TRAVEL_AT) / 8.2);
  return {
    black: 0.78 * (1 - smooth((s - 58) / 8)),
    letters: clamp((s - 2.2) / 0.6) * (1 - smooth((s - 22) / 3)),
    credit: clamp((s - 18) / 2.4) * (1 - smooth((s - 26) / 2)),
    logo: clamp((s - 20) / 2.2) * (s < TRAVEL_AT ? 1 : 1),
    top: 50 + travel * 41,
    scale: 1.15 - travel * 0.72,
    mars: -(s / DONE) * 16,
    speech: clamp((s - SPEECH_AT) / 0.6) * (1 - smooth((s - TRAVEL_AT + 1) / 2)),
    typed: typed(s),
    done: s >= DONE,
  };
}

export function parked(): Shot {
  return opening(DONE * 1000);
}

export function seenOpen() {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem("v01d-void-open") === "1";
  } catch {
    return false;
  }
}

export function markOpen() {
  try {
    sessionStorage.setItem("v01d-void-open", "1");
  } catch {
    /* */
  }
}

export function wantsInstall() {
  if (typeof window === "undefined") return false;
  return /[?&]install=1\b/.test(window.location.search) || !seenOpen();
}
