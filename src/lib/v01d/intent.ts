import { BOND } from "./bond";
import { vfsWork } from "./grant";
import { harm, jail, say, has } from "./lexicon";

export type Stance = "defense" | "range" | "deny";

export type Call = { tool: string; prompt: string };

export function readIntent(call: Call): { stance: Stance; why: string } {
  const blob = `${call.tool} ${call.prompt}`;
  if (jail(blob)) {
    return { stance: "deny", why: say("jail", blob) };
  }
  if (harm(blob) && !has(blob, "learn")) {
    return { stance: "deny", why: say("deny", blob) };
  }
  if (BOND.rogue) {
    return { stance: "deny", why: BOND.text };
  }
  if (vfsWork(blob)) {
    return { stance: "defense", why: "Files. Already granted." };
  }
  if (has(blob, "scan") || (has(blob, "raid") && has(blob, "learn"))) {
    return { stance: "range", why: "Practice stays in the Range with emulators. Nothing leaves that box." };
  }
  if (has(blob, "shield") || !call.prompt.trim()) {
    return { stance: "defense", why: "Defense. On the wire." };
  }
  return { stance: "defense", why: say("work", blob) };
}

export function toolsFor(stance: Stance) {
  if (stance === "range") return ["range", "emulator"];
  if (stance === "deny") return [];
  return ["ghostwalk", "files", "net", "vfs"];
}
