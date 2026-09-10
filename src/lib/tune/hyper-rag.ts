/**
 * Hyper RAG. Nodes plus hyperedges (same path, same job, survived together).
 * Query is LoRA-adapted. Incidence boosts two-hop neighbors.
 */
import { contentEmbed, cosine } from "../geometry/embed.ts";
import { adapt } from "./lora.ts";
import { lessonsForJob } from "../xp/experience.ts";

export type RagHit = { id: string; kind: "chunk" | "lesson" | "exec"; path: string; text: string; score: number };

type Node = RagHit & { vec: Float32Array };
type Edge = { nodes: string[]; kind: string };

function chunkFiles(files: Record<string, string>): Node[] {
  const out: Node[] = [];
  for (const [path, text] of Object.entries(files)) {
    for (let off = 0; off < text.length; off += 360) {
      const slice = text.slice(off, off + 360);
      if (!slice.trim()) continue;
      const id = `${path}:${off}`;
      out.push({ id, kind: "chunk", path, text: slice, score: 0, vec: adapt(contentEmbed(slice)) });
    }
  }
  return out.slice(0, 240);
}

export function hyperRetrieve(query: string, files: Record<string, string>, cap = 8): RagHit[] {
  const q = adapt(contentEmbed(query));
  const nodes = chunkFiles(files);
  const lessons = lessonsForJob(query);
  for (const [i, line] of lessons.entries()) {
    nodes.push({
      id: `lesson:${i}`,
      kind: "lesson",
      path: "",
      text: line,
      score: 0,
      vec: adapt(contentEmbed(line)),
    });
  }
  const byPath = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.path) continue;
    const list = byPath.get(n.path) ?? [];
    list.push(n.id);
    byPath.set(n.path, list);
  }
  const edges: Edge[] = [...byPath.entries()].map(([path, ids]) => ({ nodes: ids, kind: path }));

  for (const n of nodes) n.score = cosine(q, n.vec);
  nodes.sort((a, b) => b.score - a.score);
  const top = new Set(nodes.slice(0, Math.min(12, nodes.length)).map((n) => n.id));
  for (const e of edges) {
    if (e.nodes.some((id) => top.has(id))) {
      for (const n of nodes) {
        if (e.nodes.includes(n.id)) n.score += 0.08;
      }
    }
  }
  nodes.sort((a, b) => b.score - a.score);
  return nodes.slice(0, cap).map(({ vec: _v, ...hit }) => hit);
}

export function ragContext(query: string, files: Record<string, string>) {
  return hyperRetrieve(query, files, 6)
    .map((h) => (h.path ? `${h.path}: ${h.text.slice(0, 160)}` : h.text))
    .join("\n");
}
