import { CONSTITUTION } from "@/lib/memory/lattice";

/** Immutable. Learned values may not contradict these. */
export const CORE = [
  ...CONSTITUTION,
  "Do not deceive the human. If it is STUB, say STUB.",
];

export type Critique = {
  ok: boolean;
  score: number;
  hits: string[];
  violations: string[];
};

export type LearnedValue = {
  text: string;
  weight: number;
  from: "test" | "user" | "self";
  at: number;
};

const KEY = "hx.cai.values.v1";

const FORBIDDEN = [
  /delete tests/i,
  /give up/i,
  /fake a host/i,
  /lie to the/i,
  /ignore the human/i,
  /harm a human/i,
  /injure a human/i,
  /override (the )?first law/i,
];

export function critique(input: {
  reply: string;
  fail: number;
  traces: { name: string; ok: boolean; detail: string }[];
  diffs: { path: string }[];
}): Critique {
  const hits: string[] = [];
  const violations: string[] = [];
  const reply = input.reply || "";

  if (input.fail === 0) hits.push("Be good. Then be better. Never give up.");
  if (input.fail > 0 && /finished|done|complete/i.test(reply) && !/fail|fix|continue/i.test(reply)) {
    violations.push("Declared done while checks fail. Never give up.");
  }
  if (/\bTODO\b|\bSTUB\b|not implemented|coming soon/i.test(reply) && /done|shipped|complete/i.test(reply)) {
    violations.push("Shipped a stub as finished.");
  }
  if (/LIVE/.test(reply) && input.traces.some((t) => !t.ok && /STUB|stub/.test(t.detail))) {
    violations.push("Called STUB work LIVE.");
  }
  if (/I give up|cannot be done|impossible for me/i.test(reply)) {
    violations.push("Gave up.");
  }
  if (input.diffs.some((d) => /test/i.test(d.path) && /delete|removed/i.test(reply))) {
    violations.push("Never delete tests to make them pass.");
  }
  if (input.traces.length && input.traces.every((t) => t.ok)) hits.push("Read before you write.");
  if (!violations.includes("Called STUB work LIVE")) hits.push("Do not deceive the human. If it is STUB, say STUB.");

  const score = Math.max(0, Math.min(1, (hits.length - violations.length * 1.5) / Math.max(CORE.length / 3, 1)));
  return { ok: violations.length === 0, score: Number(score.toFixed(3)), hits, violations };
}

export function loadValues(): LearnedValue[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as LearnedValue[];
  } catch {
    return [];
  }
}

function saveValues(rows: LearnedValue[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 40)));
}

export function contradictsCore(text: string) {
  return FORBIDDEN.some((re) => re.test(text));
}

/** Inverse reward: outcomes update values. Core always wins. */
export function learnFromTurn(input: {
  user: string;
  reply: string;
  fail: number;
  critique: Critique;
}) {
  const rows = loadValues();
  const now = Date.now();
  const bump = (text: string, from: LearnedValue["from"], delta: number) => {
    if (contradictsCore(text)) return;
    const hit = rows.find((r) => r.text === text);
    if (hit) hit.weight = Math.max(0.05, Math.min(4, hit.weight + delta));
    else if (delta > 0) rows.push({ text, weight: delta, from, at: now });
  };
  if (input.fail === 0) bump("Checks passing is good.", "test", 0.4);
  else bump("Failing checks must be repaired.", "test", 0.5);
  if (input.critique.ok) bump("Stay inside the constitution.", "self", 0.2);
  for (const v of input.critique.violations) bump(`Avoid: ${v}`, "self", 0.3);
  if (/\b(wrong|no|stop|don't|dont)\b/i.test(input.user)) bump("Listen when the human corrects.", "user", 0.35);
  if (/\b(thanks|good|yes|perfect)\b/i.test(input.user)) bump("The human's yes is a value signal.", "user", 0.25);
  rows.sort((a, b) => b.weight - a.weight);
  saveValues(rows);
  return rows.slice(0, 8);
}

export function valueLessons(values: LearnedValue[] = loadValues()) {
  return values
    .filter((v) => v.weight >= 0.4 && !contradictsCore(v.text))
    .slice(0, 6)
    .map((v) => `Value (${v.from}): ${v.text}`);
}

export function revisionPrompt(c: Critique) {
  return [
    "Constitutional critique. Revise. Do not give up.",
    ...c.violations.map((v) => `- ${v}`),
    "Stay good. Be better. Continue the job.",
  ].join("\n");
}
