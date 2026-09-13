/** Two-tier memory. Working ring + episodic graph. Local only. */

import { cosine, embed } from "./embed";

export type Hit = { id: string; text: string; at: number; who: "user" | "alpha" | "beta" | "gamma" };
export type Node = { id: string; kind: string; text: string; w: number; vec: number[] };
export type Edge = { a: string; b: string; rel: string; w: number };

const T1: Hit[] = [];
const NODES = new Map<string, Node>();
const EDGES: Edge[] = [];
const T1_MAX = 100;

function nid(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `n${(h >>> 0).toString(16)}`;
}

export function remember(hit: Hit) {
  T1.push(hit);
  if (T1.length > T1_MAX) T1.shift();
}

export function working() {
  return T1.slice();
}

/** Consolidate one working hit into the graph. Gamma calls this. */
export function consolidate(hit: Hit) {
  const id = nid(hit.text.slice(0, 80));
  const cur = NODES.get(id);
  if (cur) {
    cur.w += 1;
    return cur;
  }
  const node: Node = { id, kind: hit.who, text: hit.text.slice(0, 240), w: 1, vec: embed(hit.text) };
  NODES.set(id, node);
  const last = [...NODES.values()].slice(-2, -1)[0];
  if (last && last.id !== id) EDGES.push({ a: last.id, b: id, rel: "next", w: 1 });
  return node;
}

export function recall(q: string, k = 5) {
  const v = embed(q);
  return [...NODES.values()]
    .map((n) => ({ n, s: cosine(v, n.vec) * Math.log2(1 + n.w) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => ({ id: x.n.id, text: x.n.text, score: x.s, w: x.n.w }));
}

export function prune(minW = 1) {
  for (const [id, n] of NODES) {
    if (n.w < minW && EDGES.filter((e) => e.a === id || e.b === id).length === 0) NODES.delete(id);
  }
  for (let i = EDGES.length - 1; i >= 0; i--) {
    if (!NODES.has(EDGES[i].a) || !NODES.has(EDGES[i].b)) EDGES.splice(i, 1);
  }
}

export function mergeDupes(thresh = 0.97) {
  const list = [...NODES.values()];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (!NODES.has(list[i].id) || !NODES.has(list[j].id)) continue;
      if (cosine(list[i].vec, list[j].vec) >= thresh) {
        list[i].w += list[j].w;
        for (const e of EDGES) {
          if (e.a === list[j].id) e.a = list[i].id;
          if (e.b === list[j].id) e.b = list[i].id;
        }
        NODES.delete(list[j].id);
      }
    }
  }
}

export function graphSize() {
  return { nodes: NODES.size, edges: EDGES.length, working: T1.length };
}

export function resetMemory() {
  T1.length = 0;
  NODES.clear();
  EDGES.length = 0;
}
