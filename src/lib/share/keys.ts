import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ssh2 from "ssh2";
import type { ParsedKey } from "ssh2";

const { utils } = ssh2;

const DIR = join(process.cwd(), "data", "share", "keys");
const INDEX = join(DIR, "identities.json");
const AUTHORIZED = join(DIR, "authorized_keys");
const KNOWN = join(DIR, "known_hosts");
const HOST_PRIV = join(DIR, "host_ed25519");
const HOST_PUB = join(DIR, "host_ed25519.pub");

export type Identity = {
  user: string;
  comment: string;
  fingerprint: string;
  public: string;
  created: number;
  role: "current" | "previous" | "revoked";
  expires?: number;
  revoked?: number;
};

export const ROTATE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
export const ROTATE_OVERLAP_MS = 24 * 60 * 60 * 1000;
export const HARD_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const PURGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function boot() {
  mkdirSync(DIR, { recursive: true });
}

function loadIndex(): Identity[] {
  boot();
  if (!existsSync(INDEX)) return [];
  try {
    return JSON.parse(readFileSync(INDEX, "utf8")) as Identity[];
  } catch {
    return [];
  }
}

function saveIndex(list: Identity[]) {
  writeFileSync(INDEX, JSON.stringify(list, null, 2));
}

function writeMode(path: string, body: string, mode = 0o600) {
  const text = body.endsWith("\n") ? body : `${body}\n`;
  writeFileSync(path, text, { mode });
}

function asParsed(pub: string | Buffer | ParsedKey) {
  if (typeof pub === "object" && pub && "getPublicSSH" in pub) return pub;
  const parsed = utils.parseKey(pub);
  return parsed instanceof Error ? null : parsed;
}

export function fingerprintOf(pub: string | Buffer | ParsedKey) {
  const parsed = asParsed(pub);
  if (!parsed) return "";
  const hash = createHash("sha256").update(parsed.getPublicSSH()).digest("base64").replace(/=+$/, "");
  return `SHA256:${hash}`;
}

export function ensureHostKey() {
  boot();
  if (!existsSync(HOST_PRIV)) {
    const pair = utils.generateKeyPairSync("ed25519", { comment: "hector-host" });
    writeMode(HOST_PRIV, pair.private);
    writeMode(HOST_PUB, pair.public, 0o644);
  }
  const pub = readFileSync(HOST_PUB, "utf8").trim();
  const prev = existsSync(`${HOST_PRIV}.prev`) ? readFileSync(`${HOST_PRIV}.prev`) : null;
  return {
    private: readFileSync(HOST_PRIV),
    previous: prev,
    public: pub,
    fingerprint: fingerprintOf(pub),
  };
}

function identityPath(user: string, which: "current" | "previous" = "current") {
  const safe = user.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 40) || "hector";
  return join(DIR, which === "previous" ? `id_${safe}_ed25519.prev` : `id_${safe}_ed25519`);
}

function mintRow(user: string, comment: string): Identity {
  const pair = utils.generateKeyPairSync("ed25519", { comment });
  const privPath = identityPath(user);
  writeMode(privPath, pair.private);
  writeMode(`${privPath}.pub`, pair.public, 0o644);
  return {
    user,
    comment,
    fingerprint: fingerprintOf(pair.public),
    public: pair.public.trim(),
    created: Date.now(),
    role: "current",
  };
}

function writeAuthorized(list: Identity[]) {
  const lines = list.filter((i) => !i.revoked).map((i) => i.public.trim());
  writeMode(AUTHORIZED, lines.join("\n") + (lines.length ? "\n" : ""), 0o644);
}

export function generateIdentity(user: string, comment = `${user}@hector`) {
  boot();
  const row = mintRow(user, comment);
  const list = loadIndex().map((i) =>
    i.user === user && i.role !== "revoked" && !i.revoked ? { ...i, role: "revoked" as const, revoked: Date.now() } : i,
  );
  list.push(row);
  saveIndex(list);
  writeAuthorized(list);
  return row;
}

/** Keep the old key live for ROTATE_OVERLAP_MS, then settleRotations revokes it. */
export function rotateIdentity(user: string, now = Date.now()) {
  boot();
  settleRotations(now);
  const list = loadIndex();
  const current = list.find((i) => i.user === user && i.role === "current" && !i.revoked);
  const priv = identityPath(user);
  if (current && existsSync(priv)) {
    writeMode(identityPath(user, "previous"), readFileSync(priv, "utf8"));
    current.role = "previous";
    current.expires = now + ROTATE_OVERLAP_MS;
  }
  const next = mintRow(user, `${user}@hector-rot-${now}`);
  list.push(next);
  saveIndex(list);
  writeAuthorized(list);
  return { current: next, previous: current ?? null, overlapMs: ROTATE_OVERLAP_MS };
}

export function settleRotations(now = Date.now()) {
  const list = loadIndex();
  let hit = 0;
  for (const row of list) {
    if (row.role === "previous" && (row.expires ?? 0) <= now && !row.revoked) {
      row.role = "revoked";
      row.revoked = now;
      hit += 1;
    }
  }
  if (hit) {
    saveIndex(list);
    writeAuthorized(list);
  }
  return hit;
}

export function maybeRotate(user = "hector", now = Date.now()) {
  settleRotations(now);
  const current = loadIndex().find((i) => i.user === user && i.role === "current" && !i.revoked);
  if (!current) return generateIdentity(user);
  if (now - current.created >= ROTATE_AFTER_MS) return rotateIdentity(user, now).current;
  return current;
}

function purgeRevoked(now: number) {
  let n = 0;
  const list = loadIndex();
  for (const row of list) {
    if (!row.revoked || now - row.revoked < PURGE_AFTER_MS) continue;
    const hasPrev = list.some((i) => i.user === row.user && i.role === "previous" && !i.revoked);
    const prev = identityPath(row.user, "previous");
    if (!hasPrev && existsSync(prev)) {
      unlinkSync(prev);
      n += 1;
    }
  }
  if (existsSync(`${HOST_PRIV}.prev`)) {
    try {
      const rot = JSON.parse(readFileSync(join(DIR, "host-rotation.json"), "utf8")) as { expires?: number };
      if ((rot.expires ?? 0) <= now) {
        unlinkSync(`${HOST_PRIV}.prev`);
        if (existsSync(`${HOST_PUB}.prev`)) unlinkSync(`${HOST_PUB}.prev`);
        n += 1;
      }
    } catch {
      /* keep previous host key if the rotation file is missing */
    }
  }
  return n;
}

/** Daily job: rotate due keys, revoke expired overlap, purge dead private files. */
export function autoRevoke(now = Date.now()) {
  boot();
  let settled = settleRotations(now);
  const users = [...new Set(loadIndex().filter((i) => !i.revoked && i.role !== "revoked").map((i) => i.user))];
  if (!users.includes("hector")) users.push("hector");
  const rotated: string[] = [];
  for (const user of users) {
    const before = loadIndex().find((i) => i.user === user && i.role === "current" && !i.revoked);
    const after = maybeRotate(user, now);
    if (before && after.fingerprint !== before.fingerprint) rotated.push(user);
    const current = loadIndex().find((i) => i.user === user && i.role === "current" && !i.revoked);
    if (current && now - current.created >= HARD_MAX_AGE_MS) {
      rotateIdentity(user, now);
      if (!rotated.includes(user)) rotated.push(user);
    }
  }
  settled += settleRotations(now);
  const purged = purgeRevoked(now);
  return { settled, rotated, purged, at: now };
}

export function rotateHostKey(now = Date.now()) {
  boot();
  const host = ensureHostKey();
  const prevPriv = `${HOST_PRIV}.prev`;
  const prevPub = `${HOST_PUB}.prev`;
  writeMode(prevPriv, readFileSync(HOST_PRIV, "utf8"));
  if (existsSync(HOST_PUB)) writeMode(prevPub, readFileSync(HOST_PUB, "utf8"), 0o644);
  const pair = utils.generateKeyPairSync("ed25519", { comment: `hector-host-${now}` });
  writeMode(HOST_PRIV, pair.private);
  writeMode(HOST_PUB, pair.public, 0o644);
  writeMode(join(DIR, "host-rotation.json"), JSON.stringify({ at: now, previous: host.fingerprint, current: fingerprintOf(pair.public), expires: now + ROTATE_OVERLAP_MS }));
  return { current: fingerprintOf(pair.public), previous: host.fingerprint, overlapMs: ROTATE_OVERLAP_MS };
}

export function identityPrivate(user: string) {
  const p = identityPath(user);
  if (existsSync(p)) return readFileSync(p, "utf8");
  const prev = identityPath(user, "previous");
  return existsSync(prev) ? readFileSync(prev, "utf8") : "";
}

export function listIdentities() {
  return loadIndex().map((i) => ({
    user: i.user,
    comment: i.comment,
    fingerprint: i.fingerprint,
    public: i.public,
    created: i.created,
    role: i.role ?? (i.revoked ? "revoked" : "current"),
    expires: i.expires ?? null,
    revoked: i.revoked ?? null,
  }));
}

export function authorizeKey(openssh: string, user: string) {
  const parsed = asParsed(openssh);
  if (!parsed) return null;
  const row: Identity = {
    user,
    comment: parsed.comment || user,
    fingerprint: fingerprintOf(parsed),
    public: openssh.trim(),
    created: Date.now(),
    role: "current",
  };
  const list = loadIndex();
  if (!list.some((i) => i.fingerprint === row.fingerprint && !i.revoked)) list.push(row);
  saveIndex(list);
  writeAuthorized(list);
  return row.fingerprint;
}

export function revokeKey(fingerprint: string) {
  const list = loadIndex();
  let hit = false;
  for (const row of list) {
    if (row.fingerprint === fingerprint && !row.revoked) {
      row.revoked = Date.now();
      row.role = "revoked";
      hit = true;
    }
  }
  saveIndex(list);
  writeAuthorized(list);
  return hit;
}

export function isAuthorizedKey(key: ParsedKey | Buffer | string) {
  const parsed = asParsed(key);
  if (!parsed) return false;
  const fp = fingerprintOf(parsed);
  if (loadIndex().some((i) => i.fingerprint === fp && !i.revoked)) return true;
  if (!existsSync(AUTHORIZED)) return false;
  for (const line of readFileSync(AUTHORIZED, "utf8").split("\n")) {
    if (!line.startsWith("ssh-")) continue;
    const p = asParsed(line);
    if (p && (p.equals(parsed) || fingerprintOf(p) === fp)) return true;
  }
  return false;
}

export function rememberHost(host: string, pub: string) {
  boot();
  const existing = existsSync(KNOWN) ? readFileSync(KNOWN, "utf8") : "";
  if (!existing.includes(host)) writeMode(KNOWN, `${existing}${host} ${pub.trim()}\n`, 0o644);
}

export function keyStatus() {
  settleRotations();
  const host = ensureHostKey();
  const ids = listIdentities();
  const current = ids.filter((i) => i.role === "current");
  return {
    hostFingerprint: host.fingerprint,
    identities: current,
    previous: ids.filter((i) => i.role === "previous"),
    authorized: ids.filter((i) => i.role !== "revoked").length,
    rotateAfterMs: ROTATE_AFTER_MS,
    overlapMs: ROTATE_OVERLAP_MS,
  };
}

export function ensureDefaultIdentity() {
  ensureHostKey();
  const live = loadIndex().find((i) => i.user === "hector" && i.role === "current" && !i.revoked);
  return live ?? generateIdentity("hector", "hector@onion");
}
