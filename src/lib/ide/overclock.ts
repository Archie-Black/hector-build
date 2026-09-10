/**
 * Overclocked persistent debug. DAP that does not forget.
 * Failed checks become breakpoints. Heal runs hotter while the session is live.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspaceLaunch, type DapSession } from "./dap.ts";
import type { Proof } from "../workspace/prove.ts";

const DIR = join(process.cwd(), "data", "os", "debug");
const FILE = join(DIR, "session.json");

let live: DapSession | null = null;

function bootDir() {
  mkdirSync(DIR, { recursive: true });
}

export function persistDap(session: DapSession) {
  live = session;
  bootDir();
  writeFileSync(FILE, JSON.stringify(session));
  return session;
}

export function loadDap(): DapSession | null {
  if (live) return live;
  if (!existsSync(FILE)) return null;
  try {
    live = JSON.parse(readFileSync(FILE, "utf8")) as DapSession;
    return live;
  } catch {
    return null;
  }
}

function breaksFromProof(files: Record<string, string>, proof: Proof) {
  const bp: Record<string, number[]> = {};
  for (const s of proof.stubs) {
    bp[s.path] = [...(bp[s.path] ?? []), s.line];
  }
  for (const l of proof.lints) {
    const line = typeof (l as { line?: number }).line === "number" ? (l as { line: number }).line : 1;
    bp[l.path] = [...(bp[l.path] ?? []), line];
  }
  if (!Object.keys(bp).length && !proof.done) {
    const first = Object.keys(files)[0];
    if (first) bp[first] = [1];
  }
  return bp;
}

/** Launch and keep. Overclock: more output, don't drop the session when a job ends. */
export function overclockLaunch(files: Record<string, string>, proof: Proof, tests: { name: string; pass: boolean; detail: string }[]) {
  const session = workspaceLaunch(files, breaksFromProof(files, proof), tests);
  session.output = [
    ...session.output,
    "overclock LIVE",
    proof.done ? "checks clear" : `${proof.fail} still open · holding session`,
  ];
  session.live = true;
  return persistDap(session);
}

export function clockRounds() {
  const s = loadDap();
  return s?.live && s.stopped ? 6 : 3;
}

export function debugStatus() {
  const s = loadDap();
  return {
    object: "hector.debug",
    live: Boolean(s?.live),
    stopped: Boolean(s?.stopped),
    frames: s?.stack.length ?? 0,
    overclock: clockRounds() > 3,
  };
}
