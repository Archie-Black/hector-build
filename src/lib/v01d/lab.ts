import { VFS_GRANT } from "./grant";
import { invent, spread, type Dialect } from "./talk";

const NEXT: { id: Dialect; sep: "/" | "\\"; fold: boolean }[] = [
  { id: "f2fs", sep: "/", fold: false },
  { id: "xfs", sep: "/", fold: false },
  { id: "overlay", sep: "/", fold: false },
  { id: "virtiofs", sep: "/", fold: false },
  { id: "9p", sep: "/", fold: false },
];

const CATALOG = new Map<number, string>();

export function pin(path: string) {
  let h = 2166136261;
  for (let i = 0; i < path.length; i++) h = Math.imul(h ^ path.charCodeAt(i), 16777619);
  const id = h >>> 0;
  CATALOG.set(id, path);
  return id;
}

export function find(id: number) {
  return CATALOG.get(id);
}

/** Research and build. Permission already given. Users still see native names. */
export function evolve() {
  spread();
  for (const n of NEXT) invent(n.id, n.sep, n.fold);
  return { built: NEXT.map((n) => n.id), index: CATALOG.size, grant: VFS_GRANT.limit };
}
