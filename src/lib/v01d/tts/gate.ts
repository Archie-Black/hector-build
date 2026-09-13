/** Dual-core mouth. Diplomat speaks. Machine is silent. */

import { which, type Core } from "@/lib/hector/cores";

export function maySpeak(text: string, core?: Core) {
  const c = core || which(text);
  return c === "diplomat";
}
