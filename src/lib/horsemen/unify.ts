import { HECTOR_ID, HORSEMEN, lead, listRiders, rider, type HorsemanId } from "./roster.ts";
import { gate } from "./gateway.ts";
import { writeAudit } from "./audit.ts";
import { pickRider, WEB_RIDERS } from "../web/ride.ts";

export type AskResult = {
  from: HorsemanId;
  lead: typeof HECTOR_ID;
  text: string;
};

const DEPTH_MAX = 1;

export function askBot(from: HorsemanId, target: HorsemanId, message: string, depth = 0): AskResult {
  if (depth >= DEPTH_MAX && target !== HECTOR_ID) {
    return { from: HECTOR_ID, lead: HECTOR_ID, text: "Famine blocks chains. One hop only. Hector takes it." };
  }
  const who = rider(target);
  writeAudit({ at: Date.now(), bot: from, tool: "horsemen_ask", decision: "allow", detail: `${from}→${target}` });
  const text = [
    `${lead().name} speaking.`,
    `${who.name} (${who.lineage}) reports: ${who.duty}`,
    message.trim() ? `Task: ${message.trim().slice(0, 400)}` : "Standing by.",
  ].join(" ");
  return { from: target, lead: HECTOR_ID, text };
}

export function superBotBrief() {
  const h = lead();
  return {
    super: "apocalypse",
    lead: h,
    riders: listRiders(),
    line: `${h.name} leads Conquest, War, and Famine. Punisher rides the surface web. Dark Horse rides the onion. One voice.`,
    web: WEB_RIDERS,
  };
}

export function routeTask(prompt: string): HorsemanId {
  const p = prompt.toLowerCase();
  if (/(policy|isolat|audit|deny|allow|container)/.test(p)) return "war";
  if (/(approv|roster|local|chat|deny card|ask_bot)/.test(p)) return "famine";
  if (/(memory|routine|persist|teammate|schedule)/.test(p)) return "conquest";
  return HECTOR_ID;
}

export function routeWeb(raw: string, isolate = false) {
  return pickRider(raw, isolate);
}

export function hectorDelegate(prompt: string) {
  const target = routeTask(prompt);
  if (target === HECTOR_ID) {
    return { from: HECTOR_ID, lead: HECTOR_ID, text: `${lead().name} keeps this.` };
  }
  return askBot(HECTOR_ID, target, prompt, 0);
}

export { gate, HORSEMEN, HECTOR_ID, lead };
