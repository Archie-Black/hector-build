/** User-approved home cluster. HTTP only on loopback/LAN. HTTPS for a domain (doomchat.ca). */

const STORE = "hector.home.cluster.v1";

export type HomeCluster = { url: string };

export function defaultHome(): HomeCluster {
  return { url: "" };
}

export function loadHome(): HomeCluster {
  if (typeof window === "undefined") return defaultHome();
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return defaultHome();
    const parsed = JSON.parse(raw) as Partial<HomeCluster>;
    return { url: String(parsed.url ?? "").trim() };
  } catch {
    return defaultHome();
  }
}

export function saveHome(next: HomeCluster) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE, JSON.stringify({ url: next.url.trim() }));
}

export function isPrivateLan(host: string) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
}

export function isLoopbackHost(host: string) {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

/** Origins Hector may call for Ollama. Not a general HTTP proxy. */
export function safeOllamaOrigin(raw: string): string | null {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return null;
  try {
    const url = new URL(t.includes("://") ? t : `http://${t}`);
    const host = url.hostname.toLowerCase();
    if (host === "0.0.0.0" || host.startsWith("169.254.")) return null;
    const loop = isLoopbackHost(host);
    const lan = isPrivateLan(host);
    if (loop || lan) {
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return `${url.protocol}//${url.host}`;
    }
    if (url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function ollamaOrigins(homeUrl?: string) {
  const out: string[] = [];
  const env = typeof process !== "undefined" ? (process.env.HECTOR_OLLAMA_URL || "").trim() : "";
  for (const raw of [homeUrl ?? "", env, "http://127.0.0.1:11434"]) {
    const origin = safeOllamaOrigin(raw);
    if (origin && !out.includes(origin)) out.push(origin);
  }
  return out;
}

export function vllmOrigins(homeUrl?: string) {
  const out: string[] = [];
  const env = typeof process !== "undefined" ? (process.env.HECTOR_VLLM_URL || "").trim() : "";
  for (const raw of [homeUrl ?? "", env, "http://127.0.0.1:8000"]) {
    const origin = safeOllamaOrigin(raw);
    if (origin && !out.includes(origin)) out.push(origin);
  }
  return out.filter((o) => !ollamaOrigins(homeUrl).includes(o) || /:8000$/.test(o));
}
