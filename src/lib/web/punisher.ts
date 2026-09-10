/** Punisher. Surface web. Search and fetch. Hector's public eyes. */

export type WebHit = { title: string; url: string; text: string; rider: "punisher" };

const UA = "HectorBuild/1.0 (+https://doomchat.ca)";

async function get(url: string, ms = 12_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { Accept: "text/html,application/json", "User-Agent": UA }, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

function strip(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function safeHttps(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (/^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(h)) return null;
    if (h.endsWith(".onion")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function ddgJson(query: string): Promise<WebHit[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await get(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: { Text?: string; FirstURL?: string }[];
  };
  const hits: WebHit[] = [];
  if (data.AbstractText) {
    hits.push({ title: data.Heading || query, url: data.AbstractURL || "", text: data.AbstractText, rider: "punisher" });
  }
  for (const t of data.RelatedTopics ?? []) {
    if (t.Text && t.FirstURL) hits.push({ title: t.Text.slice(0, 80), url: t.FirstURL, text: t.Text, rider: "punisher" });
  }
  return hits.slice(0, 8);
}

async function ddgHtml(query: string): Promise<WebHit[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await get(url);
  if (!res.ok) return [];
  const html = await res.text();
  const hits: WebHit[] = [];
  const re = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && hits.length < 8) {
    const href = strip(m[1] || "");
    const title = strip(m[2] || "");
    const text = strip(m[3] || "");
    const u = safeHttps(href) || href;
    if (title) hits.push({ title, url: u, text, rider: "punisher" });
  }
  return hits;
}

async function wiki(query: string): Promise<WebHit[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&namespace=0&format=json&origin=*&search=${encodeURIComponent(query)}`;
  const res = await get(url);
  if (!res.ok) return [];
  const data = (await res.json()) as [string, string[], string[], string[]];
  const titles = data[1] ?? [];
  const blurb = data[2] ?? [];
  const links = data[3] ?? [];
  return titles.map((title, i) => ({
    title,
    url: links[i] || "",
    text: blurb[i] || title,
    rider: "punisher" as const,
  }));
}

export async function punisherSearch(query: string) {
  const q = query.trim().slice(0, 240);
  if (!q) return { rider: "punisher" as const, query: q, hits: [] as WebHit[] };
  const packs = await Promise.allSettled([ddgJson(q), ddgHtml(q), wiki(q)]);
  const hits: WebHit[] = [];
  const seen = new Set<string>();
  for (const p of packs) {
    if (p.status !== "fulfilled") continue;
    for (const h of p.value) {
      const key = (h.url || h.title).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(h);
    }
  }
  return { rider: "punisher" as const, query: q, hits: hits.slice(0, 10) };
}

export async function punisherFetch(raw: string) {
  const url = safeHttps(raw);
  if (!url) return { rider: "punisher" as const, error: "Punisher only rides https on the public web." };
  const res = await get(url, 18_000);
  const text = strip(await res.text()).slice(0, 6000);
  return { rider: "punisher" as const, status: res.status, url, text };
}
