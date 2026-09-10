export type HostOs = "windows" | "linux" | "macos" | "android" | "ios";
export type LockedPlatform = HostOs;

const KEY = "hector-platform-lock-v2";
const OLD = "hector-platform-lock-v1";

export function detectPlatform(ua = "", plat = ""): HostOs {
  const s = `${ua} ${plat}`.toLowerCase();
  if (s.includes("android")) return "android";
  if (/iphone|ipad|ipod|ios/.test(s)) return "ios";
  if (s.includes("win")) return "windows";
  if (s.includes("mac") && !s.includes("like mac")) return "macos";
  if (s.includes("linux") || s.includes("x11") || s.includes("cros")) return "linux";
  if (typeof process !== "undefined" && process.platform === "win32") return "windows";
  if (typeof process !== "undefined" && process.platform === "darwin") return "macos";
  return "linux";
}

function migrate(raw: string | null): HostOs | null {
  if (raw === "windows" || raw === "linux" || raw === "macos" || raw === "android" || raw === "ios") return raw;
  if (raw === "android") return "android";
  if (raw === "mobile") return "ios";
  if (raw === "desktop") return null;
  return null;
}

export function loadPlatformLock(): HostOs | null {
  if (typeof window === "undefined") return null;
  return migrate(window.localStorage.getItem(KEY)) ?? migrate(window.localStorage.getItem(OLD));
}

export function lockPlatform(platform: HostOs): HostOs {
  if (typeof window === "undefined") return platform;
  window.localStorage.setItem(KEY, platform);
  return platform;
}

export function resolveImmutablePlatform(): HostOs {
  const existing = loadPlatformLock();
  if (existing) return existing;
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const plat = typeof navigator === "undefined" ? "" : navigator.platform;
  return lockPlatform(detectPlatform(ua, plat));
}

export function osFamily(os: HostOs): "desktop" | "mobile" {
  return os === "android" || os === "ios" ? "mobile" : "desktop";
}

export function osLabel(os: HostOs) {
  return { windows: "Windows", linux: "Linux", macos: "macOS", android: "Android", ios: "iOS" }[os];
}

export const UE_DOWNLOAD = "https://www.unrealengine.com/en-US/download";
export const VS_DOWNLOAD = "https://visualstudio.microsoft.com/vs/community/";
export const ANDROID_STUDIO = "https://developer.android.com/studio";
export const DOOMCHAT = "https://www.doomchat.ca";
export const GROK_COM = "https://grok.com";
export const GROK_BOT = "https://x.com/grok";
export const NODE22 = "https://nodejs.org";
export const GITHUB_ZIP = "https://github.com/Archie-Black/hector-build/archive/refs/heads/main.zip";
