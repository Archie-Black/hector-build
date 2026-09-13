/** Massive swarms. Many thoughts, few bodies. One ghost, jersey = logical count. */

import { sense } from "./soma";
import { pub } from "./broker";
import { pick } from "./swarm";

export const FACE = 20;
export const MAX_LOGICAL = 4096;

export type Cell = { id: number; face: number; do: string; slot: number };
export type Hive = {
  logical: number;
  physical: number;
  faces: number;
  lead: "alpha" | "beta";
  cells: Cell[];
  jersey: number;
};

export function cap() {
  const s = sense();
  return s.precision === "int4" ? 32 : 64;
}

export function want(text: string) {
  const n = text.match(/(\d{1,5})\s*(agents?|ghosts?|workers?|bots?)/i);
  if (n) return Math.max(1, parseInt(n[1], 10));
  if (/\b(swarm|army|horde|fleet|massive|raise (a )?team)\b/i.test(text)) return FACE * 12;
  return 0;
}

function shards(text: string, n: number) {
  const bits = text
    .split(/[.;\n]| and then | then /i)
    .map((x) => x.trim())
    .filter((x) => x.length > 2);
  const src = bits.length ? bits : [text.trim() || "work"];
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(src[i % src.length]!);
  return out;
}

export function raise(text: string, asked = want(text)): Hive {
  const logical = Math.max(1, Math.min(MAX_LOGICAL, asked || 1));
  const physical = Math.min(logical, cap());
  const faces = Math.max(1, Math.ceil(logical / FACE));
  const work = shards(text, logical);
  const cells: Cell[] = work.map((do_, i) => ({
    id: i,
    face: Math.floor(i / FACE),
    do: do_,
    slot: i % physical,
  }));
  const hive: Hive = {
    logical,
    physical,
    faces,
    lead: pick(text) === "beta" ? "beta" : "alpha",
    cells,
    jersey: logical,
  };
  pub("hive", "alpha", `${logical}:${physical}`);
  return hive;
}

export function wantsHive(text: string) {
  return want(text) > 0;
}

export function sayHive(h: Hive) {
  if (h.logical === h.physical) return `Raising ${h.logical}. They work together.`;
  return `Raising ${h.logical}. ${h.physical} work at once. One ghost, jersey ${h.jersey}.`;
}
