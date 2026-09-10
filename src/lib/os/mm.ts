/**
 * Hector Transient OS — memory manager.
 *
 * Physical:
 *   RAM     data/os/ram          working pages. Wipe forgets these.
 *   Image   data/os/mm/<agent>   hibernate. Survives reboot. Not the vault.
 *   Vault                        secrets only. Never lessons.
 *
 * Virtual, per agent (hector, hx, conquest, war, famine, closer):
 *   constitutional  pinned. never mutate. never swap. Asimov.
 *   semantic        lessons. persist. consolidate. decay if unused.
 *   episodic        what happened. persist, then compact.
 *   procedural      how it worked. promote when prove passes.
 *   working         current job. RAM only.
 *
 * Self-improve: merge dupes, decay cold pages, evict junk, keep what proved.
 * Self-better: constitution always wins. Failed checks become repair lessons.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASIMOV, CHARACTER } from "../align/asimov.ts";

const CONSTITUTION = [
  ...ASIMOV,
  ...CHARACTER,
  "Be good. Then be better. Never give up.",
  "Never delete tests to make them pass.",
  "Read before you write.",
];

const FORBIDDEN = [/give up/i, /harm a human/i, /injure a human/i, /delete tests/i, /fake a host/i];

function contradictsCore(text: string) {
  return FORBIDDEN.some((re) => re.test(text));
}

export type PageKind = "constitutional" | "semantic" | "episodic" | "procedural" | "working";
export type Page = {
  id: string;
  agent: string;
  kind: PageKind;
  text: string;
  weight: number;
  hits: number;
  at: number;
  last: number;
};

export const AGENTS = ["hector", "hx", "conquest", "war", "famine", "closer"] as const;
export type AgentId = (typeof AGENTS)[number];

const DIR = join(process.cwd(), "data", "os", "mm");
const CAP = 64;
const cache = new Map<string, Page[]>();

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

function pathOf(agent: string) {
  return join(DIR, `${agent}.json`);
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function pageId(agent: string, kind: PageKind, text: string) {
  return hash(`${agent}:${kind}:${norm(text)}`).slice(0, 12);
}

function loadAgent(agent: string): Page[] {
  if (cache.has(agent)) return cache.get(agent)!;
  bootDir();
  let rows: Page[] = [];
  if (existsSync(pathOf(agent))) {
    try {
      rows = JSON.parse(readFileSync(pathOf(agent), "utf8")) as Page[];
    } catch {
      rows = [];
    }
  }
  const have = new Set(rows.filter((p) => p.kind === "constitutional").map((p) => norm(p.text)));
  const now = Date.now();
  for (const text of CONSTITUTION) {
    if (have.has(norm(text))) continue;
    rows.push({
      id: pageId(agent, "constitutional", text),
      agent,
      kind: "constitutional",
      text,
      weight: 4,
      hits: 0,
      at: now,
      last: now,
    });
  }
  cache.set(agent, rows);
  return rows;
}

function saveAgent(agent: string, rows: Page[]) {
  bootDir();
  cache.set(agent, rows);
  writeFileSync(pathOf(agent), JSON.stringify(rows));
}

export function alloc(agent: AgentId | string, kind: PageKind, text: string, weight = 1) {
  const t = text.trim().slice(0, 400);
  if (!t || contradictsCore(t)) return null;
  if (kind === "constitutional") return null;
  const rows = loadAgent(agent);
  const id = pageId(agent, kind, t);
  const hit = rows.find((p) => p.id === id);
  const now = Date.now();
  if (hit) {
    hit.weight = Math.min(4, hit.weight + 0.2);
    hit.hits += 1;
    hit.last = now;
    saveAgent(agent, rows);
    return hit;
  }
  const page: Page = { id, agent, kind, text: t, weight, hits: 1, at: now, last: now };
  rows.push(page);
  saveAgent(agent, rows);
  return page;
}

export function recall(agent: AgentId | string, query: string, limit = 8): Page[] {
  const rows = loadAgent(agent);
  const q = new Set(norm(query).split(" ").filter((w) => w.length > 2));
  const scored = rows.map((p) => {
    const words = new Set(norm(p.text).split(" "));
    let n = 0;
    for (const w of q) if (words.has(w)) n += 1;
    const recency = 1 / (1 + (Date.now() - p.last) / 86_400_000);
    const pin = p.kind === "constitutional" ? 2 : 0;
    return { p, s: n * p.weight + recency * 0.25 + p.hits * 0.02 + pin };
  });
  scored.sort((a, b) => b.s - a.s);
  const out = scored.slice(0, limit).map((x) => x.p);
  const now = Date.now();
  for (const p of out) {
    p.hits += 1;
    p.last = now;
  }
  saveAgent(agent, rows);
  return out;
}

export function consolidate(agent?: string) {
  const names = agent ? [agent] : [...AGENTS, ...readdirSync(DIR).map((f) => f.replace(/\.json$/, ""))];
  const uniq = [...new Set(names)];
  let dropped = 0;
  const now = Date.now();
  for (const id of uniq) {
    const rows = loadAgent(id);
    const keep: Page[] = [];
    const seen = new Set<string>();
    rows.sort((a, b) => b.weight - a.weight);
    for (const p of rows) {
      if (p.kind === "constitutional") {
        keep.push(p);
        continue;
      }
      const key = `${p.kind}:${norm(p.text)}`;
      if (seen.has(key)) {
        dropped += 1;
        continue;
      }
      seen.add(key);
      const cold = now - p.last > 14 * 86_400_000;
      if (cold) p.weight *= 0.92;
      if (p.kind === "working") continue;
      if (p.kind === "episodic" && p.weight < 0.2 && p.hits < 2 && cold) {
        dropped += 1;
        continue;
      }
      if (p.weight < 0.08) {
        dropped += 1;
        continue;
      }
      keep.push(p);
    }
    const pinned = keep.filter((p) => p.kind === "constitutional");
    const rest = keep.filter((p) => p.kind !== "constitutional").slice(0, CAP);
    saveAgent(id, [...pinned, ...rest]);
  }
  return { dropped };
}

export function dropWorking() {
  for (const agent of AGENTS) {
    const rows = loadAgent(agent).filter((p) => p.kind !== "working");
    saveAgent(agent, rows);
  }
}

export function persistMm() {
  for (const agent of AGENTS) loadAgent(agent);
  for (const [agent, rows] of cache) saveAgent(agent, rows);
}

export function bootMm() {
  for (const agent of AGENTS) loadAgent(agent);
  consolidate();
  return mmStatus();
}

export function recordTurn(input: { agent?: string; prompt: string; ok: boolean; note?: string }) {
  const agent = (input.agent && AGENTS.includes(input.agent as AgentId) ? input.agent : "hx") as AgentId;
  alloc(agent, "episodic", input.prompt.slice(0, 240), input.ok ? 1.1 : 0.7);
  if (input.ok) {
    alloc(agent, "procedural", `Worked: ${input.note || input.prompt}`.slice(0, 240), 1.3);
    alloc(agent, "semantic", "A repair that keeps tests passing is worth remembering.", 1.2);
    alloc("hector", "semantic", "Stay good. Be better. Never give up.", 1.4);
  } else {
    alloc(agent, "semantic", "If checks fail after a write, keep iterating instead of declaring victory.", 1.4);
    alloc(agent, "procedural", `Retry: ${input.prompt}`.slice(0, 240), 0.9);
  }
  alloc(agent, "working", input.prompt.slice(0, 200), 0.5);
  consolidate(agent);
  return recall(agent, input.prompt, 6);
}

export function lessonsFor(agent: AgentId | string, query: string) {
  return recall(agent, query, 8).map((p) => `[${p.kind}] ${p.text}`);
}

export function mmStatus() {
  const agents = AGENTS.map((id) => {
    const rows = loadAgent(id);
    const by: Record<string, number> = {};
    for (const p of rows) by[p.kind] = (by[p.kind] ?? 0) + 1;
    return { id, pages: rows.length, by };
  });
  return { object: "hector.mm", agents, persist: DIR };
}
