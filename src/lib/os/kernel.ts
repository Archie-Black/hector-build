/**
 * Hector Transient OS.
 * Host Windows/Linux is firmware. Hector is init. Spectral HX is userland.
 * RAM-first. The vault is the only disk. Wipe forgets the session.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { busStatus } from "../devices/bus.ts";
import { drainJobs, listJobs } from "../devices/print.ts";
import { advertise } from "../devices/sdp.ts";

export type ServiceRole = "kernel" | "user";
export type OsPhase = "down" | "live" | "wiping";

export type Service = { id: string; name: string; role: ServiceRole; duty: string };

export const SERVICES: Service[] = [
  { id: "hector", name: "Hector", role: "kernel", duty: "init" },
  { id: "asimov", name: "Asimov", role: "kernel", duty: "laws" },
  { id: "pnp", name: "PnP", role: "kernel", duty: "devices" },
  { id: "spool", name: "Spooler", role: "kernel", duty: "jobs" },
  { id: "sdp", name: "SDP", role: "kernel", duty: "pairing" },
  { id: "hx", name: "Spectral HX", role: "user", duty: "coding" },
];

const DIR = join(process.cwd(), "data", "os");
const RAM = join(DIR, "ram");
const SESSION = join(DIR, "session.json");

export type Session = { id: string; at: number; phase: OsPhase; persist: boolean };

function readSession(): Session | null {
  if (!existsSync(SESSION)) return null;
  try {
    return JSON.parse(readFileSync(SESSION, "utf8")) as Session;
  } catch {
    return null;
  }
}

function writeSession(s: Session) {
  mkdirSync(DIR, { recursive: true });
  mkdirSync(RAM, { recursive: true });
  writeFileSync(SESSION, JSON.stringify(s));
}

export function ramPath(...parts: string[]) {
  mkdirSync(RAM, { recursive: true });
  return join(RAM, ...parts);
}

export function boot(now = Date.now()): Session {
  const live = readSession();
  if (live?.phase === "live") return live;
  mkdirSync(RAM, { recursive: true });
  drainJobs();
  const s: Session = { id: `hx-${now.toString(36)}`, at: now, phase: "live", persist: false };
  writeSession(s);
  writeFileSync(join(RAM, "motd"), `Hector Transient OS ${s.id}\nSpectral HX is userland.\n`);
  return s;
}

export function shutdown() {
  const s = readSession();
  if (!s) return { phase: "down" as const };
  if (!s.persist) wipeRam();
  writeSession({ ...s, phase: "down" });
  return { phase: "down" as const, id: s.id };
}

function wipeRam() {
  if (existsSync(RAM)) rmSync(RAM, { recursive: true, force: true });
  mkdirSync(RAM, { recursive: true });
}

export function wipe() {
  const s = readSession();
  wipeRam();
  for (const job of listJobs()) {
    const p = join(process.cwd(), "data", "devices", "spool", `${job.id}.job.json`);
    if (existsSync(p)) rmSync(p, { force: true });
  }
  writeSession({ id: s?.id ?? "wiped", at: Date.now(), phase: "down", persist: false });
  return { phase: "down" as const, wiped: true };
}

export function setPersist(on: boolean) {
  const s = boot();
  writeSession({ ...s, persist: on });
  return { persist: on };
}

export function osStatus() {
  const s = readSession() ?? { id: "none", at: 0, phase: "down" as const, persist: false };
  return {
    object: "hector.os",
    kind: "transient",
    session: s,
    services: SERVICES,
    devices: busStatus().started,
    jobs: listJobs().length,
    sdp: advertise().id,
    ram: RAM,
    note: "Host is firmware. Hector is the OS. Spectral HX is userland. Vault is the only disk.",
  };
}
