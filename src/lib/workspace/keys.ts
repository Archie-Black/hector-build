export const XAI_LOGIN_URL = "https://console.x.ai/login";
export const XAI_KEYS_URL = "https://console.x.ai/team/default/api-keys";
const VISITOR_KEY = "hector-visitor-xai";

export function isXaiKey(value: string): boolean {
  return /^xai-[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

export function isApiKey(value: string): boolean {
  const t = value.trim();
  return t.length >= 12 && !/\s/.test(t);
}

export function loadVisitorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(VISITOR_KEY) ?? "";
    return isApiKey(raw) ? raw.trim() : "";
  } catch {
    return "";
  }
}

export function saveVisitorKey(value: string) {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (!isApiKey(trimmed)) {
    window.localStorage.removeItem(VISITOR_KEY);
    return;
  }
  window.localStorage.setItem(VISITOR_KEY, trimmed);
}

export function maskKey(value: string): string {
  const t = value.trim();
  if (t.length < 8) return "not connected";
  return `…${t.slice(-4)}`;
}
