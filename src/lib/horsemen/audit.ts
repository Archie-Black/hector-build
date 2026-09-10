import { mkdirSync, appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { HorsemanId } from "./roster.ts";

export type AuditRow = {
  at: number;
  bot: HorsemanId;
  tool: string;
  decision: "allow" | "deny" | "ask";
  detail: string;
};

const FILE = join(process.cwd(), "data", "horsemen", "audit.jsonl");

function boot() {
  mkdirSync(join(process.cwd(), "data", "horsemen"), { recursive: true });
}

export function writeAudit(row: AuditRow) {
  if (typeof window !== "undefined") return;
  try {
    boot();
    appendFileSync(FILE, JSON.stringify(row) + "\n");
  } catch {
    /* local disk optional */
  }
}

export function readAudit(limit = 80): AuditRow[] {
  if (typeof window !== "undefined" || !existsSync(FILE)) return [];
  const lines = readFileSync(FILE, "utf8").trim().split("\n").filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l) as AuditRow);
}
