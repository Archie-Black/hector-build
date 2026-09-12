import { has } from "./lexicon";

export type Step = { id: string; do: string; done: boolean };

export type Task = {
  id: string;
  title: string;
  steps: Step[];
  at: number;
};

export type Fly = "amend" | "add" | "hold" | "start";

export type Place = { task: string; at: number; braid: number; do: string };

const WORK: Task[] = [];
const INBOX: string[] = [];

function braid(t: Task) {
  const rest = t.steps.slice(t.at).map((s) => s.do).join("|");
  let h = 2166136261;
  for (let i = 0; i < rest.length; i++) h = Math.imul(h ^ rest.charCodeAt(i), 16777619);
  return h >>> 0;
}

function now(): Task | undefined {
  return WORK[WORK.length - 1];
}

export function snapshot(): Place | null {
  const t = now();
  if (!t) return null;
  const step = t.steps[t.at];
  return { task: t.title, at: t.at, braid: braid(t), do: step?.do || t.title };
}

export function kind(text: string): Fly {
  const k = text.trim();
  if (!now()) return "start";
  if (has(k, "amend")) return "amend";
  if (has(k, "hold") && !has(k, "amend")) return "hold";
  if (has(k, "add")) return "add";
  return "add";
}

export function begin(title: string, work: string[]) {
  const steps = (work.length ? work : [title]).map((do_, i) => ({ id: `${i}`, do: do_, done: false }));
  WORK.push({ id: `t${WORK.length}`, title, steps, at: 0 });
  return snapshot();
}

export function hear(text: string) {
  const t = text.trim();
  const how = kind(t);
  if (how === "start") {
    begin(t, [t]);
    return { how, say: "On it.", place: snapshot() };
  }
  const cur = now()!;
  if (how === "amend") {
    cur.steps[cur.at] = { ...cur.steps[cur.at], do: t };
    return { how, say: "Changed. Same place.", place: snapshot() };
  }
  if (how === "add") {
    cur.steps.splice(cur.at + 1, 0, { id: `${cur.steps.length}`, do: t, done: false });
    return { how, say: "Added. Still working.", place: snapshot() };
  }
  INBOX.push(t);
  return { how, say: "Holding this. I did not lose my place.", place: snapshot() };
}

export function tick() {
  const t = now();
  if (!t) return snapshot();
  const s = t.steps[t.at];
  if (s) s.done = true;
  if (t.at + 1 < t.steps.length) t.at += 1;
  else if (INBOX.length) {
    const next = INBOX.shift()!;
    begin(next, [next]);
  }
  return snapshot();
}

export function inbox() {
  return INBOX.slice();
}

export function reset() {
  WORK.length = 0;
  INBOX.length = 0;
}
