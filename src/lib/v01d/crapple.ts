/** Crapple. Standalone Macintosh handler. Darwin window. Unix is the second window. */

export type Guest = "darwin" | "unix" | "none";

export type Map = {
  cmd: "win";
  click: "one";
  wheel: "scroll";
};

export const MAP: Map = { cmd: "win", click: "one", wheel: "scroll" };

export function isMac(file: string) {
  const f = file.toLowerCase();
  return (
    /\.(app|dmg|pkg|ipa)$/.test(f) ||
    /(^|\/)applications\//i.test(file) ||
    /(^|\/)users\//i.test(file) ||
    /(^|\/)system\//i.test(file) ||
    /(^|\/)volumes\//i.test(file) ||
    f.includes(".app/") ||
    /^\/mac\//.test(file)
  );
}

export function isUnix(file: string) {
  const f = file.toLowerCase();
  if (isMac(file)) return false;
  return (
    /\.(ksh|csh|out)$/.test(f) ||
    /(^|\/)usr\/local\//.test(f) ||
    /(^|\/)opt\//.test(f) ||
    /\bbin\/(ksh|csh|tcsh)\b/.test(f) ||
    f.includes("freebsd") ||
    f.includes("posix")
  );
}

export function guest(file: string): Guest {
  if (isMac(file)) return "darwin";
  if (isUnix(file)) return "unix";
  return "none";
}

/** Windows / Super key is Command. Left and right click are one button. Wheel only scrolls. */
export function mapKey(code: string) {
  if (code === "MetaLeft" || code === "MetaRight" || code === "OSLeft" || code === "OSRight") return { cmd: true, key: "Meta" };
  return { cmd: false, key: code };
}

export function mapButton(button: number) {
  if (button === 0 || button === 2) return 0;
  return button;
}

export function mapWheel(dx: number, dy: number) {
  return { scroll: dy, pan: 0, zoom: dx * 0 };
}

export function planMac(file: string) {
  const g = guest(file);
  if (g === "darwin") {
    return { ok: true, guest: g, how: "crapple", note: "Crapple. Darwin window. Windows key is Command. One mouse button. Wheel scrolls." };
  }
  if (g === "unix") {
    return { ok: true, guest: g, how: "unix", note: "Unix. Second window. Read, write, execute." };
  }
  return { ok: false, guest: g, how: "none", note: "Not a Mac or Unix program." };
}
