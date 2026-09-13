import { native } from "./vfs";
import { guest, planMac } from "./crapple";
import { findProg } from "./programs";

export type Bin = "win" | "elf" | "mach" | "unix" | "script" | "unknown";

export function classify(file: string): Bin {
  const g = guest(file);
  if (g === "darwin") return "mach";
  if (g === "unix") return "unix";
  const n = native(file);
  const f = file.toLowerCase();
  if (n.kind === "win" || /\.(exe|msi|dll|bat|cmd|ps1)$/.test(f) || f.includes("\\")) return "win";
  if (/\.(so|elf)$/.test(f) || f.startsWith("/usr/") || f.startsWith("/bin/") || f.startsWith("/opt/") || f.startsWith("/v01d/programs/")) return "elf";
  if (/\.(sh|py|js|ts)$/.test(f)) return "script";
  return "unknown";
}

export type Launch = { ok: boolean; bin: Bin; how: string; note: string; path: string };

/** One desk for Windows and Linux files. Crapple for Mac. Unix is the second window. */
export function plan(file: string): Launch {
  const hit = findProg(file);
  const path = hit ? hit.linux : native(file).path;
  const bin = classify(hit?.linux || file);
  if (hit?.app) {
    return { ok: true, bin: "script", how: `v01d://app/${hit.app}`, note: `Opens ${hit.name} on this desk.`, path: hit.linux };
  }
  if (hit) {
    return {
      ok: true,
      bin,
      how: hit.linux,
      note: `Runs ${hit.name} from ${hit.linux}. Windows twin: ${hit.win}.`,
      path: hit.linux,
    };
  }
  if (bin === "mach" || bin === "unix") {
    const m = planMac(file);
    return { ok: m.ok, bin, how: m.how, note: m.note, path };
  }
  if (bin === "win") {
    return { ok: true, bin, how: "wine-staging", note: "Windows program. Runs here like it belongs.", path };
  }
  if (bin === "elf") {
    return { ok: true, bin, how: path, note: "Linux program. Runs here like it belongs.", path };
  }
  if (bin === "script") {
    return { ok: true, bin, how: "host", note: "Script. Same desk.", path };
  }
  return { ok: false, bin, how: "none", note: "I do not know this file yet.", path };
}
