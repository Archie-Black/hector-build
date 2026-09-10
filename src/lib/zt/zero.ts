/**
 * Zero Trust. Never trust. Always verify. Deny by default.
 * Location is not trust. LAN is not trust. Loopback on this device is self.
 * Short grants. Continuous expiry. War enforces. Netd enforces. Hector decides.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isLoopbackHost, isPrivateLan } from "../ollama/home.ts";
import { isOnionHost } from "../share/wire.ts";
import { blockedAddr } from "../net/stack.ts";
import { writeAudit } from "../horsemen/audit.ts";
import type { HorsemanId } from "../horsemen/roster.ts";

export type PrincipalKind = "kernel" | "bot" | "human" | "anon";
export type Verb = "read" | "write" | "dial" | "listen" | "exec" | "join";

export type Principal = { id: string; kind: PrincipalKind };

export type Grant = {
  id: string;
  principal: string;
  resource: string;
  verb: Verb;
  until: number;
  by: string;
};

export type ZtDecision = { allow: boolean; reason: string };

const DIR = join(process.cwd(), "data", "os", "zt");
const FILE = join(DIR, "grants.json");
const TTL = 15 * 60 * 1000;

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

export function loadGrants(): Grant[] {
  bootDir();
  if (!existsSync(FILE)) return [];
  try {
    return (JSON.parse(readFileSync(FILE, "utf8")) as Grant[]).filter((g) => g.until > Date.now());
  } catch {
    return [];
  }
}

function saveGrants(rows: Grant[]) {
  bootDir();
  writeFileSync(FILE, JSON.stringify(rows.filter((g) => g.until > Date.now())));
}

export function issueGrant(input: { principal: string; resource: string; verb: Verb; ttlMs?: number; by?: string }) {
  const rows = loadGrants();
  const g: Grant = {
    id: `zt-${Date.now().toString(36)}`,
    principal: input.principal,
    resource: input.resource,
    verb: input.verb,
    until: Date.now() + (input.ttlMs ?? TTL),
    by: input.by || "hector",
  };
  rows.push(g);
  saveGrants(rows);
  return g;
}

export function revokeGrant(id: string) {
  const rows = loadGrants().filter((g) => g.id !== id);
  saveGrants(rows);
  return true;
}

export function hasGrant(principal: string, resource: string, verb: Verb) {
  const now = Date.now();
  return loadGrants().some((g) => {
    if (g.until <= now || g.principal !== principal || g.verb !== verb) return false;
    if (g.resource === "*" || g.resource === resource) return true;
    if (g.resource.endsWith("*") && resource.startsWith(g.resource.slice(0, -1))) return true;
    return false;
  });
}

function ours(host: string) {
  const h = host.toLowerCase();
  return h === "doomchat.ca" || h.endsWith(".doomchat.ca");
}

export function decide(input: { who: Principal; verb: Verb; resource: string; loc?: string }): ZtDecision {
  const who = input.who;
  const loc = (input.loc || "").trim().toLowerCase();

  if (who.kind === "anon") return deny(who, input, "no identity");
  if (loc && blockedAddr(loc)) return deny(who, input, "blocked address");
  if (input.resource.includes("..")) return deny(who, input, "path escape");

  if (who.kind === "kernel" && input.verb === "exec" && input.resource === "stack") return allow(who, input, "self stack");
  if (who.kind === "kernel" && (input.verb === "listen" || input.verb === "dial") && (!loc || isLoopbackHost(loc))) {
    return allow(who, input, "self");
  }
  if (who.kind === "human") return allow(who, input, "human session");

  if (hasGrant(who.id, input.resource, input.verb) || (loc && hasGrant(who.id, loc, input.verb))) {
    return allow(who, input, "grant");
  }

  if (input.verb === "dial" && loc) {
    if (isLoopbackHost(loc)) return allow(who, input, "self loopback");
    if (isOnionHost(loc)) return allow(who, input, "onion identity");
    if (ours(loc)) return allow(who, input, "our zone");
    if (isPrivateLan(loc)) return deny(who, input, "lan is not trust");
    return deny(who, input, "untrusted host");
  }

  if (input.verb === "exec") return deny(who, input, "no exec grant");
  if (input.verb === "join") return deny(who, input, "not bonded");
  return deny(who, input, "default deny");
}

function allow(who: Principal, input: { verb: Verb; resource: string }, reason: string): ZtDecision {
  writeAudit({ at: Date.now(), bot: who.id as HorsemanId, tool: `zt.${input.verb}`, decision: "allow", detail: `${input.resource} ${reason}`.slice(0, 80) });
  return { allow: true, reason };
}

function deny(who: Principal, input: { verb: Verb; resource: string }, reason: string): ZtDecision {
  writeAudit({ at: Date.now(), bot: who.id as HorsemanId, tool: `zt.${input.verb}`, decision: "deny", detail: `${input.resource} ${reason}`.slice(0, 80) });
  return { allow: false, reason };
}

export function bootZt() {
  issueGrant({ principal: "netd", resource: "stack", verb: "exec", ttlMs: 24 * 3600 * 1000, by: "hector" });
  issueGrant({ principal: "heal", resource: "stack", verb: "exec", ttlMs: 24 * 3600 * 1000, by: "hector" });
  issueGrant({ principal: "hector", resource: "*", verb: "listen", ttlMs: 24 * 3600 * 1000, by: "hector" });
  return { object: "hector.zt", grants: loadGrants().length, note: "never trust. always verify." };
}

export function ztStatus() {
  return { object: "hector.zt", grants: loadGrants(), note: "Zero Trust. LAN is not trust. Grants expire." };
}
