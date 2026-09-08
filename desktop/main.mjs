import { app, BrowserWindow } from "electron";

const PORT = process.env.HECTOR_PORT || "8080";
const ORIGIN = `http://127.0.0.1:${PORT}`;

/** @type {BrowserWindow | null} */
let hector = null;
/** @type {BrowserWindow | null} */
let hx = null;

function openHector() {
  if (hector && !hector.isDestroyed()) {
    hector.focus();
    return hector;
  }
  hector = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 520,
    title: "Hector Build",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: { sandbox: true },
  });
  hector.loadURL(`${ORIGIN}/?house=1`);
  hector.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/hx")) {
      queueMicrotask(() => openHx());
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
  hx = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: "Spectral HX",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: { sandbox: true },
  });
  hx.loadURL(`${ORIGIN}/hx?live=1`);
  hx.on("closed", () => {
    hx = null;
  });
  return hx;
}

app.whenReady().then(() => {
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
