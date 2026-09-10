/**
 * Subdomain isolation for doomchat.ca.
 *
 * User builds live in the build zone only: slug.build.doomchat.ca
 * First-level names (www, hx, y, chat…) are services. Never user sites.
 * That stops cookie jar sharing with the parent (the grok.me-class attack).
 *
 * Certs: on-demand TLS only for published slugs (ask endpoint).
 * Cookies: user zone never sets Domain=.doomchat.ca. Caddy strips Set-Cookie.
 */
import { RESERVED, isSafeSlug } from "./names.ts";
import { loadSite } from "./site.ts";

export const APEX = "doomchat.ca";
export const BUILD_ZONE = "build.doomchat.ca";

export type HostKind = "apex" | "service" | "user" | "nested" | "unknown";

export function classifyHost(host: string): { kind: HostKind; slug: string; host: string } {
  const h = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  if (h === APEX || h === `www.${APEX}`) return { kind: "apex", slug: "", host: h };
  if (h === BUILD_ZONE) return { kind: "service", slug: "", host: h };
  const user = h.match(/^([a-z0-9-]+)\.build\.doomchat\.ca$/);
  if (user) {
    const slug = user[1];
    if (!isSafeSlug(slug)) return { kind: "unknown", slug: "", host: h };
    return { kind: "user", slug, host: h };
  }
  const first = h.match(/^([a-z0-9-]+)\.doomchat\.ca$/);
  if (first) {
    if (RESERVED.has(first[1])) return { kind: "service", slug: "", host: h };
    return { kind: "unknown", slug: "", host: h };
  }
  if (h.endsWith(`.${APEX}`)) return { kind: "nested", slug: "", host: h };
  return { kind: "unknown", slug: "", host: h };
}

export { isSafeSlug };
export function allowCert(domain: string) {
  const { kind, slug } = classifyHost(domain);
  if (kind !== "user" || !slug) return false;
  return Boolean(loadSite(slug));
}

export function isolationHeaders(kind: HostKind): Record<string, string> {
  const base = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-dns-prefetch-control": "off",
  };
  if (kind === "user") {
    return {
      ...base,
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "credentialless",
      "cross-origin-resource-policy": "same-origin",
      "origin-agent-cluster": "?1",
      "x-frame-options": "DENY",
      "content-security-policy": [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "object-src 'none'",
      ].join("; "),
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      "cache-control": "no-store",
    };
  }
  return {
    ...base,
    "cross-origin-opener-policy": "same-origin",
    "origin-agent-cluster": "?1",
    "x-frame-options": "SAMEORIGIN",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

export function withIsolation(res: Response, kind: HostKind) {
  const headers = new Headers(res.headers);
  headers.delete("set-cookie");
  for (const [k, v] of Object.entries(isolationHeaders(kind))) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
