/** Syntax. Tokens, clauses, person, tense, register. Deterministic. */

export type ClauseKind = "declarative" | "question" | "imperative" | "fragment";
export type Register = "casual" | "neutral" | "formal";
export type Tense = "past" | "present" | "future";

export type Clause = { kind: ClauseKind; text: string };

export type Syntax = {
  tokens: string[];
  clauses: Clause[];
  person: 1 | 2 | 3;
  tense: Tense;
  register: Register;
  contractions: number;
  words: number;
  jargon: string[];
};

const JARGON = [
  "hector api",
  "local engine",
  "spectral hx",
  "parallel bots",
  "briefing",
  "prove",
  "swarm",
  "lattice",
  "netd",
  "zero trust",
  "mmu",
  "tool_calls",
];

export function tokensOf(text: string) {
  return text.match(/[A-Za-z']+|[\d.]+|[.!?]/g) ?? [];
}

function clauseKind(c: string): ClauseKind {
  const t = c.trim();
  if (/\?\s*$/.test(t)) return "question";
  if (/^(please |do |add |build |fix |make |write |create |install |put )\b/i.test(t)) return "imperative";
  if (t.split(/\s+/).length < 3) return "fragment";
  return "declarative";
}

export function parse(text: string): Syntax {
  const raw = text.replace(/\s+/g, " ").trim();
  const tokens = tokensOf(raw);
  const clauses = raw
    .split(/(?<=[.!?])\s+/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ kind: clauseKind(c), text: c }));
  const blob = raw.toLowerCase();
  const person: 1 | 2 | 3 = /\b(i|i'm|i'll|we|we're)\b/i.test(raw) ? 1 : /\b(you|you're)\b/i.test(raw) ? 2 : 3;
  const tense: Tense = /\b(will|gonna|going to)\b/i.test(raw) ? "future" : /\b(was|were|did|had)\b/i.test(raw) ? "past" : "present";
  const register: Register = /\b(hey|gonna|wanna|yeah|ok|nah)\b/i.test(raw) || /'/i.test(raw)
    ? "casual"
    : /\b(therefore|pursuant|hereby|kindly|shall)\b/i.test(raw)
      ? "formal"
      : "neutral";
  const contractions = (raw.match(/\b\w+'\w+\b/g) || []).length;
  const jargon = JARGON.filter((j) => blob.includes(j));
  return { tokens, clauses: clauses.length ? clauses : [{ kind: "fragment", text: raw }], person, tense, register, contractions, words: tokens.filter((t) => /[A-Za-z]/.test(t)).length, jargon };
}

export function stripJargon(text: string) {
  let t = text;
  for (const j of JARGON) t = t.replace(new RegExp(j.replace(/ /g, "\\s+"), "ig"), "");
  return t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}
