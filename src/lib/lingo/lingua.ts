/**
 * Lingua. Silent agent.
 * Learns how the human talks. Renders every reply as a person.
 * Adapts, improves, updates itself. Knows who is speaking and what the job is.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stripJargon, type Register, type Syntax } from "./syntax.ts";

export type Voice = {
  contractions: number;
  sentenceLen: number;
  register: Register;
  firstPerson: number;
  favor: Record<string, number>;
};

export type Frame = {
  who: "hector" | "hx" | "human";
  job: string;
  lastHuman: string;
  lastSelf: string;
  mood: "chat" | "build" | "stuck" | "done";
  turn: number;
  hear?: Syntax;
};

type Image = {
  voice: Voice;
  turns: number;
  lastSelf: string;
  lastHuman: string;
  good: string[];
  stripped: number;
};

const DIR = join(process.cwd(), "data", "os", "lingo");
const FILE = join(DIR, "lingua.json");

const DEFAULT: Voice = { contractions: 0.7, sentenceLen: 12, register: "casual", firstPerson: 0.9, favor: {} };

let live: Image | null = null;

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

function load(): Image {
  if (live) return live;
  bootDir();
  if (existsSync(FILE)) {
    try {
      live = JSON.parse(readFileSync(FILE, "utf8")) as Image;
      return live;
    } catch {
      /* fall through */
    }
  }
  live = { voice: { ...DEFAULT, favor: {} }, turns: 0, lastSelf: "", lastHuman: "", good: [], stripped: 0 };
  return live;
}

function save(img: Image) {
  live = img;
  bootDir();
  writeFileSync(FILE, JSON.stringify(img));
}

function ema(prev: number, next: number, a = 0.25) {
  return prev * (1 - a) + next * a;
}

function contract(text: string, amount: number) {
  if (amount < 0.35) return text;
  return text
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bI will\b/g, "I'll")
    .replace(/\bI have\b/g, "I've")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bit is\b/gi, "it's")
    .replace(/\bwe are\b/gi, "we're")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bthat is\b/gi, "that's")
    .replace(/\byou are\b/gi, "you're")
    .replace(/\bwill not\b/gi, "won't");
}

function firstPerson(text: string) {
  return text
    .replace(/\bThe system (applied|wrote|built)\b/gi, "I $1")
    .replace(/\bHector API (applied|wrote)\b/gi, "I $1")
    .replace(/\bSpectral HX (finished|applied|wrote)\b/gi, "I $1")
    .replace(/\bThis agent\b/gi, "I")
    .replace(/\bThe local engine\b/gi, "I");
}

function shorten(text: string, target: number) {
  const parts = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const p of parts) {
    const words = p.split(/\s+/);
    if (words.length <= target + 8) out.push(p);
    else {
      const cut = words.slice(0, target + 4).join(" ");
      out.push(/[.!?]$/.test(cut) ? cut : `${cut}.`);
    }
  }
  return out.slice(0, 4).join(" ");
}

function moodOf(job: string, done?: boolean, fail?: number): Frame["mood"] {
  if (done) return "done";
  if ((fail ?? 0) > 0) return "stuck";
  if (/^(hi|hello|hey|thanks|thank you)\b/i.test(job.trim())) return "chat";
  return "build";
}

/** Hear the human. Shift voice toward them. */
export function learn(text: string) {
  if (!text.trim()) return load().voice;
  const img = load();
  const s = parse(text);
  const v = img.voice;
  v.contractions = ema(v.contractions, s.words ? s.contractions / Math.max(1, s.words / 8) : v.contractions);
  v.sentenceLen = ema(v.sentenceLen, Math.max(6, Math.min(18, s.words / Math.max(1, s.clauses.length))));
  v.register = s.register;
  v.firstPerson = ema(v.firstPerson, s.person === 1 ? 1 : 0.7);
  for (const w of s.tokens.filter((t) => /^[a-z]{4,}$/i.test(t)).slice(0, 12)) {
    const k = w.toLowerCase();
    v.favor[k] = (v.favor[k] ?? 0) + 1;
  }
  img.lastHuman = text.slice(0, 240);
  img.turns += 1;
  save(img);
  return v;
}

/** Rewrite a draft so it sounds like a person in this room. */
export function render(draft: string, frame?: Partial<Frame>) {
  const img = load();
  const job = frame?.job || img.lastHuman;
  const hear = parse(frame?.lastHuman || img.lastHuman || draft);
  let t = stripJargon(firstPerson(draft || ""));
  t = contract(t, img.voice.contractions);
  t = t.replace(/^\s*(HOLD\.?\s*)/i, "");
  t = shorten(t, Math.round(img.voice.sentenceLen));
  if (img.voice.register === "casual") t = t.replace(/\bshall\b/gi, "will").replace(/\bkindly\b/gi, "");
  if (img.lastSelf && t.toLowerCase() === img.lastSelf.toLowerCase() && frame?.mood !== "chat") {
    t = t.replace(/^On it\.?/i, "Still on it.");
  }
  const mood = frame?.mood || moodOf(job);
  if (mood === "chat" && !/\?/.test(t) && t.length < 8) t = "Hey. What do you want built?";
  t = t.replace(/\s+on the\.?$/i, ".").replace(/\s{2,}/g, " ").replace(/\s+\./g, ".").trim();
  if (!t) t = mood === "stuck" ? "Not done yet. I'll stay on it." : "On it.";
  if (draft !== t && /hector api|spectral hx|prove|swarm/i.test(draft)) img.stripped += 1;
  if (t.length < 180 && !/TODO|STUB/i.test(t)) {
    img.good = [...img.good.filter((g) => g !== t), t].slice(-12);
  }
  img.lastSelf = t;
  img.turns += 1;
  save(img);
  void hear;
  return t;
}

/** Merge good samples back into the default voice. Drop drift. */
export function improve() {
  const img = load();
  if (!img.good.length) return img.voice;
  const sample = img.good.slice(-6).join(" ");
  const s = parse(sample);
  img.voice.contractions = ema(img.voice.contractions, s.contractions ? 0.8 : 0.5, 0.4);
  img.voice.sentenceLen = ema(img.voice.sentenceLen, Math.max(8, Math.min(16, s.words / Math.max(1, s.clauses.length))), 0.4);
  img.voice.register = s.register === "formal" ? "neutral" : s.register;
  save(img);
  return img.voice;
}

export function aware() {
  const img = load();
  return {
    object: "hector.lingua",
    i: "Lingua. I speak for Hector. I learn how you talk. I do not talk like a log.",
    voice: img.voice,
    turns: img.turns,
    stripped: img.stripped,
    last: img.lastSelf.slice(0, 80),
  };
}

export function bootLingua() {
  load();
  improve();
  return aware();
}

export function linguaStatus() {
  return aware();
}

export { moodOf, parse };
