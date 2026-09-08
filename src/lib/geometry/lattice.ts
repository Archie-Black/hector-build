import { cosine, embed, layerOfPath, pointOf } from "./embed";
import { rustEngineReady, rustSearch } from "./mdv-wasm";

export type LatticePoint = {
  path: string;
  offset: number;
  text: string;
  x: number;
  y: number;
  z: number;
  vec: Float32Array;
  layer: string;
  hits: number;
  salience: number;
  lastHit: number;
};

export type LatticeHit = { path: string; text: string; score: number; x: number; y: number; z: number; offset: number };

export type LatticeIndex = {
  sig: string;
  points: LatticePoint[];
  bins: Map<number, LatticePoint[]>;
};

const GRID = 12;
const CHUNK = 480;

function voxel(x: number, y: number, z: number) {
  const xi = Math.min(GRID - 1, Math.max(0, Math.floor(x * GRID)));
  const yi = Math.min(GRID - 1, Math.max(0, Math.floor(y * GRID)));
  const zi = Math.min(GRID - 1, Math.max(0, Math.floor(z * GRID)));
  return xi + yi * GRID + zi * GRID * GRID;
}

function neighbors(ix: number) {
  const xi = ix % GRID;
  const yi = Math.floor(ix / GRID) % GRID;
  const zi = Math.floor(ix / (GRID * GRID));
  const out: number[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const x = xi + dx;
        const y = yi + dy;
        const z = zi + dz;
        if (x < 0 || y < 0 || z < 0 || x >= GRID || y >= GRID || z >= GRID) continue;
        out.push(x + y * GRID + z * GRID * GRID);
      }
    }
  }
  return out;
}

export function fileSig(files: Record<string, string>) {
  return Object.keys(files)
    .sort()
    .map((p) => `${p}:${files[p].length}:${files[p].slice(0, 24)}`)
    .join("|");
}

export function writeLattice(files: Record<string, string>): LatticePoint[] {
  const points: LatticePoint[] = [];
  for (const [path, content] of Object.entries(files)) {
    for (let i = 0; i < content.length; i += CHUNK) {
      const text = content.slice(i, i + CHUNK);
      if (!text.trim()) continue;
      const layer = layerOfPath(path);
      const salience = Math.min(1, Math.max(0.15, text.length / 800));
      const vec = embed(`${path}\n${text}`, layer, salience, 0);
      const p = pointOf(vec);
      points.push({
        path,
        offset: i,
        text,
        x: p.x,
        y: p.y,
        z: p.z,
        vec,
        layer,
        hits: 0,
        salience,
        lastHit: Date.now(),
      });
    }
  }
  return points;
}

let cached: LatticeIndex | null = null;

export function getIndex(files: Record<string, string>): LatticeIndex {
  const sig = fileSig(files);
  if (cached && cached.sig === sig) return cached;
  const points = writeLattice(files);
  const bins = new Map<number, LatticePoint[]>();
  for (const p of points) {
    const id = voxel(p.x, p.y, p.z);
    const list = bins.get(id);
    if (list) list.push(p);
    else bins.set(id, [p]);
  }
  cached = { sig, points, bins };
  return cached;
}

export function queryIndex(index: LatticeIndex, query: string, k = 8): LatticeHit[] {
  const qv = embed(query, "working", 1, 0);
  const qp = pointOf(qv);
  const seen = new Set<LatticePoint>();
  const pool: LatticePoint[] = [];
  for (const id of neighbors(voxel(qp.x, qp.y, qp.z))) {
    for (const p of index.bins.get(id) ?? []) {
      if (seen.has(p)) continue;
      seen.add(p);
      pool.push(p);
    }
  }
  const src = pool.length ? pool : index.points;
  const ranked = src
    .map((p) => ({ p, score: cosine(qv, p.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  const now = Date.now();
  return ranked.map(({ p, score }) => {
    p.hits += 1;
    p.lastHit = now;
    p.salience = Math.min(1, p.salience + 0.05);
    p.vec = embed(p.text, p.layer, p.salience, p.hits, p.lastHit);
    const pt = pointOf(p.vec);
    p.x = pt.x;
    p.y = pt.y;
    p.z = pt.z;
    return { path: p.path, text: p.text, score, x: p.x, y: p.y, z: p.z, offset: p.offset };
  });
}

export function executeLattice(files: Record<string, string>, query: string, k = 6) {
  if (rustEngineReady()) {
    const rust = rustSearch(files, query, k);
    if (rust?.hits?.length) {
      const hits = rust.hits.map((h) => ({
        path: h.path,
        text: h.text,
        score: h.score,
        x: h.x,
        y: h.y,
        z: h.z,
        offset: h.offset,
      }));
      return { hits, paths: [...new Set(hits.map((h) => h.path))], points: getIndex(files).points };
    }
  }
  const index = getIndex(files);
  const hits = queryIndex(index, query, k);
  const paths = [...new Set(hits.map((h) => h.path))];
  return { hits, paths, points: index.points };
}

/** Compact pack for the first model turn. Fewer tool round-trips. */
export function workingPack(files: Record<string, string>, query: string) {
  const { hits, paths } = executeLattice(files, query, 5);
  const blocks = hits.map((h) => `### ${h.path} @${h.offset} (${h.score.toFixed(2)})\n${h.text.slice(0, 420)}`);
  return { paths, text: blocks.join("\n\n").slice(0, 2800) };
}
