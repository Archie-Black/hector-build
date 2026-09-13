/** Sandboxed mutation. Only routing delay and retrieval mix. Never the charter. */

import type { Kpis } from "./kpis";
import { setAdapt } from "@/lib/v01d/geom";

export type Patch = { kind: "delay" | "window" | "none"; note: string; applied: boolean };

let delay = 1;
let mix = 0.5;

export function propose(k: Kpis): Patch {
  if (k.ttftMs > 800) {
    delay = Math.min(2, delay + 0.1);
    setAdapt(0.4, delay);
    return { kind: "delay", note: "Slow first token. Heat step raised, UI delay eased.", applied: true };
  }
  if (k.alignment < 0.45) {
    mix = Math.min(0.9, mix + 0.1);
    return { kind: "window", note: "Memories missed the question. Retrieval mix raised.", applied: true };
  }
  return { kind: "none", note: "Metrics hold.", applied: false };
}

export function mixW() {
  return mix;
}

export function resetMutate() {
  delay = 1;
  mix = 0.5;
  setAdapt(0.25, 1);
}
