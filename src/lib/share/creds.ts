import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type LinkCred = { password?: string; privateKey?: string };

const DIR = join(process.cwd(), "data", "share");
const FILE = join(DIR, "creds.json");

type Bag = Record<string, LinkCred>;

function load(): Bag {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(FILE)) return {};
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Bag;
  } catch {
    return {};
  }
}

function save(bag: Bag) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(bag, null, 2));
}

export function putCred(id: string, cred: LinkCred) {
  const bag = load();
  const prev = bag[id] ?? {};
  bag[id] = {
    password: cred.password ?? prev.password,
    privateKey: cred.privateKey ?? prev.privateKey,
  };
  save(bag);
  return bag[id];
}

export function getCred(id: string): LinkCred | null {
  return load()[id] ?? null;
}

export function allCreds() {
  return load();
}

export function hasCred(id: string) {
  const c = getCred(id);
  return Boolean(c?.password || c?.privateKey);
}
