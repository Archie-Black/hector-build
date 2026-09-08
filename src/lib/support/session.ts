import { scanEnvironment, type EnvScan } from "@/lib/hw/env-scan";

const KEY = "hector.support.session.v1";
export const SUPPORT_EMAIL = "Deltakingzero@doomchat.ca";

export type SupportStatus = "idle" | "requested" | "incoming" | "live" | "denied" | "wiped";

export type SupportSession = {
  id: string;
  token: string;
  email: string;
  ip: string;
  status: SupportStatus;
  scan: EnvScan | null;
  notes: string[];
  at: number;
};

function load(): SupportSession | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") as SupportSession | null;
  } catch {
    return null;
  }
}

function save(s: SupportSession | null) {
  if (typeof window === "undefined") return;
  if (!s) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(s));
}

export function currentSupport() {
  return load();
}

export function isOperator(email: string) {
  return email.trim().toLowerCase() === SUPPORT_EMAIL.toLowerCase();
}

async function publicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = (await res.json()) as { ip?: string };
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

export async function requestSupport(email: string) {
  const scan = await scanEnvironment();
  const session: SupportSession = {
    id: crypto.randomUUID().slice(0, 8),
    token: crypto.randomUUID().slice(0, 12),
    email,
    ip: await publicIp(),
    status: "requested",
    scan,
    notes: ["User asked for help. Waiting for operator, then user grant."],
    at: Date.now(),
  };
  save(session);
  return session;
}

export function operatorKnock() {
  const s = load();
  if (!s || s.status === "wiped") return null;
  s.status = "incoming";
  s.notes.push("Operator requested a connect. User must approve.");
  save(s);
  return s;
}

export function userGrant(ok: boolean) {
  const s = load();
  if (!s) return null;
  s.status = ok ? "live" : "denied";
  s.notes.push(ok ? "User granted device access." : "User denied.");
  save(s);
  return s;
}

export function addNote(text: string) {
  const s = load();
  if (!s) return null;
  s.notes.push(text);
  save(s);
  return s;
}

/** Wipe the support session. Vault, account, and project files stay. */
export function wipeSupport() {
  const s = load();
  if (s) {
    s.status = "wiped";
    s.notes = [];
    s.scan = null;
    s.ip = "";
    s.token = "";
  }
  save(null);
  if (typeof window === "undefined") return;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("hector.support.")) localStorage.removeItem(k);
  }
}
