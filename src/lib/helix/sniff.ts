/** What we have. Not a guess. */

export type Kind = "pe" | "elf" | "mach" | "source" | "script" | "unknown";
export type Face = "win" | "linux" | "mac" | "any";

const SRC = [
  "cmakelists.txt",
  "meson.build",
  "makefile",
  "cargo.toml",
  "package.json",
  "pyproject.toml",
  "go.mod",
  "configure.ac",
  ".sln",
  ".vcxproj",
  ".csproj",
];

export function kind(path: string): Kind {
  const f = path.toLowerCase();
  if (SRC.some((s) => f.endsWith(s) || f.includes(`/${s}`) || f.includes(`\\${s}`))) return "source";
  if (/\.(exe|dll|msi|sys)$/.test(f) || /^[a-z]:[\\/]/i.test(path)) return "pe";
  if (/\.(so|elf|appimage)$/.test(f) || f.startsWith("/usr/") || f.startsWith("/bin/")) return "elf";
  if (/\.(app|dmg)$/.test(f) || f.includes("/applications/")) return "mach";
  if (/\.(py|js|ts|sh|ps1)$/.test(f)) return "script";
  return "unknown";
}

export function fromOf(path: string): Face {
  const k = kind(path);
  if (k === "pe") return "win";
  if (k === "elf") return "linux";
  if (k === "mach") return "mac";
  return "any";
}

export function wantTo(text: string, path: string): Face {
  if (/\b(to linux|for linux|as linux|on linux)\b/i.test(text)) return "linux";
  if (/\b(to windows|for windows|as windows|on windows|to win)\b/i.test(text)) return "win";
  if (/\b(to mac|for mac|darwin)\b/i.test(text)) return "mac";
  const from = fromOf(path);
  if (from === "win") return "linux";
  if (from === "linux") return "win";
  return "linux";
}

export function peel(text: string) {
  return text
    .replace(/^(convert|helix|turn|port|make)\s+/i, "")
    .replace(/\s+(to|for|on)\s+(linux|windows|win|mac).*$/i, "")
    .replace(/^(this|it)\s+/i, "")
    .trim();
}
