import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  SHARE_DIR,
  SHARE_PROTOCOL,
  SHARE_README,
  detectFolderBots,
  fnv,
  kindOf,
  type FileHead,
  type Note,
  type Peer,
  type PeerKind,
  type Room,
  type ShareLink,
} from "./protocol.ts";

const DIR = join(process.cwd(), "data", "share");
const FILE = join(DIR, "room.json");

function empty(): Room {
  return {
    protocol: SHARE_PROTOCOL,
    id: "hector-room",
    peers: [{ id: "hector", name: "Hector Build", kind: "hector", seen: Date.now() }],
    leases: [],
    inbox: [],
    heads: [],
    links: [],
  };
}

function boot() {
  mkdirSync(DIR, { recursive: true });
}

export function loadRoom(): Room {
  boot();
  if (!existsSync(FILE)) {
    const room = empty();
    writeFileSync(FILE, JSON.stringify(room, null, 2));
    return room;
  }
  try {
    const room = JSON.parse(readFileSync(FILE, "utf8")) as Room;
    if (room.protocol !== SHARE_PROTOCOL) return empty();
    room.leases = (room.leases ?? []).filter((l) => l.until > Date.now());
    room.links = room.links ?? [];
    room.heads = room.heads ?? [];
    room.inbox = room.inbox ?? [];
    room.peers = room.peers ?? [];
    return room;
  } catch {
    return empty();
  }
}

function save(room: Room) {
  boot();
  writeFileSync(FILE, JSON.stringify(room, null, 2));
}

function cap<T>(list: T[], n = 80) {
  return list.length > n ? list.slice(list.length - n) : list;
}

export function joinPeer(input: { name: string; kind?: PeerKind; id?: string }) {
  const room = loadRoom();
  const id = (input.id || input.name).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "bot";
  const kind = input.kind || kindOf(input.name);
  const existing = room.peers.find((p) => p.id === id);
  if (existing) {
    existing.seen = Date.now();
    existing.name = input.name || existing.name;
    existing.kind = kind;
  } else {
    room.peers.push({ id, name: input.name || id, kind, seen: Date.now() });
  }
  save(room);
  return { peer: room.peers.find((p) => p.id === id)!, room };
}

export function noticeFolder(files: Record<string, string>) {
  const room = loadRoom();
  const found = detectFolderBots(files);
  for (const bot of found) {
    const hit = room.peers.find((p) => p.id === bot.id);
    if (hit) hit.seen = Date.now();
    else room.peers.push(bot);
  }
  if (!room.peers.some((p) => p.id === "hector")) {
    room.peers.unshift({ id: "hector", name: "Hector Build", kind: "hector", seen: Date.now() });
  }
  save(room);
  return room;
}

export function postNote(input: { from: string; to?: string; kind?: Note["kind"]; body: string }) {
  const room = loadRoom();
  const note: Note = {
    id: fnv(`${Date.now()}:${input.body}`).slice(0, 10),
    from: input.from || "generic",
    to: input.to || "hector",
    kind: input.kind === "result" || input.kind === "note" ? input.kind : "task",
    body: String(input.body || "").slice(0, 8000),
    at: Date.now(),
  };
  room.inbox = cap([...room.inbox, note]);
  const peer = room.peers.find((p) => p.id === note.from);
  if (peer) peer.seen = Date.now();
  save(room);
  return note;
}

export function ackNote(id: string, bot: string) {
  const room = loadRoom();
  const note = room.inbox.find((n) => n.id === id);
  if (!note) return null;
  note.ack = bot;
  save(room);
  return note;
}

export function leasePath(input: { bot: string; path: string; seconds?: number }) {
  const room = loadRoom();
  const path = input.path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.includes("..")) return { ok: false as const, reason: "bad path" };
  const now = Date.now();
  room.leases = room.leases.filter((l) => l.until > now);
  const held = room.leases.find((l) => l.path === path && l.bot !== input.bot);
  if (held) return { ok: false as const, reason: `leased by ${held.bot} until ${held.until}`, lease: held };
  const until = now + Math.min(Math.max(input.seconds ?? 90, 15), 600) * 1000;
  room.leases = room.leases.filter((l) => l.path !== path);
  const lease = { path, bot: input.bot, until };
  room.leases.push(lease);
  save(room);
  return { ok: true as const, lease };
}

export function syncFile(input: { bot: string; path: string; content: string; expect?: string }) {
  const path = input.path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.includes("..")) return { ok: false as const, reason: "bad path" };
  const room = loadRoom();
  const now = Date.now();
  room.leases = room.leases.filter((l) => l.until > now);
  const held = room.leases.find((l) => l.path === path && l.bot !== input.bot);
  if (held) return { ok: false as const, reason: `leased by ${held.bot}` };
  const prev = room.heads.find((h) => h.path === path);
  if (input.expect && prev && prev.hash !== input.expect) {
    return { ok: false as const, reason: "hash mismatch", head: prev };
  }
  const hash = fnv(input.content);
  const head: FileHead = { path, hash, bot: input.bot, at: now };
  room.heads = cap([...room.heads.filter((h) => h.path !== path), head], 400);
  mkdirSync(join(DIR, "files"), { recursive: true });
  writeFileSync(join(DIR, "files", fnv(path) + ".txt"), input.content);
  save(room);
  return { ok: true as const, head };
}

export function registerLink(input: Omit<ShareLink, "id" | "at"> & { id?: string }) {
  const room = loadRoom();
  const link: ShareLink = {
    id: input.id || fnv(`${input.from}:${input.host}:${input.kind}`).slice(0, 10),
    from: input.from,
    to: input.to || "*",
    kind: input.kind,
    host: input.host,
    port: input.port || 22,
    user: input.user,
    session: input.session,
    at: Date.now(),
  };
  room.links = room.links.filter((l) => l.id !== link.id);
  room.links.push(link);
  save(room);
  return link;
}

export function listLinks() {
  return loadRoom().links;
}

export function pullRoom() {
  return loadRoom();
}

/** Write the share folder into a bot-visible workspace tree. */
export function materializeShare(files: Record<string, string>): Record<string, string> {
  const room = noticeFolder(files);
  return {
    ...files,
    [`${SHARE_DIR}/README.md`]: SHARE_README,
    [`${SHARE_DIR}/peers.json`]: JSON.stringify(room.peers, null, 2),
    [`${SHARE_DIR}/leases.json`]: JSON.stringify(room.leases, null, 2),
    [`${SHARE_DIR}/inbox.jsonl`]: room.inbox.map((n) => JSON.stringify(n)).join("\n"),
    [`${SHARE_DIR}/heads.json`]: JSON.stringify(room.heads, null, 2),
    [`${SHARE_DIR}/links.json`]: JSON.stringify(room.links, null, 2),
  };
}

/** Read notes another bot dropped as jsonl. */
export function ingestInbox(files: Record<string, string>) {
  const raw = files[`${SHARE_DIR}/inbox.jsonl`];
  if (!raw) return [];
  const room = loadRoom();
  const seen = new Set(room.inbox.map((n) => `${n.from}:${n.body}`));
  const added: Note[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const n = JSON.parse(t) as Partial<Note>;
      if (!n.body) continue;
      const from = String(n.from || "generic");
      const body = String(n.body);
      if (seen.has(`${from}:${body}`)) continue;
      seen.add(`${from}:${body}`);
      added.push(postNote({ from, to: n.to ? String(n.to) : "hector", kind: n.kind as Note["kind"], body }));
    } catch {
      /* skip junk */
    }
  }
  return added;
}

export function shareStatus() {
  const room = loadRoom();
  return {
    protocol: SHARE_PROTOCOL,
    endpoint: "/api/v1/share",
    mcp: "/api/v1/mcp",
    peers: room.peers.map((p) => p.id),
    inbox: room.inbox.filter((n) => !n.ack).length,
    leases: room.leases.length,
    links: room.links.length,
    terms: true,
  };
}
