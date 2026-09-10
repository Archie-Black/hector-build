/**
 * Experiential memory. Three pillars. Silent. Survives reboot.
 * 1. Lessons — corrections become permanent knowledge.
 * 2. Execution — only what survived the compiler is remembered as working.
 * 3. DNA — the human's edits become how we write next time.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Proof } from "../workspace/prove.ts";
import { alloc } from "../os/mm.ts";

export type Lesson = {
  id: string;
  mistake: string;
  fix: string;
  where: string;
  from: "user" | "compiler" | "self";
  hits: number;
  at: number;
};

export type ExecRow = {
  at: number;
  prompt: string;
  done: boolean;
  fail: number;
  survived: string[];
  died: string[];
};

export type Dna = {
  indent: "tab" | "2" | "4";
  quotes: "single" | "double";
  semi: boolean;
  earlyReturn: number;
  asyncAwait: number;
  then: number;
  arrow: number;
  jsdoc: number;
  constLet: number;
};

type Image = {
  lessons: Lesson[];
  exec: ExecRow[];
  dna: Dna;
  lastAgent: Record<string, string>;
  lastJob: string;
};

const DIR = join(process.cwd(), "data", "os", "xp");
const FILE = join(DIR, "image.json");
const CAP_L = 80;
const CAP_E = 40;

const EMPTY_DNA: Dna = {
  indent: "2",
  quotes: "single",
  semi: true,
  earlyReturn: 0,
  asyncAwait: 0,
  then: 0,
  arrow: 0,
  jsdoc: 0,
  constLet: 0,
};

let live: Image | null = null;

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function load(): Image {
  if (live) return live;
  bootDir();
  if (existsSync(FILE)) {
    try {
      live = JSON.parse(readFileSync(FILE, "utf8")) as Image;
      live.dna = { ...EMPTY_DNA, ...live.dna };
      live.lessons ??= [];
      live.exec ??= [];
      live.lastAgent ??= {};
      return live;
    } catch {
      /* fall through */
    }
  }
  live = { lessons: [], exec: [], dna: { ...EMPTY_DNA }, lastAgent: {}, lastJob: "" };
  return live;
}

function save(img: Image) {
  live = img;
  bootDir();
  writeFileSync(FILE, JSON.stringify(img));
}

export function noteLesson(input: { mistake: string; fix: string; where?: string; from: Lesson["from"] }) {
  const img = load();
  const mistake = input.mistake.trim().slice(0, 180);
  const fix = input.fix.trim().slice(0, 180);
  if (!mistake || !fix) return null;
  const id = hash(`${mistake}:${fix}`).slice(0, 12);
  const hit = img.lessons.find((l) => l.id === id);
  if (hit) {
    hit.hits += 1;
    hit.at = Date.now();
    save(img);
    return hit;
  }
  const row: Lesson = { id, mistake, fix, where: input.where || "", from: input.from, hits: 1, at: Date.now() };
  img.lessons.push(row);
  img.lessons = img.lessons.sort((a, b) => b.hits - a.hits || b.at - a.at).slice(0, CAP_L);
  save(img);
  alloc("hx", "semantic", `Don't ${mistake}. Do ${fix}.`.slice(0, 240), 1.4);
  return row;
}

export function lessonsForJob(prompt: string) {
  const img = load();
  const q = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const scored = img.lessons.map((l) => {
    const blob = `${l.mistake} ${l.fix} ${l.where}`.toLowerCase();
    const n = q.reduce((s, w) => s + (blob.includes(w) ? 1 : 0), 0);
    return { l, s: n * 2 + l.hits };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 8).map((x) => `Don't ${x.l.mistake}. Do ${x.l.fix}.${x.l.where ? ` (${x.l.where})` : ""}`);
}

export function logExec(prompt: string, proof: Proof, files: Record<string, string>) {
  const img = load();
  const died = [
    ...proof.stubs.map((s) => s.path),
    ...proof.lints.map((l) => l.path),
    ...proof.tests.filter((t) => !t.pass).map((t) => t.name),
  ];
  const survived = Object.keys(files).filter((p) => !died.includes(p));
  img.exec.push({ at: Date.now(), prompt: prompt.slice(0, 180), done: proof.done, fail: proof.fail, survived: survived.slice(0, 24), died: [...new Set(died)].slice(0, 24) });
  img.exec = img.exec.slice(-CAP_E);
  img.lastJob = prompt.slice(0, 180);
  if (proof.done) {
    noteLesson({
      mistake: `shipping untested for ${prompt.slice(0, 48)}`,
      fix: "the version that passed checks",
      from: "compiler",
    });
  } else {
    for (const s of proof.stubs.slice(0, 4)) {
      noteLesson({ mistake: `left a stub in ${s.path}`, fix: "finish it before you speak", where: s.path, from: "self" });
    }
    for (const l of proof.lints.slice(0, 4)) {
      noteLesson({ mistake: l.message.slice(0, 120), fix: "the compiler rejected this", where: l.path, from: "compiler" });
    }
  }
  save(img);
  return img.exec[img.exec.length - 1];
}

export function markAgent(files: Record<string, string>) {
  const img = load();
  img.lastAgent = { ...files };
  save(img);
}

function count(re: RegExp, text: string) {
  return (text.match(re) || []).length;
}

function sampleStyle(text: string, dna: Dna) {
  const tabs = count(/^\t/gm, text);
  const two = count(/^ {2}\S/gm, text);
  const four = count(/^ {4}\S/gm, text);
  if (tabs > two && tabs > four) dna.indent = "tab";
  else if (four > two * 1.4) dna.indent = "4";
  else dna.indent = "2";
  const single = count(/'/g, text);
  const double = count(/"/g, text);
  dna.quotes = single >= double ? "single" : "double";
  dna.semi = count(/;$/gm, text) > 4;
  dna.earlyReturn += count(/if\s*\([^)]+\)\s*return/g, text);
  dna.asyncAwait += count(/\bawait\b/g, text);
  dna.then += count(/\.then\s*\(/g, text);
  dna.arrow += count(/=>/g, text);
  dna.jsdoc += count(/\/\*\*/g, text);
  dna.constLet += count(/\bconst\b/g, text) - count(/\blet\b/g, text);
}

/** Human changed our files. That is the lesson. That is the DNA. */
export function watchHuman(human: Record<string, string>) {
  const img = load();
  const agent = img.lastAgent;
  if (!Object.keys(agent).length) return [];
  const notes: Lesson[] = [];
  const paths = new Set([...Object.keys(agent), ...Object.keys(human)]);
  for (const path of paths) {
    const before = agent[path];
    const after = human[path];
    if (before === undefined || after === undefined || before === after) continue;
    if (!/\.(ts|tsx|js|jsx|py)$/.test(path)) continue;
    sampleStyle(after, img.dna);
    if (count(/if\s*\([^)]+\)\s*return/g, after) > count(/if\s*\([^)]+\)\s*return/g, before)) {
      const n = noteLesson({ mistake: "nested else", fix: "early return", where: path, from: "user" });
      if (n) notes.push(n);
    }
    if (count(/\bawait\b/g, after) > count(/\bawait\b/g, before) && count(/\.then\s*\(/g, after) < count(/\.then\s*\(/g, before)) {
      const n = noteLesson({ mistake: ".then()", fix: "async/await", where: path, from: "user" });
      if (n) notes.push(n);
    }
    if (count(/=>/g, after) > count(/function /g, after) && count(/function /g, before) > count(/=>/g, before)) {
      const n = noteLesson({ mistake: "function keyword", fix: "arrow functions", where: path, from: "user" });
      if (n) notes.push(n);
    }
  }
  save(img);
  return notes;
}

export function noteCorrection(prevJob: string, human: string) {
  if (!/(actually|instead|don't|dont|use |prefer |no,)/i.test(human)) return null;
  return noteLesson({
    mistake: prevJob.slice(0, 120) || "the last approach",
    fix: human.slice(0, 160),
    from: "user",
  });
}

export function dnaHints() {
  const d = load().dna;
  const bits = [
    d.indent === "tab" ? "tabs" : `${d.indent}-space indent`,
    `${d.quotes} quotes`,
    d.semi ? "semicolons" : "no semicolons",
    d.earlyReturn > d.then ? "early returns" : "",
    d.asyncAwait >= d.then ? "async/await, not .then()" : "",
    d.arrow > 2 ? "arrow functions" : "",
    d.constLet > 0 ? "const over let" : "",
    d.jsdoc > 2 ? "JSDoc" : "no noisy docs",
  ].filter(Boolean);
  return `Write like this person: ${bits.join(", ")}.`;
}

export function xpContext(prompt: string) {
  const learned = lessonsForJob(prompt);
  const dna = dnaHints();
  const last = load().exec.filter((e) => e.done).slice(-3);
  const lived = last.length ? `These already survived the compiler: ${last.flatMap((e) => e.survived).slice(0, 8).join(", ")}.` : "";
  return [dna, lived, ...learned].filter(Boolean).join("\n");
}

export function bootXp() {
  load();
  return xpStatus();
}

export function xpStatus() {
  const img = load();
  return {
    object: "hector.xp",
    lessons: img.lessons.length,
    exec: img.exec.length,
    dna: img.dna,
    note: "Experience. Corrections stick. Only survivors count. DNA is the human.",
  };
}
