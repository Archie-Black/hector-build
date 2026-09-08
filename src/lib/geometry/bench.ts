import { executeLattice } from "./lattice";

export type BenchRow = {
  route: "linear" | "hash" | "geometry";
  ms: number;
  hits: number;
  sample: string;
};

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function linearSearch(files: Record<string, string>, query: string) {
  const q = query.toLowerCase();
  const hits: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    if (path.toLowerCase().includes(q) || text.toLowerCase().includes(q)) hits.push(path);
  }
  return hits;
}

function hashSearch(files: Record<string, string>, query: string) {
  const map = new Map(Object.entries(files));
  return map.has(query) || map.has(query.replace(/\\/g, "/")) ? 1 : [...map.keys()].filter((p) => p.endsWith(query)).length;
}

export function benchRoutes(files: Record<string, string>, query: string): BenchRow[] {
  const t0 = now();
  const lin = linearSearch(files, query);
  const t1 = now();
  const hashHits = hashSearch(files, query);
  const t2 = now();
  const geo = executeLattice(files, query, 8);
  const t3 = now();
  return [
    { route: "linear", ms: t1 - t0, hits: lin.length, sample: lin[0] ?? "" },
    { route: "hash", ms: t2 - t1, hits: hashHits, sample: "exact path only" },
    { route: "geometry", ms: t3 - t2, hits: geo.hits.length, sample: geo.hits[0]?.path ?? "" },
  ];
}

export function pickWinner(rows: BenchRow[]) {
  const geo = rows.find((r) => r.route === "geometry");
  const lin = rows.find((r) => r.route === "linear");
  if (!geo || !lin) return "none";
  if (geo.hits > lin.hits && queryUseful(geo)) return "geometry";
  if (lin.hits > 0 && geo.hits === 0) return "linear";
  if (geo.hits > 0 && lin.hits === 0) return "geometry";
  return geo.ms <= lin.ms ? "geometry" : "linear";
}

function queryUseful(row: BenchRow) {
  return row.hits > 0;
}
