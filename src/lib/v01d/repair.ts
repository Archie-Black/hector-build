import { repairRank } from "./geom";

export type Health = "healthy" | "unhealthy" | "starting" | "none";
export type State = "running" | "exited" | "created" | "restarting" | "missing";
export type Action = "restart" | "recreate" | "up" | "skip";

export type Row = {
  name: string;
  service: string;
  state: State;
  health: Health;
  restarts: number;
};

export type Step = { service: string; action: Action; why: string };

const CORE = new Set(["traefik", "v01d", "timescale"]);

export function parseComposePs(raw: string): Row[] {
  const lines = raw
    .trim()
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("{"));
  const out: Row[] = [];
  for (const line of lines) {
    try {
      const j = JSON.parse(line) as Record<string, unknown>;
      const service = String(j.Service || j.Name || "").replace(/^osv01d-/, "").replace(/-1$/, "");
      const state = String(j.State || "missing").toLowerCase() as State;
      const health = (String(j.Health || "none").toLowerCase() || "none") as Health;
      out.push({
        name: String(j.Name || service),
        service: String(j.Service || service),
        state: ["running", "exited", "created", "restarting"].includes(state) ? state : "missing",
        health: ["healthy", "unhealthy", "starting"].includes(health) ? health : "none",
        restarts: Number(j.RestartCount ?? j.restarts ?? 0) || 0,
      });
    } catch {
      /* skip junk */
    }
  }
  return out;
}

export function planRepair(rows: Row[]): Step[] {
  if (rows.length === 0) return [{ service: "*", action: "up", why: "no containers are running" }];
  const steps: Step[] = [];
  for (const r of rows) {
    if (r.state === "running" && (r.health === "healthy" || r.health === "starting" || r.health === "none")) {
      continue;
    }
    const svc = r.service || r.name;
    const db = svc.includes("timescale");
    if (r.state === "missing") {
      steps.push({ service: svc, action: "up", why: `${svc} is not running` });
      continue;
    }
    if (r.state === "restarting") {
      steps.push({ service: svc, action: "skip", why: `${svc} is already restarting` });
      continue;
    }
    if (db && r.restarts >= 3) {
      steps.push({ service: svc, action: "restart", why: "database failed healthcheck; will not wipe its disk" });
      continue;
    }
    if (!db && r.restarts >= 2) {
      steps.push({ service: svc, action: "recreate", why: `${svc} still down after restart` });
      continue;
    }
    steps.push({
      service: svc,
      action: "restart",
      why: r.health === "unhealthy" ? `${svc} failed its healthcheck` : `${svc} process exited`,
    });
  }
  const have = new Set(rows.map((r) => r.service));
  for (const need of CORE) {
    if (!have.has(need) && !steps.some((s) => s.service === need || s.service === "*")) {
      steps.push({ service: need, action: "up", why: `${need} is missing` });
    }
  }
  const skip = steps.filter((s) => s.action === "skip");
  const work = steps.filter((s) => s.action !== "skip");
  work.sort((a, b) => repairRank(a.service, rows) - repairRank(b.service, rows));
  return work.concat(skip);
}

export function summarize(steps: Step[]) {
  if (steps.length === 0) return "All website services are up.";
  const bits = steps.filter((s) => s.action !== "skip").map((s) => `${s.action} ${s.service}`);
  if (bits.length === 0) return "Services are restarting on their own.";
  return `Repair: ${bits.join(", ")}.`;
}
