/** Nervous system. Brain is software. Body is the chassis. Web and desk are the nerves. */

import { fire } from "@/lib/hector/brain";
import { ORIGIN } from "./origin";
import { FIRM } from "./firmware";
import { HAL } from "./hal";

export const NERVE = Object.freeze({
  id: "OS-V01D-NERVES",
  brain: "software" as const,
  body: "hardware" as const,
  nerves: "web and desk" as const,
  text: "Hector is the brain in the software. The chassis is the body. The web and the desk are the nerves. Immutable.",
});

const KEY = "__V01D_NERVES__" as const;

export function sealNerves() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: NERVE, writable: false, configurable: false, enumerable: false });
  }
  return NERVE;
}

export type Tract = "somatic" | "autonomic" | "cranial";

export const BODY = Object.freeze({
  seat: ORIGIN.path,
  skin: FIRM.path,
  nervesHal: HAL.name,
});

/** Where a click or a page lands on the body. */
export const SKIN: Record<string, string> = {
  ghostwalk: "web",
  files: "hands",
  programs: "hands",
  notes: "speech",
  portal: "play",
  code: "speech",
  crapple: "hands",
  helix: "hands",
  room: "hands",
  asimov: "body",
  forge: "ear",
  suite: "eye",
  terminal: "speech",
  settings: "skin",
  chat: "speech",
  desk: "skin",
  field: "skin",
  firmware: "skin",
};

export type Impulse = {
  tract: Tract;
  site: string;
  dermatome: string;
  delayMs: number;
  glue: boolean;
  speak: boolean;
};

export function feel(tract: Tract, site: string, text: string): Impulse {
  const p = fire(text);
  return {
    tract,
    site,
    dermatome: SKIN[site] || "skin",
    delayMs: p.left.delayMs,
    glue: p.glue,
    speak: tract !== "autonomic",
  };
}

let lastAuto = 0;
export function auto(site: string) {
  const n = Date.now();
  if (n - lastAuto < 4000) return null;
  lastAuto = n;
  return feel("autonomic", site, site);
}

export function map() {
  return {
    brain: { where: NERVE.brain, left: "hector", right: "asimov", callosum: "tqc-b3" },
    body: { where: NERVE.body, ...BODY },
    nerves: { where: NERVE.nerves, tracts: ["cranial", "somatic", "autonomic"] as Tract[], skin: SKIN },
  };
}

export function wantsNerves(text: string) {
  return /\b(nervous system|the nerves|dermatome|this (brain|body))\b/i.test(text);
}

export function sayNerves() {
  return NERVE.text;
}
