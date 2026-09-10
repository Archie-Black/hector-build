import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell } from "electron";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PORT = process.env.HECTOR_PORT || "8080";
const ORIGIN = `http://127.0.0.1:${PORT}`;

nativeTheme.themeSource = "dark";

/** @type {BrowserWindow | null} */
let hector = null;
/** @type {BrowserWindow | null} */
let hx = null;

function chrome(kind) {
  const hxWin = kind === "hx";
  return new BrowserWindow({
    width: hxWin ? 1440 : 1280,
    height: hxWin ? 920 : 860,
    minWidth: 900,
    minHeight: 600,
    title: hxWin ? "Spectral HX" : "Hector Build",
    backgroundColor: "#000000",
    show: false,
    autoHideMenuBar: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#000000",
      symbolColor: "#6ea8ff",
      height: 36,
    },
    webPreferences: {
      preload: join(HERE, "preload.mjs"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
    icon: join(ROOT, "public/hector", hxWin ? "agent-v2.png" : "hector-v2.png"),
  });
}

function openHector() {
  if (hector && !hector.isDestroyed()) {
    hector.focus();
    return hector;
  }
  hector = chrome("hector");
  hector.once("ready-to-show", () => hector?.show());
  void hector.loadURL(`${ORIGIN}/?house=1`);
  hector.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/hx")) {
      queueMicrotask(() => openHx());
      return { action: "deny" };
    }
    if (url.startsWith("http")) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  hector.on("closed", () => {
    hector = null;
  });
  return hector;
}

function openHx() {
  if (hx && !hx.isDestroyed()) {
    hx.focus();
    return hx;
  }
  hx = chrome("hx");
  hx.once("ready-to-show", () => hx?.show());
  void hx.loadURL(`${ORIGIN}/hx?live=1`);
  hx.on("closed", () => {
    hx = null;
  });
  return hx;
}

function wslBin() {
  if (process.platform !== "win32") return null;
  const p = join(process.env.SystemRoot || "C:\\Windows", "System32", "wsl.exe");
  return existsSync(p) ? p : "wsl.exe";
}

function winToWsl(p) {
  const m = String(p).replace(/\//g, "\\").match(/^([A-Za-z]):\\(.*)$/);
  if (!m) return String(p).replace(/\\/g, "/");
  return `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, "/")}`;
}

function wslStatus() {
  if (process.platform === "linux") {
    return { embedded: true, ready: true, via: "native-linux", distro: "native", note: "Linux host." };
  }
  const bin = wslBin();
  if (!bin) return { embedded: true, ready: false, via: "wsl", distro: "Ubuntu", note: "Run Install.bat to embed WSL." };
  return { embedded: true, ready: true, via: "wsl", distro: "Ubuntu", note: "WSL Ubuntu is the install layer." };
}

function wslRun(job) {
  const allowed = new Set(["status", "embed", "packages", "ollama", "models", "onion"]);
  if (!allowed.has(job)) return Promise.resolve({ ok: false, out: "blocked" });
  const guest = `${winToWsl(ROOT)}/packaging/linux/wsl-guest.sh`;
  if (process.platform === "linux") {
    return new Promise((resolve) => {
      const child = spawn("bash", [join(ROOT, "packaging/linux/wsl-guest.sh"), job], { cwd: ROOT });
      let out = "";
      child.stdout?.on("data", (d) => { out += String(d); });
      child.stderr?.on("data", (d) => { out += String(d); });
      child.on("close", (code) => resolve({ ok: code === 0, out: out.slice(-8000) }));
      child.on("error", (err) => resolve({ ok: false, out: err.message }));
    });
  }
  const bin = wslBin();
  if (!bin) return Promise.resolve({ ok: false, out: "wsl.exe missing" });
  return new Promise((resolve) => {
    const child = spawn(bin, ["-d", "Ubuntu", "--", "bash", guest, job], { windowsHide: true });
    let out = "";
    child.stdout?.on("data", (d) => { out += String(d); });
    child.stderr?.on("data", (d) => { out += String(d); });
    child.on("close", (code) => resolve({ ok: code === 0, out: out.slice(-8000) }));
    child.on("error", (err) => resolve({ ok: false, out: err.message }));
  });
}

function ping() {
  return fetch(`${ORIGIN}/`).then((r) => r.ok).catch(() => false);
}

async function ensureServer() {
  if (await ping()) return true;
  const isWin = process.platform === "win32";
  const npm = isWin
    ? "npm.cmd"
    : existsSync(join(ROOT, "runtime/node/bin/npm"))
      ? join(ROOT, "runtime/node/bin/npm")
      : "npm";
  const child = spawn(npm, ["run", "dev"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT,
      PATH: isWin
        ? process.env.PATH
        : `${join(ROOT, "runtime/node/bin")}:${process.env.PATH || ""}`,
    },
    stdio: "ignore",
    detached: true,
    shell: isWin,
  });
  child.unref();
  const start = Date.now();
  while (Date.now() - start < 25000) {
    if (await ping()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

app.whenReady().then(async () => {
  ipcMain.handle("desktop:open-hx", () => openHx());
  ipcMain.handle("desktop:open-amp", () => {
    const w = hector && !hector.isDestroyed() ? hector : openHector();
    void w.loadURL(`${ORIGIN}/?house=1`);
    return true;
  });
  ipcMain.handle("desktop:wsl-status", () => wslStatus());
  ipcMain.handle("desktop:wsl-run", (_e, job) => wslRun(String(job || "status")));
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: "fileMenu" },
      { role: "editMenu" },
      { role: "viewMenu" },
      {
        label: "Hector",
        submenu: [
          { label: "Hector Build", click: () => openHector() },
          { label: "Spectral HX", click: () => openHx() },
        ],
      },
      { role: "windowMenu" },
    ]),
  );
  await ensureServer();
  const which = process.argv.includes("--hx") ? "hx" : "hector";
  if (which === "hx") openHx();
  else openHector();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openHector();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
