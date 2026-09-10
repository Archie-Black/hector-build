/** Time-lapse visual memory. Compressed structural embeddings of the bench. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { noteLesson } from "../xp/experience.ts";
import { alloc } from "../os/mm.ts";
import type { Gray } from "./stereo.ts";

export type Snap = { at: number; hash: string; led: string; bright: number; note: string };

const DIR = join(process.cwd(), "data", "os", "vision");
const FILE = join(DIR, "lapse.json");
const CAP = 120;

let snaps: Snap[] | null = null;

function load(): Snap[] {
  if (snaps) return snaps;
  mkdirSync(DIR, { recursive: true });
  if (existsSync(FILE)) {
    try {
      snaps = JSON.parse(readFileSync(FILE, "utf8")) as Snap[];
      return snaps;
    } catch {
      /* fall */
    }
  }
  snaps = [];
  return snaps;
}

function save(rows: Snap[]) {
  snaps = rows.slice(-CAP);
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(snaps));
}

function hashGray(g: Gray) {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(g.px.length / 256));
  for (let i = 0; i < g.px.length; i += step) h = Math.imul(h ^ g.px[i]!, 16777619);
  return (h >>> 0).toString(36);
}

export function rememberView(g: Gray, note: string, led = "") {
  const rows = load();
  const row: Snap = { at: Date.now(), hash: hashGray(g), led, bright: g.px.reduce((n, v) => n + (v > 180 ? 1 : 0), 0), note: note.slice(0, 180) };
  const prev = rows[rows.length - 1];
  rows.push(row);
  save(rows);
  if (prev && prev.hash !== row.hash) {
    noteLesson({ mistake: `visual ${prev.note || prev.hash}`, fix: row.note || "scene changed", from: "self", where: "vision" });
    alloc("hector", "episodic", row.note, 1.1);
  }
  return row;
}

export function lapse() {
  return load();
}

export function drift() {
  const rows = load();
  if (rows.length < 2) return { changed: false, n: rows.length };
  const a = rows[0]!;
  const b = rows[rows.length - 1]!;
  return { changed: a.hash !== b.hash, n: rows.length, from: a, to: b, hours: (b.at - a.at) / 3_600_000 };
}
