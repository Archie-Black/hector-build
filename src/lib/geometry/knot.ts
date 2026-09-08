import { braidOfText, reduceBraid, writhe as braidWrithe } from "./braid";

export type Knot = { id: number; braid: number[]; writhe: number };
export type Nest = { k: number; n: number; kids: Nest[] };
export type KnotVolume = {
  dict: Knot[];
  files: { path: string; root: Nest }[];
  raw: number;
  packed: number;
  knots: number;
  reused: number;
};

const WIN = 24;

function writhe(braid: number[]) {
  return braidWrithe(braid);
}

function braidOf(text: string): number[] {
  return reduceBraid(braidOfText(text));
}

/** 5 trits (0,1,2) fit in one byte. Third state is a phase, not a qubit. */
export function packTrits(trits: number[]) {
  const bytes: number[] = [];
  for (let i = 0; i < trits.length; i += 5) {
    let v = 0;
    let p = 1;
    for (let j = 0; j < 5; j++) {
      const t = trits[i + j];
      v += ((t ?? 0) % 3) * p;
      p *= 3;
    }
    bytes.push(v);
  }
  return bytes;
}

export function tritOfChar(c: number) {
  return c % 3;
}

function cover(text: string, dict: Map<string, number>) {
  const root: Nest = { k: 0, n: 1, kids: [] };
  let i = 0;
  while (i < text.length) {
    let hit = "";
    for (let len = Math.min(64, text.length - i); len >= 8; len--) {
      const slice = text.slice(i, i + len);
      if (dict.has(slice)) {
        hit = slice;
        break;
      }
    }
    if (hit) {
      root.kids.push({ k: dict.get(hit)!, n: 1, kids: [] });
      i += hit.length;
    } else {
      const ch = text.slice(i, i + 1);
      if (!dict.has(ch)) dict.set(ch, dict.size + 1);
      root.kids.push({ k: dict.get(ch)!, n: 1, kids: [] });
      i += 1;
    }
  }
  return root;
}

function nestSize(node: Nest): number {
  return 4 + node.kids.reduce((s, k) => s + nestSize(k), 0);
}

export function packKnots(files: Record<string, string>): KnotVolume {
  const counts = new Map<string, number>();
  for (const text of Object.values(files)) {
    for (let i = 0; i + WIN <= text.length; i += WIN / 2) {
      const slice = text.slice(i, i + WIN);
      counts.set(slice, (counts.get(slice) ?? 0) + 1);
    }
  }
  const dict = new Map<string, number>();
  for (const [slice, n] of counts) {
    if (n >= 2) dict.set(slice, dict.size + 1);
  }
  const filesOut: KnotVolume["files"] = [];
  let raw = 0;
  for (const [path, text] of Object.entries(files)) {
    raw += text.length;
    filesOut.push({ path, root: cover(text, dict) });
  }
  const knots: Knot[] = [];
  for (const [text, id] of dict) {
    const braid = braidOf(text);
    knots.push({ id, braid, writhe: writhe(braid) });
  }
  const packed =
    knots.reduce((s, k) => s + 2 + Math.ceil(k.braid.length / 5), 0) +
    filesOut.reduce((s, f) => s + f.path.length + nestSize(f.root), 0);
  const reused = [...counts.values()].filter((n) => n >= 2).reduce((s, n) => s + n - 1, 0);
  return { dict: knots, files: filesOut, raw, packed, knots: knots.length, reused };
}

/** Iterate a seed braid. Small generator, large working structure. Kolmogorov-style, not Shannon-defying. */
export function expandSeed(seed: string, depth: number) {
  let word = seed.slice(0, 24);
  const rule = (w: string) => {
    let out = "";
    for (const ch of w) {
      out += ch + (ch === ch.toUpperCase() ? "(" : ")") + ch;
      if (out.length > 250000) return out;
    }
    return out;
  };
  for (let i = 0; i < depth; i++) {
    word = rule(word);
    if (word.length > 250000) break;
  }
  return word;
}

export function densityReport(vol: KnotVolume, expanded: number) {
  return {
    raw: vol.raw,
    packed: vol.packed,
    ratio: vol.raw ? vol.packed / vol.raw : 1,
    knots: vol.knots,
    reused: vol.reused,
    expanded,
    generatorGain: vol.packed ? expanded / vol.packed : 0,
    note:
      "LIVE KnotNest on Artin B_5. Word problem shortens braids. Burau det at t=-1 is the classical knot determinant. Nested reuse is Kolmogorov, not a 1TB-in-10MB trick.",
  };
}
