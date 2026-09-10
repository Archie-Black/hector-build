import { clearPrivateKey, openPrivateKey, sealPrivateKey } from "@/lib/security/lockbox";

export const XAI_LOGIN_URL = "https://console.x.ai/login";
export const XAI_KEYS_URL = "https://console.x.ai/team/default/api-keys";

export function isXaiKey(value: string): boolean {
  return /^xai-[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

export function isApiKey(value: string): boolean {
  const t = value.trim();
  return t.length >= 12 && !/\s/.test(t) && t !== "local";
}

export function loadVisitorKey(): string {
  return "";
}

export async function loadVisitorKeyAsync(): Promise<string> {
  return openPrivateKey();
}

export function saveVisitorKey(value: string) {
  void sealPrivateKey(value);
}

export function forgetVisitorKey() {
  void clearPrivateKey();
}

export function maskKey(value: string): string {
  const t = value.trim();
  if (t.length < 8) return "not connected";
  return `…${t.slice(-4)}`;
}
