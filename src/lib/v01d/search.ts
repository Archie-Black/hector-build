/** Hector by the clock. Search this computer and the web. */

import { APPS, type AppId } from "@/lib/horsemen/layout";
import { catalog } from "./programs";

export type Hit = {
  id: string;
  where: "system" | "web";
  title: string;
  blurb: string;
  app?: AppId;
  url?: string;
  run?: string;
};

function score(q: string, ...parts: string[]) {
  const n = q.toLowerCase().trim();
  if (!n) return 0;
  const hay = parts.join(" ").toLowerCase();
  if (hay === n) return 100;
  if (hay.startsWith(n)) return 80;
  if (hay.includes(n)) return 50;
  const bits = n.split(/\s+/).filter(Boolean);
  return bits.every((b) => hay.includes(b)) ? 30 : 0;
}

export function systemHits(q: string): Hit[] {
  const out: { hit: Hit; n: number }[] = [];
  for (const a of APPS) {
    const n = score(q, a.title, a.blurb, a.id);
    if (n) out.push({ n, hit: { id: `app:${a.id}`, where: "system", title: a.title, blurb: a.blurb, app: a.id } });
  }
  for (const p of catalog()) {
    const n = score(q, p.name, p.bin, p.linux);
    if (n) out.push({ n, hit: { id: `bin:${p.bin}`, where: "system", title: p.name, blurb: p.linux, app: p.app, run: p.linux } });
  }
  const rooms: Hit[] = [
    { id: "place:home", where: "system", title: "Home", blurb: "/v01d/home", app: "files" },
    { id: "place:programs", where: "system", title: "Programs", blurb: "/v01d/programs", app: "programs" },
    { id: "place:shared", where: "system", title: "Shared", blurb: "/v01d/shared", app: "files" },
    { id: "place:settings", where: "system", title: "System", blurb: "Volume, spatial audio, brightness, type.", app: "settings" },
  ];
  for (const r of rooms) {
    const n = score(q, r.title, r.blurb);
    if (n) out.push({ n, hit: r });
  }
  const seen = new Set<string>();
  return out
    .sort((a, b) => b.n - a.n)
    .map((x) => x.hit)
    .filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    })
    .slice(0, 8);
}

export function webHits(q: string): Hit[] {
  const t = q.trim();
  if (!t) return [];
  const url = /^https?:\/\//i.test(t) || /^[\w-]+\.[\w.-]+(\/|$)/.test(t);
  const href = url ? (t.includes("://") ? t : `https://${t}`) : `https://duckduckgo.com/?q=${encodeURIComponent(t)}`;
  return [
    {
      id: "web:go",
      where: "web",
      title: url ? t : `Search the web for “${t}”`,
      blurb: "GhostWalk. Quiet.",
      app: "ghostwalk",
      url: href,
    },
  ];
}

export function search(q: string) {
  const t = q.trim();
  if (!t) return { system: [] as Hit[], web: [] as Hit[] };
  return { system: systemHits(t), web: webHits(t) };
}

export function wantsSearch(text: string) {
  return /\b(search|find|look up|google|web search)\b/i.test(text);
}
