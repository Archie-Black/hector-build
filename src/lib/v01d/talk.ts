import { fromB64, toB64, unwrap, wrap } from "@/lib/ghstkrt/knot";

export type Op = "stat" | "open" | "read" | "write" | "mkdir" | "unlink" | "rename" | "list";

export type Dialect = string;

export type Word = {
  from: Dialect;
  to: Dialect;
  op: Op;
  say: (path: string) => string;
};

type Tongue = {
  id: Dialect;
  sep: "/" | "\\";
  fold: boolean;
};

const TONGUES: Record<string, Tongue> = {
  ntfs: { id: "ntfs", sep: "\\", fold: true },
  fat32: { id: "fat32", sep: "\\", fold: true },
  exfat: { id: "exfat", sep: "\\", fold: true },
  ext4: { id: "ext4", sep: "/", fold: false },
  apfs: { id: "apfs", sep: "/", fold: false },
  btrfs: { id: "btrfs", sep: "/", fold: false },
  zfs: { id: "zfs", sep: "/", fold: false },
  v01d: { id: "v01d", sep: "/", fold: true },
};

const OPS: Op[] = ["stat", "open", "read", "write", "mkdir", "unlink", "rename", "list"];

const LEX = new Map<string, Word>();
const KNOWN = new Set<Dialect>(["v01d"]);
const STORE = "v01d.tongue";

function key(from: Dialect, to: Dialect, op: Op) {
  return `${from}>${to}:${op}`;
}

function rewrite(path: string, from: Tongue, to: Tongue) {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (to.id === "ntfs" || to.id === "fat32" || to.id === "exfat") {
    if (parts[0] === "win" && parts[1]?.length === 1) {
      return `${parts[1].toUpperCase()}:${to.sep}${parts.slice(2).join(to.sep)}`;
    }
    return parts.join(to.sep);
  }
  if (from.sep === "\\" && parts[0]?.length === 2 && parts[0][1] === ":") {
    return `/win/${parts[0][0].toLowerCase()}/${parts.slice(1).join("/")}`;
  }
  return `/${parts.join("/")}`;
}

export function teach(a: Dialect, b: Dialect) {
  const A = TONGUES[a];
  const B = TONGUES[b];
  if (!A || !B) return;
  for (const op of OPS) {
    LEX.set(key(a, b, op), { from: a, to: b, op, say: (p) => rewrite(p, A, B) });
    LEX.set(key(b, a, op), { from: b, to: a, op, say: (p) => rewrite(p, B, A) });
  }
  KNOWN.add(a);
  KNOWN.add(b);
}

function persist() {
  try {
    const payload = JSON.stringify({ dialects: [...KNOWN], words: LEX.size });
    localStorage.setItem(STORE, toB64(wrap(payload)));
  } catch {
    /* no window */
  }
}

function recall() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return;
    unwrap(fromB64(raw));
  } catch {
    /* first boot */
  }
}

export function spread() {
  recall();
  const ids = Object.keys(TONGUES);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) teach(ids[i], ids[j]);
  }
  persist();
  return [...KNOWN];
}

export function invent(id: Dialect, sep: "/" | "\\", fold: boolean) {
  if (!TONGUES[id]) TONGUES[id] = { id, sep, fold };
  for (const other of Object.keys(TONGUES)) {
    if (other !== id) teach(id, other);
  }
  persist();
  return id;
}

export function say(path: string, from: Dialect, to: Dialect, op: Op = "open") {
  if (!LEX.size) spread();
  const w = LEX.get(key(from, to, op));
  if (!w) {
    teach(from, to);
    persist();
    return LEX.get(key(from, to, op))!.say(path);
  }
  return w.say(path);
}

export function dialectOf(path: string): Dialect {
  if (/^[a-zA-Z]:[\\/]/.test(path) || path.includes("\\")) return "ntfs";
  if (path.startsWith("/win/")) return "ntfs";
  if (path.startsWith("v01d://") || path.startsWith("/v01d/")) return "v01d";
  return "ext4";
}

export function taught() {
  return { dialects: [...KNOWN], words: LEX.size };
}

export function lesson(): Uint8Array {
  return wrap(JSON.stringify(taught()));
}
