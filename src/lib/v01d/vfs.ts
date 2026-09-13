import { isGhstkrt } from "@/lib/ghstkrt/knot";
import { dialectOf, say, spread } from "./talk";
import { folder } from "./programs";

export type Kind = "win" | "nix" | "v01d" | "mac";

export type Node = {
  name: string;
  path: string;
  kind: Kind;
  dir: boolean;
  native: string;
  run?: string;
};

const HOME = [
  { name: "Documents", dir: true },
  { name: "Downloads", dir: true },
  { name: "Pictures", dir: true },
  { name: "Media", dir: true },
  { name: "Programs", dir: true },
  { name: "Shared", dir: true },
  { name: "GhostIT.md", dir: false },
];

const PROGRAMS = folder();

const SHARED = [
  { name: "Files", dir: true },
  { name: "Pictures", dir: true },
  { name: "Media", dir: true },
];

spread();

function hidden(name: string) {
  return isGhstkrt(name) || name.startsWith(".") || /tongue/i.test(name);
}

function face(kind: Kind, name: string, path: string, run?: string) {
  if (kind === "win") return windows(path);
  if (/programs/i.test(path)) return run || name;
  if (/shared/i.test(path)) return name;
  return path.replace(/^\/v01d\/home/, "~").replace(/^\/v01d\//, "~/");
}

/** One tree. Windows, Linux, and this OS all look like home. */
export function native(input: string): { path: string; kind: Kind } {
  const raw = input.trim();
  if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith("\\\\") || raw.startsWith("/win/")) {
    const p = raw.startsWith("/win/") ? raw : say(raw, "ntfs", "v01d");
    const path = p.startsWith("/win/") ? p.replace(/\\/g, "/").replace(/\/+/g, "/") : `/win/${raw[0].toLowerCase()}${raw.slice(2).replace(/\\/g, "/")}`.replace(/\/+/g, "/");
    return { path, kind: "win" };
  }
  if (raw.startsWith("/mnt/") || raw.startsWith("/cygdrive/")) {
    const m = raw.match(/^\/(mnt|cygdrive)\/([a-z])\/(.*)$/i);
    if (m) return { path: `/win/${m[2].toLowerCase()}/${m[3]}`, kind: "win" };
  }
  if (raw.startsWith("v01d://") || raw.startsWith("/v01d/")) {
    return { path: raw.replace(/^v01d:\/\//, "/v01d/").replace(/\/+/g, "/"), kind: "v01d" };
  }
  if (
    /^\/Users\//.test(raw) ||
    /^\/Applications\//.test(raw) ||
    /^\/Volumes\//.test(raw) ||
    /^\/System\//.test(raw) ||
    /^\/mac\//.test(raw) ||
    /\.app(\/|$)/i.test(raw)
  ) {
    const p = raw.startsWith("/mac/") ? raw : `/mac${raw.startsWith("/") ? raw : `/${raw}`}`;
    return { path: p.replace(/\/+/g, "/"), kind: "mac" };
  }
  const p = raw.replace(/\\/g, "/");
  return { path: p.startsWith("/") ? p : `/home/${p}`, kind: "nix" };
}

export function windows(v01d: string): string {
  const n = native(v01d);
  if (n.path.startsWith("/win/")) return say(n.path, "v01d", "ntfs");
  return n.path.replace(/\//g, "\\");
}

export function list(at = "/v01d/home"): Node[] {
  const n = native(at);
  const rows = /programs/i.test(n.path) ? PROGRAMS : /shared|share/i.test(n.path) ? SHARED : HOME;
  return rows
    .filter((h) => !hidden(h.name))
    .map((h) => {
      const path = `${n.path.replace(/\/$/, "")}/${h.name}`;
      const run = "run" in h && typeof h.run === "string" ? h.run : undefined;
      return {
        name: h.name,
        path,
        kind: n.kind,
        dir: h.dir,
        native: face(n.kind, h.name, path, run),
        run,
      };
    });
}

export function same(a: string, b: string) {
  return native(a).path.replace(/\/+$/, "") === native(b).path.replace(/\/+$/, "");
}

export function speak(path: string, to: "win" | "nix") {
  const d = dialectOf(path);
  return to === "win" ? say(native(path).path, d === "ntfs" ? "v01d" : d, "ntfs") : native(path).path;
}
