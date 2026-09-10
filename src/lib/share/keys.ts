import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  revoked?: number;
};

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
  return { private: readFileSync(HOST_PRIV), public: pub, fingerprint: fingerprintOf(pub) };
}

function identityPath(user: string) {
  const safe = user.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 40) || "hector";
  return join(DIR, `id_${safe}_ed25519`);
}

function writeAuthorized(list: Identity[]) {
  const lines = list.filter((i) => !i.revoked).map((i) => i.public.trim());
  writeMode(AUTHORIZED, lines.join("\n") + (lines.length ? "\n" : ""), 0o644);
}

export function generateIdentity(user: string, comment = `${user}@hector`) {
  boot();
  const pair = utils.generateKeyPairSync("ed25519", { comment });
  const privPath = identityPath(user);
  writeMode(privPath, pair.private);
  writeMode(`${privPath}.pub`, pair.public, 0o644);
  const row: Identity = {
    user,
    comment,
    fingerprint: fingerprintOf(pair.public),
    public: pair.public.trim(),
    created: Date.now(),
  };
  const list = loadIndex().map((i) => (i.user === user && !i.revoked ? { ...i, revoked: Date.now() } : i));
  list.push(row);
  saveIndex(list);
  writeAuthorized(list);
  return row;
}

export function identityPrivate(user: string) {
  const p = identityPath(user);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

export function listIdentities() {
  return loadIndex().map((i) => ({
    user: i.user,
    comment: i.comment,
    fingerprint: i.fingerprint,
    public: i.public,
    created: i.created,
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
  const host = ensureHostKey();
  const ids = listIdentities();
  return {
    hostFingerprint: host.fingerprint,
    identities: ids.filter((i) => !i.revoked),
    authorized: ids.filter((i) => !i.revoked).length,
  };
}

export function ensureDefaultIdentity() {
  ensureHostKey();
  const live = loadIndex().find((i) => i.user === "hector" && !i.revoked);
  return live ?? generateIdentity("hector", "hector@onion");
}
