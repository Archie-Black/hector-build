export const RESERVED = new Set([
  "www", "hx", "y", "files", "updates", "chat", "matrix", "ollama", "mcp", "api",
  "admin", "app", "hector", "spectral", "mail", "ftp", "ns", "ns1", "ns2", "smtp",
  "imap", "git", "ssh", "vault", "login", "verify", "sandbox", "bi", "downloads",
  "host", "publish", "h", "os", "share", "spool", "wsl",
]);

export function slugify(raw: string) {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  return s.length >= 2 ? s : "";
}

export function slugFromHost(host: string) {
  const h = host.split(":")[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]+)\.doomchat\.ca$/);
  if (!m) return "";
  const slug = m[1];
  if (RESERVED.has(slug)) return "";
  return slug;
}

export function urls(slug: string, token?: string) {
  const q = token ? `?k=${token}` : "";
  return {
    wildcard: `https://${slug}.doomchat.ca${q ? "/" : ""}${q}`.replace(/\/\?/, "?"),
    path: `https://www.doomchat.ca/h/${slug}${q}`,
  };
}

export function isPublishJob(prompt: string) {
  return /\b(publish|host (this|it|my build)|put this (up|live)|doomchat\.ca)\b/i.test(prompt);
}

export function slugFromPrompt(prompt: string) {
  const m = prompt.match(/\b(?:as|named|called|slug)\s+([a-z0-9-]{2,32})\b/i);
  return m ? slugify(m[1]) : "";
}
