/** Silent privacy. No catalog. Pads hops. Strips trackers. */
const TRACK = [
  "utm_",
  "fbclid",
  "gclid",
  "mc_eid",
  "yclid",
  "_ga",
  "ref=",
];

export function cleanUrl(raw: string): string {
  let u = raw.trim();
  if (!u) return "";
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u)) u = `https://${u}`;
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  [...url.searchParams.keys()].forEach((k) => {
    if (TRACK.some((t) => k.toLowerCase().startsWith(t.replace("=", "").toLowerCase()) || k.toLowerCase() === t.replace("=", ""))) {
      url.searchParams.delete(k);
    }
  });
  return url.toString();
}

export function isOnion(href: string): boolean {
  try {
    return new URL(href).hostname.endsWith(".onion");
  } catch {
    return false;
  }
}

export function circuit(): string {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

export const GHOST_UA = "Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0";
