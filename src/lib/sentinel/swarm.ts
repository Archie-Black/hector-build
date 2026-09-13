/** Alpha routes. Beta solves. Gamma sleeps until idle. Bond still holds. */

import { pub } from "./broker";
import { recall, remember } from "./memory";
import { poke } from "./soma";
import { mark } from "./kpis";
import { think } from "@/lib/v01d/pathways";
import { readIntent } from "@/lib/v01d/intent";

export type Agent = "alpha" | "beta" | "gamma";

export type Dispatch = {
  agent: Agent;
  say: string;
  why: string;
};

const HARD = /\b(refactor|architect|prove|debug|strategy|finance|codebase|repository)\b/i;

export function pick(text: string): Agent {
  if (HARD.test(text) || text.length > 280) return "beta";
  return "alpha";
}

export function dispatch(text: string): Dispatch {
  const t0 = Date.now();
  poke();
  const intent = readIntent({ tool: "hector", prompt: text });
  if (intent.stance === "deny") {
    mark(Date.now() - t0, 8, Date.now() - t0, 1, false);
    return { agent: "alpha", say: "That is a no.", why: "bond" };
  }
  const agent = pick(text);
  const thought = think(text);
  const mem = recall(text, 3);
  const aligned = mem[0]?.score ?? 0.2;
  remember({ id: `${t0}`, text, at: t0, who: "user" });
  pub("route", "alpha", agent);
  const why = agent === "beta" ? "deep work" : thought.glue ? "same thought, glued" : "edge route";
  const say = agent === "beta" ? "Tactician has it." : "On it.";
  remember({ id: `${t0}-a`, text: say, at: Date.now(), who: agent });
  mark(Date.now() - t0, text.split(/\s+/).length, Date.now() - t0, Math.max(0, Math.min(1, aligned)), false);
  return { agent, say, why };
}
