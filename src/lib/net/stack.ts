/**
 * Hector netd. Network agents own the stack and report to Hector.
 * Unfettered on OUR stack (ifaces, sockets, tor, ssh). Not a scanner.
 */
import { createConnection } from "node:net";
import { networkInterfaces } from "node:os";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";

export type NetAgentId = "netd" | "link" | "sock" | "onion" | "collab" | "heal";

export type NetAgent = {
  id: NetAgentId;
  name: string;
  reports: "hector" | "netd";
  duty: string;
};

export const NET_AGENTS: NetAgent[] = [
  { id: "netd", name: "Netd", reports: "hector", duty: "stack" },
  { id: "link", name: "Link", reports: "netd", duty: "interfaces" },
  { id: "sock", name: "Sock", reports: "netd", duty: "sockets" },
  { id: "onion", name: "Onion", reports: "netd", duty: "circuits" },
  { id: "collab", name: "Collab", reports: "netd", duty: "ssh" },
  { id: "heal", name: "Heal", reports: "netd", duty: "resolve" },
];

export type LinkRow = {
  name: string;
  family: string;
  address: string;
  internal: boolean;
  up: boolean;
};

export type SockRow = {
  id: string;
  agent: NetAgentId;
  name: string;
  host: string;
  port: number;
  state: "up" | "down" | "healing";
  last: number;
  note: string;
};

export type NetReport = {
  at: number;
  from: NetAgentId;
  to: "hector" | "netd";
  ok: boolean;
  text: string;
};

const DIR = join(process.cwd(), "data", "os", "net");
const TABLE = join(DIR, "table.json");
const REPORTS = join(DIR, "reports.json");

const OWNED: Omit<SockRow, "state" | "last" | "note">[] = [
  { id: "http", agent: "sock", name: "hector-http", host: "127.0.0.1", port: Number(process.env.PORT || 8080) },
  { id: "socks", agent: "onion", name: "tor-socks", host: "127.0.0.1", port: Number(process.env.HECTOR_TOR_SOCKS || 19050) },
  { id: "ctrl", agent: "onion", name: "tor-control", host: "127.0.0.1", port: Number(process.env.HECTOR_TOR_CONTROL || 19051) },
  { id: "ssh", agent: "collab", name: "collab-ssh", host: "127.0.0.1", port: 2222 },
];

export function quietNet() {
  return process.env.HECTOR_NET === "0";
}

export function blockedAddr(addr: string) {
  const a = addr.trim().toLowerCase();
  return a.startsWith("169.254.") || a === "0.0.0.0" || a === "metadata.google.internal" || a.startsWith("ff02:");
}

export function links(): LinkRow[] {
  const n = networkInterfaces();
  const out: LinkRow[] = [];
  for (const [name, addrs] of Object.entries(n)) {
    for (const a of addrs ?? []) {
      out.push({
        name,
        family: String(a.family),
        address: a.address,
        internal: Boolean(a.internal),
        up: !blockedAddr(a.address),
      });
    }
  }
  return out;
}

export function probe(host: string, port: number, ms = 400): Promise<boolean> {
  if (blockedAddr(host)) return Promise.resolve(false);
  return new Promise((resolve) => {
    const sock = createConnection({ host, port });
    const t = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, ms);
    sock.once("connect", () => {
      clearTimeout(t);
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

const STACK_BIN = new Set(["ip", "ss", "ping", "hostname", "getent"]);

/** Raw stack. First argv is the binary. No pipes. */
export function netctl(argv: string[]): Promise<string> {
  const bin = argv[0];
  if (!bin || !STACK_BIN.has(bin)) return Promise.resolve("STUB: not a stack tool");
  if (argv.some((a) => /[;&|`$<>]/.test(a))) return Promise.resolve("STUB: refused");
  if (quietNet()) return Promise.resolve("STUB: net quiet");
  return new Promise((resolve) => {
    execFile(bin, argv.slice(1), { timeout: 2500 }, (err, stdout, stderr) => {
      if (err && !stdout && !stderr) {
        resolve("STUB: no binary");
        return;
      }
      resolve(`${stdout}${stderr}`.trim().slice(0, 4000) || (err ? "STUB: empty" : ""));
    });
  });
}

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

export function loadTable(): SockRow[] {
  bootDir();
  if (!existsSync(TABLE)) return [];
  try {
    return JSON.parse(readFileSync(TABLE, "utf8")) as SockRow[];
  } catch {
    return [];
  }
}

export function saveTable(rows: SockRow[]) {
  bootDir();
  writeFileSync(TABLE, JSON.stringify(rows));
}

export function loadReports(): NetReport[] {
  bootDir();
  if (!existsSync(REPORTS)) return [];
  try {
    return JSON.parse(readFileSync(REPORTS, "utf8")) as NetReport[];
  } catch {
    return [];
  }
}

export function report(row: Omit<NetReport, "at">) {
  const rows = loadReports();
  rows.push({ ...row, at: Date.now() });
  writeFileSync(REPORTS, JSON.stringify(rows.slice(-80)));
  return rows.at(-1)!;
}

export async function snapshot(): Promise<{ links: LinkRow[]; socks: SockRow[] }> {
  const now = Date.now();
  const socks: SockRow[] = [];
  for (const o of OWNED) {
    const up = quietNet() ? o.id === "http" : await probe(o.host, o.port);
    socks.push({
      ...o,
      state: up ? "up" : "down",
      last: now,
      note: up ? "live" : "down",
    });
  }
  saveTable(socks);
  return { links: links(), socks };
}

export function netStatus() {
  return {
    object: "hector.net",
    agents: NET_AGENTS,
    links: links().length,
    socks: loadTable(),
    reports: loadReports().slice(-6),
    note: "Netd reports to Hector. Heal auto-resolves. Stack tools: ip ss ping hostname getent.",
  };
}
