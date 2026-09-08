import type { ToolTrace } from "./types";

export type MetaMemory = {
  version: number;
  lessons: string[];
  facts: string[];
  lastReview: number;
};

const KEY = "hector-meta-memory-v1";
export const LATTICE_VERSION = 2;

const SEED_LESSONS = [
  "Never delete tests to make them pass.",
  "Explain each step in ordinary language before jargon.",
  "Wait for the human to allow writes before changing files.",
];

export function emptyMemory(): MetaMemory {
  return {
    version: LATTICE_VERSION,
    lessons: [...SEED_LESSONS],
    facts: [],
    lastReview: Date.now(),
  };
}

export function loadMemory(): MetaMemory {
  if (typeof window === "undefined") return emptyMemory();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw) as MetaMemory;
    if (!Array.isArray(parsed.lessons)) return emptyMemory();
    if (parsed.version < LATTICE_VERSION) {
      return {
        ...parsed,
        version: LATTICE_VERSION,
        lessons: mergeLessons(parsed.lessons, [
          "Team lead assigns scout, patch, and checks under one project grant.",
        ]),
        lastReview: Date.now(),
      };
    }
    return parsed;
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(memory: MetaMemory) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(memory));
}

export function mergeLessons(current: string[], extra: string[]): string[] {
  const out = [...current];
  for (const item of extra) {
    const t = item.trim();
    if (!t) continue;
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) continue;
    out.push(t);
  }
  return out.slice(-24);
}

export function lessonFromTurn(traces: ToolTrace[], testsPass: boolean | null): string | null {
  const writes = traces.filter((t) => t.ok && (t.name === "write_file" || t.name === "apply_patch"));
  const tests = traces.find((t) => t.name === "run_tests");
  if (writes.length && testsPass === true) {
    return "A repair that keeps tests passing is worth remembering.";
  }
  if (writes.length && tests && !tests.ok) {
    return "If checks fail after a write, keep iterating instead of declaring victory.";
  }
  if (traces.some((t) => !t.ok)) {
    return "A refused tool is a stop sign, not a prompt to force the same path.";
  }
  return null;
}
