import { cosine, embed, pointOf } from "@/lib/geometry/embed";
import { rustEngineReady, rustSearch } from "@/lib/geometry/mdv-wasm";
import { completeTokens } from "@/lib/ide/symbols";

export type IndexChunk = {
  path: string;
  offset: number;
  text: string;
  morton: number;
  vec: Float32Array;
  imports: string[];
};

export type IndexSnapshot = {
  ready: boolean;
  files: number;
  chunks: number;
  edges: number;
  ms: number;
};

export type SilentAgent = "walker" | "embedder" | "grapher" | "retriever";

const CHUNK = 360;

function morton(x: number, y: number) {
  let z = 0;
  for (let i = 0; i < 12; i++) {
    z |= (x & (1 << i)) << i | (y & (1 << i)) << (i + 1);
  }
  return z >>> 0;
}

function importsOf(text: string) {
  const out: string[] = [];
  const re = /(?:from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1] || m[2] || m[3] || "");
  return out.filter(Boolean).slice(0, 12);
}

function walk(files: Record<string, string>): IndexChunk[] {
  const chunks: IndexChunk[] = [];
  const paths = Object.keys(files).sort();
  paths.forEach((path, i) => {
    const text = files[path] ?? "";
    for (let off = 0; off < text.length; off += CHUNK) {
      const slice = text.slice(off, off + CHUNK);
      if (!slice.trim()) continue;
      const vec = embed(slice);
      const p = pointOf(vec);
      chunks.push({
        path,
        offset: off,
        text: slice,
        morton: morton(Math.floor(p.x * 4095), Math.floor(p.y * 4095)),
        vec,
        imports: off === 0 ? importsOf(text) : [],
      });
    }
    void i;
  });
  return chunks;
}

let cache: { sig: string; chunks: IndexChunk[]; edges: number; files: Record<string, string> } | null = null;

function sigOf(files: Record<string, string>) {
  return `${Object.keys(files).length}:${Object.values(files).reduce((n, s) => n + s.length, 0)}`;
}

export function silentIndex(files: Record<string, string>): IndexSnapshot & { points: IndexChunk[] } {
  const t0 = performance.now();
  const sig = sigOf(files);
  if (!cache || cache.sig !== sig) {
    const chunks = walk(files);
    const edges = chunks.reduce((n, c) => n + c.imports.length, 0);
    cache = { sig, chunks, edges, files };
  }
  return {
    ready: true,
    files: Object.keys(files).length,
    chunks: cache.chunks.length,
    edges: cache.edges,
    ms: Math.round(performance.now() - t0),
    points: cache.chunks,
  };
}

export function retrieve(query: string, cap = 8): { path: string; offset: number; score: number; text: string }[] {
  if (!cache) return [];
  if (rustEngineReady()) {
    const rust = rustSearch(cache.files, query, cap);
    if (rust?.hits?.length) {
      return rust.hits.map((h) => ({ path: h.path, offset: h.offset, score: h.score, text: h.text.slice(0, 220) }));
    }
  }
  const q = embed(query);
  const p = pointOf(q);
  const qm = morton(Math.floor(p.x * 4095), Math.floor(p.y * 4095));
  return cache.chunks
    .map((c) => {
      const geo = 1 / (1 + Math.abs(c.morton - qm) / 1e6);
      const score = cosine(q, c.vec) * 0.72 + geo * 0.28;
      return { path: c.path, offset: c.offset, score, text: c.text.slice(0, 220) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, cap);
}

export function tabSuggest(path: string, prefix: string, files: Record<string, string>): string {
  const src = files[path] ?? "";
  const token = prefix.match(/[A-Za-z_$][\w$]*$/)?.[0] ?? prefix.trim();
  if (token.length < 2) return "";
  const names = completeTokens(path, token, files);
  if (names[0]) return names[0].slice(token.length);
  const lines = src.split("\n");
  const hit = lines.find((l) => l.includes(token) && l.trim() !== token);
  if (hit) {
    const i = hit.indexOf(token);
    return hit.slice(i + token.length, i + token.length + 80);
  }
  const geo = retrieve(token, 3)[0];
  if (!geo) return "";
  const line = geo.text.split("\n").find((l) => l.includes(token));
  if (!line) return geo.text.split("\n")[0]?.slice(0, 80) ?? "";
  const at = line.indexOf(token);
  return at >= 0 ? line.slice(at + token.length, at + token.length + 80) : line.slice(0, 80);
}

export const SILENT_TEAM: SilentAgent[] = ["walker", "embedder", "grapher", "retriever"];
