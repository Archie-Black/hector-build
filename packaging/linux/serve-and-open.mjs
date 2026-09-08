#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createConnection } from "node:net";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.HECTOR_PORT || 8080);
const WIN = process.platform === "win32";
const WSL = !WIN && isWsl();
const target = process.argv[2] === "hx" ? "hx" : "hector";
const path = target === "hx" ? "/hx?live=1" : "/?house=1";
const url = `http://127.0.0.1:${PORT}${path}`;

function isWsl() {
  try {
    return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}

function portOpen() {
  return new Promise((resolve) => {
    const sock = createConnection({ port: PORT, host: "127.0.0.1" }, () => {
      sock.end();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
  });
}

function launch(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    shell: WIN,
    ...opts,
  });
  child.on("error", () => undefined);
  child.unref();
  return child;
}

function bundledNode() {
  const bin = join(ROOT, "runtime/node/bin/node");
  return existsSync(bin) ? bin : "";
}

function bundledNpm() {
  const bin = join(ROOT, "runtime/node/bin/npm");
  return existsSync(bin) ? bin : "";
}

async function ensureServer() {
  if (await portOpen()) return;
  const npm = bundledNpm();
  const node = bundledNode();
  const env = {
    ...process.env,
    PORT: String(PORT),
    PATH: node ? `${join(ROOT, "runtime/node/bin")}${WIN ? ";" : ":"}${process.env.PATH || ""}` : process.env.PATH,
  };
  if (npm) launch(npm, ["run", "dev"], { env });
  else launch(WIN ? "npm.cmd" : "npm", ["run", "dev"], { env });
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await portOpen()) return;
  }
  throw new Error("Hector server did not start. Node 22 should live in runtime/node. Re-run packaging/linux/install-node22.sh");
}

function winLocalAppData() {
  try {
    const raw = execFileSync("cmd.exe", ["/c", "echo %LOCALAPPDATA%"], { encoding: "utf8" }).trim();
    if (/^[A-Za-z]:\\/.test(raw)) {
      return `/mnt/${raw[0].toLowerCase()}${raw.slice(2).replace(/\\/g, "/")}`;
    }
  } catch {
    /* fall through */
  }
  try {
    const users = "/mnt/c/Users";
    const name = readdirSync(users).find((n) => existsSync(join(users, n, "AppData/Local")));
    if (name) return join(users, name, "AppData/Local");
  } catch {
    /* fall through */
  }
  return join(homedir(), ".local/share");
}

function chromeCandidates() {
  if (WIN) {
    const local = process.env.LOCALAPPDATA || "";
    const pf = process.env.PROGRAMFILES || "C:\\Program Files";
    const pf86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    return [
      join(local, "Google/Chrome/Application/chrome.exe"),
      join(pf, "Google/Chrome/Application/chrome.exe"),
      join(pf86, "Google/Chrome/Application/chrome.exe"),
      join(pf, "Microsoft/Edge/Application/msedge.exe"),
      join(pf86, "Microsoft/Edge/Application/msedge.exe"),
    ];
  }
  if (WSL) {
    return [
      "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
      "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe",
      "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ];
  }
  return ["google-chrome-stable", "google-chrome", "chromium-browser", "chromium", "brave-browser", "microsoft-edge"];
}

function openWindow() {
  const profile = WSL
    ? join(winLocalAppData(), "HectorBuild", "chrome-profile", target)
    : WIN
      ? join(process.env.LOCALAPPDATA || homedir(), "HectorBuild", "chrome-profile", target)
      : join(homedir(), ".local/share", `${target}-chrome`);
  const args = [`--app=${url}`, `--user-data-dir=${profile}`, "--new-window"];
  for (const bin of chromeCandidates()) {
    if ((WIN || WSL) && !existsSync(bin)) continue;
    launch(bin, args);
    return;
  }
  if (WIN) launch("cmd.exe", ["/c", "start", "", url]);
  else if (WSL) launch("cmd.exe", ["/c", "start", "", url]);
  else launch("xdg-open", [url]);
}

await ensureServer();
openWindow();
