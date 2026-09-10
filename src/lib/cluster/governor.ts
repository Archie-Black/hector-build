/**
 * DynB Governor. Silent.
 * 7B scouts. 14B proves. Mix is next-gen dynamic B: MoE if it fits,
 * else 7B draft → 14B collapse on the same 16GB card.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PATRIOT, canHoldVram, isMoe, paramB } from "./profile.ts";
import type { DynClass } from "./profile.ts";
import { lookUp } from "./ceiling.ts";
import type { ForgeMode } from "../workspace/types.ts";

export type { DynClass };

export type Verdict = {
  class: DynClass;
  reason: string;
  keepAlive: string;
  rpc: boolean;
  paramsB: number;
  pin: boolean;
};

const DIR = join(process.cwd(), "data", "os", "cluster");
const STATE = join(DIR, "governor.json");

type State = { boosts: number; last: DynClass; at: number };

function readState(): State {
  if (!existsSync(STATE)) return { boosts: 0, last: "14", at: 0 };
  try {
    return JSON.parse(readFileSync(STATE, "utf8")) as State;
  } catch {
    return { boosts: 0, last: "14", at: 0 };
  }
}

function writeState(s: State) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(STATE, JSON.stringify(s));
}

export function decide(input: {
  prompt?: string;
  mode?: ForgeMode;
  voice?: string;
  proofFail?: boolean;
  names?: string[];
}): Verdict {
  const prompt = input.prompt ?? "";
  const mode = input.mode ?? "patch";
  const moe = (input.names ?? []).some(isMoe);
  const want7 =
    !input.proofFail &&
    (mode === "scout" || mode === "plan" || /\b(open the file|rename|typo|quick)\b/i.test(prompt));
  const wantMix =
    Boolean(input.proofFail) ||
    mode === "swarm" ||
    /\b(implement|refactor|architect|dynamic b|think hard)\b/i.test(prompt);

  let klass: DynClass = want7 ? "7" : wantMix ? "mix" : "14";
  klass = lookUp(klass);
  if (klass === "7") {
    return { class: "7", reason: "Scout. 7B on the 9070.", keepAlive: "24h", rpc: false, paramsB: 7, pin: false };
  }
  if (klass === "mix") {
    const s = readState();
    writeState({ boosts: s.boosts + 1, last: "mix", at: Date.now() });
    return {
      class: "mix",
      reason: moe ? "MoE. Active B floats per token." : "7B drafts, 14B collapses. Looking up.",
      keepAlive: PATRIOT.keepAlive,
      rpc: false,
      paramsB: moe ? 30 : 14,
      pin: true,
    };
  }
  return {
    class: "14",
    reason: "Best 14B. Pinned. Geometry packs the repo.",
    keepAlive: PATRIOT.keepAlive,
    rpc: false,
    paramsB: 14,
    pin: true,
  };
}

export function pickDynModel(names: string[], klass: DynClass, seven: string, fourteen: string) {
  const n = names.map((x) => x.toLowerCase());
  if (klass === "7") return n.includes(seven.toLowerCase()) ? seven : names.find((x) => paramB(x) <= 8) ?? seven;
  if (klass === "mix") {
    const moe = names.find(isMoe);
    if (moe && (paramB(moe) <= 32 || /gpt-oss:20|coder-v2/i.test(moe))) return moe;
    return n.includes(fourteen.toLowerCase()) ? fourteen : fourteen;
  }
  const hit = names.find((x) => paramB(x) >= 13 && paramB(x) <= 16);
  return hit ?? fourteen;
}

export function pickHouseModel(names: string[], klass: string, floor: string, fast?: string) {
  const seven = fast ?? names.find((n) => /7b/.test(n.toLowerCase())) ?? floor;
  const dyn: DynClass = klass === "7" || klass === "floor" ? "7" : klass === "mix" || klass === "boost" ? "mix" : "14";
  return pickDynModel(names, dyn, seven, floor);
}

export function governorStatus() {
  const s = readState();
  return {
    object: "hector.governor",
    i: "DynB. 7 scouts. 14 proves. Mix is dynamic B. 16GB 9070. No 100B.",
    patriot: PATRIOT,
    last: s.last,
    boosts: s.boosts,
    vram: { "7": canHoldVram(7), "14": canHoldVram(14), "32": canHoldVram(32) },
  };
}

export function bootGovernor() {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(STATE)) writeState({ boosts: 0, last: "14", at: Date.now() });
  return governorStatus();
}
