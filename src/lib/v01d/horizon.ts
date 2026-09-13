/** VFS on the holographic screen. Small cells. Index on the area. Bulk is the file. */

import { bitsOf, fits, maxBits, radiusFor } from "@/lib/hx/density";
import { split, xor } from "@/lib/hx/weights-repair";
import { forBytes } from "@/lib/hector/vfs-learn";

export type Cell = {
  hash: string;
  r: number;
  bits: number;
  data?: Uint8Array;
  kids?: string[];
  par?: string;
};

export type Tree = { root: string; store: Map<string, Cell>; bytes: number; pages: number; grain: number; gen: number; fan: number };

function digest(buf: Uint8Array) {
  let a = 2166136261;
  let b = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    a = Math.imul(a ^ buf[i]!, 16777619) >>> 0;
    b = Math.imul(b + buf[i]! + i, 2246822519) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/** Smallest radius that can hold this page. Density is 1/r. */
export function grain(bytes: number) {
  const bits = Math.max(8, bitsOf(bytes));
  const r = radiusFor(bits);
  return { r, bits, ok: fits(bytes, r) };
}

export function sky(hash: string) {
  const n = Number.parseInt(hash.slice(0, 8), 16) || 0;
  const m = Number.parseInt(hash.slice(8, 16), 16) || 0;
  return { th: ((n >>> 0) / 0xffffffff) * Math.PI, ph: ((m >>> 0) / 0xffffffff) * Math.PI * 2 };
}

function leaf(data: Uint8Array): Cell {
  const g = grain(data.length);
  return { hash: digest(data), r: g.r, bits: g.bits, data };
}

function join(kids: Cell[]): Cell {
  const hashes = kids.map((k) => k.hash);
  const par = xor(kids.map((k) => k.data || new Uint8Array(0)));
  const body = new TextEncoder().encode(hashes.join("."));
  const g = grain(body.length + par.length);
  return { hash: digest(body), r: g.r, bits: g.bits, kids: hashes, par: digest(par) };
}

export function pack(buf: Uint8Array): Tree {
  const r = forBytes(buf.length);
  const pages = split(buf, r.cell).map(leaf);
  const store = new Map<string, Cell>();
  for (const c of pages) store.set(c.hash, c);
  let layer = pages;
  while (layer.length > 1) {
    const next: Cell[] = [];
    for (let i = 0; i < layer.length; i += r.fan) {
      const group = layer.slice(i, i + r.fan);
      const p = join(group);
      store.set(p.hash, p);
      next.push(p);
    }
    layer = next;
  }
  const root = layer[0]?.hash || digest(buf);
  if (!store.has(root) && pages[0]) store.set(root, pages[0]);
  return { root, store, bytes: buf.length, pages: pages.length || 1, grain: r.cell, gen: r.gen, fan: r.fan };
}

export function unpack(t: Tree): Uint8Array {
  const out: Uint8Array[] = [];
  function walk(h: string) {
    const c = t.store.get(h);
    if (!c) return;
    if (c.data) out.push(c.data);
    for (const k of c.kids || []) walk(k);
  }
  walk(t.root);
  const n = out.reduce((s, p) => s + p.length, 0);
  const buf = new Uint8Array(n);
  let o = 0;
  for (const p of out) {
    buf.set(p, o);
    o += p.length;
  }
  return buf;
}

export function boundFill(t: Tree) {
  let cap = 0;
  for (const c of t.store.values()) if (c.data) cap += maxBits(c.r);
  return t.bytes * 8 / Math.max(1, cap);
}

export function pageFill(t: Tree) {
  return t.bytes / Math.max(1, t.pages * t.grain);
}

export function wantsHorizon(text: string) {
  return /\b(horizon (pack|file)|pack (the )?files|holographic (file|vfs|disk)|bousso file)\b/i.test(text);
}

export function sayHorizon() {
  return "Files sit on the horizon. The packer runs two generations ahead. Ceiling is a perfect unpack and fill 1. Spectral HX keeps the protocol.";
}
