export type LockedPlatform = "desktop" | "android" | "mobile";

const KEY = "hector-platform-lock-v1";

export function detectPlatform(ua = ""): LockedPlatform {
  const s = ua.toLowerCase();
  if (s.includes("android")) return "android";
  if (/iphone|ipad|ipod/.test(s)) return "mobile";
  if (s.includes("mobile") && !s.includes("windows")) return "mobile";
  return "desktop";
}

export function loadPlatformLock(): LockedPlatform | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw === "desktop" || raw === "android" || raw === "mobile") return raw;
  return null;
}

export function lockPlatform(platform: LockedPlatform): LockedPlatform {
  if (typeof window === "undefined") return platform;
  window.localStorage.setItem(KEY, platform);
  return platform;
}

export function resolveImmutablePlatform(): LockedPlatform {
  const existing = loadPlatformLock();
  if (existing) return existing;
  const detected = detectPlatform(typeof navigator === "undefined" ? "" : navigator.userAgent);
  return lockPlatform(detected);
}

export const UE_DOWNLOAD = "https://www.unrealengine.com/en-US/download";
export const VS_DOWNLOAD = "https://visualstudio.microsoft.com/vs/community/";
export const ANDROID_STUDIO = "https://developer.android.com/studio";
export const DOOMCHAT = "https://www.doomchat.ca";
export const GROK_COM = "https://grok.com";
export const GROK_BOT = "https://x.com/grok";
