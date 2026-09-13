/** GhostWalk is the only browser. It morphs. It does not fork into three browsers. */

import type { AppId } from "@/lib/horsemen/layout";
import { guest } from "@/lib/v01d/crapple";
import { native } from "@/lib/v01d/vfs";
import { plan } from "@/lib/v01d/runtime";

export type Habitat = "web" | "win" | "nix" | "darwin" | "unix";

export type Open = {
  habitat: Habitat;
  app: AppId;
  how: string;
  href: string;
  ext: string;
  browse: boolean;
  ua: string;
  say: string;
};

const WEB = new Set(["html", "htm", "xhtml", "svg", "pdf", "xml", "css", "mjs", "md"]);
const PIC = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg"]);

export const UA: Record<Habitat, string> = {
  web: "Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0",
  win: "Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0",
  nix: "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
  darwin: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko)",
  unix: "Mozilla/5.0 (X11; Unix; rv:128.0) Gecko/20100101 Firefox/128.0",
};

export function extOf(raw: string) {
  const p = raw.split(/[?#]/)[0] || "";
  const base = p.split(/[\\/]/).pop() || "";
  const d = base.lastIndexOf(".");
  if (d <= 0) return "";
  return base.slice(d + 1).toLowerCase();
}

function peel(raw: string) {
  return raw.replace(/^(open|run|launch|start|browse|go to)\s+/i, "").trim();
}

export function host(): Habitat {
  if (typeof navigator === "undefined") return "nix";
  const u = navigator.userAgent;
  if (/Mac OS X|Macintosh/.test(u)) return "darwin";
  if (/Windows/.test(u)) return "win";
  return "nix";
}

export function sniff(raw: string): Habitat {
  const t = peel(raw);
  if (/^https?:\/\//i.test(t) || /^www\./i.test(t) || t.endsWith(".onion")) return "web";
  if (guest(t) === "darwin") return "darwin";
  if (guest(t) === "unix") return "unix";
  const n = native(t.replace(/^file:\/\//i, ""));
  if (n.kind === "win") return "win";
  if (n.kind === "mac") return "darwin";
  return "nix";
}

export function handle(raw: string): Open {
  const href = peel(raw);
  const ext = extOf(href);
  const habitat = sniff(href);
  const ua = UA[habitat];
  if (/^https?:\/\//i.test(href) || /^www\./i.test(href) || href.endsWith(".onion") || WEB.has(ext) || PIC.has(ext)) {
    return {
      habitat: habitat === "web" ? "web" : habitat,
      app: "ghostwalk",
      how: "browse",
      href,
      ext,
      browse: true,
      ua,
      say: "GhostWalk. Trackers drop. It morphs to the machine it is on.",
    };
  }
  if (habitat === "darwin") {
    return { habitat, app: "crapple", how: "crapple", href, ext, browse: false, ua, say: "GhostWalk hands this to Crapple. Darwin window." };
  }
  if (habitat === "unix") {
    return { habitat, app: "unix", how: "unix", href, ext, browse: false, ua, say: "GhostWalk hands this to Unix. Second window." };
  }
  const go = plan(href);
  const winBin = /\.(exe|msi|bat|cmd|ps1|dll|lnk)$/i.test(href);
  const nixBin = /^\/(usr\/)?(local\/)?s?bin\//.test(href) || /\.(desktop|appimage|elf|so)$/i.test(href);
  if (go.how === "wine-staging" && !winBin) {
    return { habitat, app: "ghostwalk", how: "none", href, ext, browse: false, ua, say: "" };
  }
  if (go.how === "native" && !nixBin) {
    return { habitat, app: "ghostwalk", how: "none", href, ext, browse: false, ua, say: "" };
  }
  return {
    habitat,
    app: "ghostwalk",
    how: go.how,
    href,
    ext,
    browse: false,
    ua,
    say: `GhostWalk morphs to ${habitat}. ${go.note}`,
  };
}

export function wantsBrowse(text: string) {
  const t = peel(text);
  if (!t) return false;
  if (/^(https?:\/\/|www\.|file:\/\/)/i.test(t)) return true;
  if (/\.(html?|pdf|svg)$/i.test(t)) return true;
  if (/\b(browse|ghostwalk|browser)\b/i.test(text)) return true;
  return handle(t).browse;
}
