import { native } from "./vfs";

export type Bin = "win" | "elf" | "script" | "unknown";

export function classify(file: string): Bin {
  const n = native(file);
  const f = file.toLowerCase();
  if (n.kind === "win" || /\.(exe|msi|dll|bat|cmd|ps1)$/.test(f) || f.includes("\\")) return "win";
  if (/\.(so|elf)$/.test(f) || f.startsWith("/usr/") || f.startsWith("/bin/")) return "elf";
  if (/\.(sh|py|js|ts)$/.test(f)) return "script";
  return "unknown";
}

export type Launch = { ok: boolean; bin: Bin; how: string; note: string };

/** One desk. Wine-staging for Windows, native for Linux. User does not pick. */
export function plan(file: string): Launch {
  const bin = classify(file);
  if (bin === "win") {
    return { ok: true, bin, how: "wine-staging", note: "Windows program. Runs here like it belongs." };
  }
  if (bin === "elf") {
    return { ok: true, bin, how: "native", note: "Linux program. Runs here like it belongs." };
  }
  if (bin === "script") {
    return { ok: true, bin, how: "host", note: "Script. Same desk." };
  }
  return { ok: false, bin, how: "none", note: "I do not know this file yet." };
}
