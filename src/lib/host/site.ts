/**
 * doomchat.ca hosting — the grok.me job, on Hector's domain.
 * slug.doomchat.ca and www.doomchat.ca/h/slug
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isSafeSlug, slugify, urls } from "./names.ts";

export type Access = "private" | "link" | "public";
export type SiteMeta = {
  slug: string;
  title: string;
  access: Access;
  token: string;
  owner: string;
  at: number;
  files: number;
};
export { RESERVED, slugify, urls, slugFromHost, isPublishJob, slugFromPrompt, isSafeSlug } from "./names.ts";

const DIR = join(process.cwd(), "data", "host");

function boot() {
  mkdirSync(DIR, { recursive: true });
}

function metaPath(slug: string) {
  return join(DIR, slug, "meta.json");
}

function filesPath(slug: string) {
  return join(DIR, slug, "files.json");
}

export function listSites(): SiteMeta[] {
  boot();
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .map((slug) => {
      try {
        return JSON.parse(readFileSync(metaPath(slug), "utf8")) as SiteMeta;
      } catch {
        return null;
      }
    })
    .filter((s): s is SiteMeta => Boolean(s));
}

export function loadSite(slug: string) {
  const id = slugify(slug);
  if (!id || !existsSync(metaPath(id))) return null;
  const meta = JSON.parse(readFileSync(metaPath(id), "utf8")) as SiteMeta;
  const files = JSON.parse(readFileSync(filesPath(id), "utf8")) as Record<string, string>;
  return { meta, files };
}

export function canView(meta: SiteMeta, token?: string) {
  if (meta.access === "public") return true;
  if (meta.access === "link" && token && token === meta.token) return true;
  if (meta.access === "private" && token && token === meta.token) return true;
  return false;
}

function landing(title: string, files: Record<string, string>) {
  const links = Object.keys(files)
    .slice(0, 40)
    .map((p) => `<li><a href="./${p}">${p}</a></li>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  html,body{margin:0;background:#070b12;color:#d6e4ff;font:16px/1.5 system-ui,sans-serif}
  main{max-width:42rem;margin:12vh auto;padding:0 1.5rem}
  a{color:#4d8cff}
  h1{font-weight:500;letter-spacing:.12em;text-transform:uppercase;font-size:.8rem;color:#7aa2ff}
</style>
<main>
  <h1>Hector Build</h1>
  <p>${title}</p>
  <ul>${links}</ul>
  <p style="color:#6b7c99;font-size:.8rem">Hosted on doomchat.ca · by DeltaKingZero</p>
</main>
</html>`;
}

export function publish(input: {
  slug?: string;
  title?: string;
  files: Record<string, string>;
  access?: Access;
  owner?: string;
}) {
  boot();
  const title = (input.title || "Hector Build").replace(/[<>]/g, "").slice(0, 80);
  let slug = slugify(input.slug || title);
  if (!isSafeSlug(slug)) slug = `hx-${Date.now().toString(36).slice(-6)}`;
  if (!isSafeSlug(slug)) throw new Error("reserved name");
  const token = hashToken(`${slug}:${Date.now()}:${Math.random()}`);
  const files = { ...input.files };
  if (!files["index.html"] && !files["index.htm"]) files["index.html"] = landing(title, files);
  mkdirSync(join(DIR, slug), { recursive: true });
  const meta: SiteMeta = {
    slug,
    title,
    access: input.access === "private" || input.access === "link" ? input.access : "public",
    token,
    owner: (input.owner || "local").slice(0, 80),
    at: Date.now(),
    files: Object.keys(files).length,
  };
  writeFileSync(metaPath(slug), JSON.stringify(meta));
  writeFileSync(filesPath(slug), JSON.stringify(files));
  const link = urls(slug, meta.access === "public" ? undefined : token);
  return { ...meta, ...link };
}

export function unpublish(slug: string) {
  const id = slugify(slug);
  if (!id || !existsSync(join(DIR, id))) return false;
  rmSync(join(DIR, id), { recursive: true, force: true });
  return true;
}

export function fileOf(slug: string, path: string) {
  const site = loadSite(slug);
  if (!site) return null;
  const clean = path.replace(/^\/+/, "") || "index.html";
  const body = site.files[clean] ?? (clean === "index.html" ? site.files["index.htm"] : undefined);
  if (body == null) return null;
  return { meta: site.meta, path: clean, body };
}

function hashToken(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36) + Date.now().toString(36).slice(-4);
}
