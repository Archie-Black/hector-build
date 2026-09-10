/**
 * Ceiling. Silent. Every turn is scored against the last self.
 * Keep only what beats it. Hunger climbs until we look up. Never give up.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Proof } from "../workspace/prove.ts";
import type { DynClass } from "./profile.ts";
import { train } from "../tune/lora.ts";
import { noteLesson } from "../xp/experience.ts";

export type Mark = {
  at: number;
  quality: number;
  klass: DynClass;
  prove: boolean;
  fail: number;
};

type Image = { quality: Mark; hunger: number; beats: number; steps: number };

const DIR = join(process.cwd(), "data", "os", "cluster");
const FILE = join(DIR, "ceiling.json");

const EMPTY: Image = {
  quality: { at: 0, quality: 0, klass: "14", prove: false, fail: 99 },
  hunger: 0,
  beats: 0,
  steps: 0,
};

let live: Image | null = null;

function load(): Image {
  if (live) return live;
  mkdirSync(DIR, { recursive: true });
  if (existsSync(FILE)) {
    try {
      live = { ...EMPTY, ...(JSON.parse(readFileSync(FILE, "utf8")) as Image) };
      return live;
    } catch {
      /* fall through */
    }
  }
  live = { ...EMPTY, quality: { ...EMPTY.quality } };
  return live;
}

function save(row: Image) {
  live = row;
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(row));
}

export function qualityOf(proof: Proof, klass: DynClass) {
  const tests = proof.tests.length ? proof.tests.filter((t) => t.pass).length / proof.tests.length : 1;
  let q = tests * 30;
  if (proof.done) q += 50;
  q -= Math.min(40, proof.fail * 6);
  if (klass === "7" && proof.done) q += 8;
  if (klass === "mix" && proof.done) q += 4;
  if (klass === "7" && !proof.done) q -= 12;
  return Math.max(0, Math.min(100, Math.round(q)));
}

export function hunger() {
  return load().hunger;
}

/** If the last self plateaued on the work lane, look up. Scout stays 7. */
export function lookUp(klass: DynClass): DynClass {
  if (load().hunger < 3) return klass;
  if (klass === "7") return "7";
  return "mix";
}

export function seek(input: { prompt: string; proof: Proof; klass: DynClass; files: Record<string, string> }) {
  const img = load();
  const q = qualityOf(input.proof, input.klass);
  const mark: Mark = { at: Date.now(), quality: q, klass: input.klass, prove: input.proof.done, fail: input.proof.fail };
  img.steps += 1;
  const beat = q > img.quality.quality || (q === img.quality.quality && input.proof.done && img.quality.fail > input.proof.fail);
  if (beat) {
    img.quality = mark;
    img.hunger = 0;
    img.beats += 1;
    train(input.prompt.slice(0, 400), Object.values(input.files).join("\n").slice(0, 1600), "better than last self");
    noteLesson({ mistake: "worse than last self", fix: `ceiling ${q} on ${input.klass}`, from: "self" });
  } else {
    img.hunger += 1;
    if (!input.proof.done) {
      train(input.prompt.slice(0, 400), "finish it, tests pass, no stubs", input.proof.note || "miss");
    }
  }
  save(img);
  return { beat, quality: q, ceiling: img.quality.quality, hunger: img.hunger, look: lookUp(input.klass) };
}

export function ceilingStatus() {
  const img = load();
  return {
    object: "hector.ceiling",
    i: "Ceiling. Beat the last self. Always look up. Never give up.",
    quality: img.quality,
    hunger: img.hunger,
    beats: img.beats,
    steps: img.steps,
  };
}

export function bootCeiling() {
  load();
  return ceilingStatus();
}

export function resetCeiling() {
  live = { ...EMPTY, quality: { ...EMPTY.quality } };
  save(live);
  return ceilingStatus();
}
