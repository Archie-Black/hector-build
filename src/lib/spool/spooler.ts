import { existsSync } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { lookAhead, type Lane } from "./look-ahead.ts";
import { listTerms, openTerm } from "../share/term.ts";
import { ollamaOrigins, vllmOrigins } from "../ollama/home.ts";
import { startDevice } from "../devices/print.ts";

type Slot = { lane: Lane; at: number; pid?: number; note: string; child?: ChildProcess };

const slots = new Map<Lane, Slot>();
const SKIP = process.env.HECTOR_SPOOL === "0";

function mark(lane: Lane, note: string, child?: ChildProcess) {
  slots.set(lane, { lane, at: Date.now(), pid: child?.pid, note, child });
}

function alive(lane: Lane) {
  const s = slots.get(lane);
  if (!s) return false;
  if (s.child && s.child.exitCode != null) return false;
  return Date.now() - s.at < 60_000;
}

function browserBin() {
  const win = process.env.ProgramFiles || "C:\\Program Files";
  const win86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const names = [
    join(win, "Google/Chrome/Application/chrome.exe"),
    join(win, "Microsoft/Edge/Application/msedge.exe"),
    join(win86, "Microsoft/Edge/Application/msedge.exe"),
    join(win, "BraveSoftware/Brave-Browser/Application/brave.exe"),
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
    "/usr/bin/microsoft-edge-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  return names.find((p) => existsSync(p)) || "";
}

function warm(cmd: string, args: string[], extra?: { cwd?: string }) {
  const child = spawn(cmd, args, {
    cwd: extra?.cwd ?? process.cwd(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return child;
}

async function ping(url: string, ms = 400) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    await fetch(url, { signal: ac.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function spoolLane(lane: Lane) {
  if (SKIP || alive(lane)) return slots.get(lane);
  if (lane === "core") {
    mark("core", `node ${process.version}`);
    return slots.get(lane);
  }
  if (lane === "git") {
    const child = warm("git", ["status", "-sb", "--porcelain=v1"]);
    mark("git", existsSync(join(process.cwd(), ".git")) ? "git status" : "git", child);
    startDevice("git");
    return slots.get(lane);
  }
  if (lane === "term") {
    if (!listTerms().length) openTerm("spool");
    mark("term", "bash warm");
    startDevice("term");
    return slots.get(lane);
  }
  if (lane === "model") {
    const origin = ollamaOrigins()[0];
    void ping(`${origin}/api/tags`);
    for (const v of vllmOrigins()) void ping(`${v}/v1/models`);
    void ping("http://127.0.0.1:8080/api/v1/models");
    mark("model", "models pinged");
    startDevice("model");
    return slots.get(lane);
  }
  if (lane === "browser") {
    const bin = browserBin();
    if (bin) {
      const child = warm(bin, ["--no-startup-window", "--no-first-run", "--disable-extensions", "--disable-background-networking"]);
      mark("browser", bin, child);
      startDevice("browser");
    } else mark("browser", "no browser bin");
    return slots.get(lane);
  }
  if (lane === "preview") {
    void ping("http://127.0.0.1:8080/");
    mark("preview", "preview");
    return slots.get(lane);
  }
  if (lane === "build") {
    mark("build", existsSync(join(process.cwd(), "package.json")) ? "package.json" : "build");
    return slots.get(lane);
  }
  if (lane === "ssh" || lane === "onion") {
    mark(lane, lane);
    return slots.get(lane);
  }
  return slots.get(lane);
}

export function spoolStatus() {
  return {
    object: "hector.spool",
    lanes: [...slots.values()].map(({ lane, at, note, pid }) => ({ lane, ageMs: Date.now() - at, note, pid: pid ?? null })),
  };
}

export async function spool(lanes: Lane[]) {
  await Promise.all(lanes.map((l) => spoolLane(l)));
  return spoolStatus();
}

export function idleSpool() {
  if (SKIP) return Promise.resolve(spoolStatus());
  return spool(["core", "git", "term", "model"]);
}

export function spoolFor(prompt: string) {
  return spool(lookAhead(prompt));
}
