/**
 * Bluetooth SDP + bonding, without needing a radio.
 * Bots advertise services. Pair once. Then RFCOMM is just the share channel.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { issueGrant } from "../zt/zero.ts";

export type Service = { uuid: string; name: string; channel: string };
export type Bond = { id: string; name: string; services: Service[]; pairedAt: number };

const DIR = join(process.cwd(), "data", "devices");
const FILE = join(DIR, "bonds.json");

const HECTOR_SERVICES: Service[] = [
  { uuid: "hx.git", name: "Git volume", channel: "/dev/hector/git" },
  { uuid: "hx.tty", name: "Collab TTY", channel: "/dev/hector/tty" },
  { uuid: "hx.model", name: "Local model", channel: "/dev/hector/model" },
  { uuid: "hx.spool", name: "Job spooler", channel: "/dev/hector/spool" },
  { uuid: "hx.ssh", name: "SSH", channel: "/dev/hector/ssh" },
];

function load(): Bond[] {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Bond[];
  } catch {
    return [];
  }
}

function save(list: Bond[]) {
  writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function advertise() {
  return { id: "hector", name: "Hector Build", services: HECTOR_SERVICES };
}

export function pair(id: string, name: string, services: Service[] = HECTOR_SERVICES) {
  const list = load().filter((b) => b.id !== id);
  const bond: Bond = { id, name, services, pairedAt: Date.now() };
  list.push(bond);
  save(list);
  issueGrant({ principal: id, resource: "*", verb: "join", ttlMs: 24 * 3600 * 1000, by: "hector" });
  issueGrant({ principal: id, resource: "*", verb: "dial", ttlMs: 24 * 3600 * 1000, by: "hector" });
  return bond;
}

export function unpair(id: string) {
  const list = load();
  const next = list.filter((b) => b.id !== id);
  save(next);
  return list.length !== next.length;
}

export function bonds() {
  return load();
}

export function isPaired(id: string) {
  return load().some((b) => b.id === id);
}

export function sdpStatus() {
  return { object: "hector.sdp", self: advertise(), bonds: load() };
}
