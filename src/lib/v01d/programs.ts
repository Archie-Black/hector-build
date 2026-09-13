/** Programs folder. One name. One real path on Linux. One on Windows. */

import { APPS, type AppId } from "@/lib/horsemen/layout";
import { TOOLS } from "@/lib/hx/suite";

export const ROOT = "/v01d/programs";
export const WIN = "C:\\v01d\\programs";

export type Prog = {
  name: string;
  bin: string;
  linux: string;
  win: string;
  app?: AppId;
};

const EXTRA: Prog[] = [
  { name: "notepad.exe", bin: "notepad", linux: "/usr/bin/wine", win: `${WIN}\\notepad.exe` },
  { name: "vlc", bin: "vlc", linux: "/usr/bin/vlc", win: `${WIN}\\vlc.exe` },
  { name: "GhostWalk", bin: "ghostwalk", linux: `${ROOT}/GhostWalk`, win: `${WIN}\\GhostWalk.exe`, app: "ghostwalk" },
  { name: "GhostIT", bin: "ghostit", linux: `${ROOT}/GhostIT`, win: `${WIN}\\GhostIT.exe`, app: "notes" },
  { name: "Spectral HX", bin: "hx", linux: `${ROOT}/SpectralHX`, win: `${WIN}\\SpectralHX.exe`, app: "code" },
  { name: "Genesis HX Suite", bin: "genesis", linux: `${ROOT}/GenesisHX`, win: `${WIN}\\GenesisHX.exe`, app: "suite" },
  { name: "Portal 00:13", bin: "portal", linux: `${ROOT}/Portal0013`, win: `${WIN}\\Portal0013.exe`, app: "portal" },
  { name: "Linux room", bin: "wsl", linux: `${ROOT}/LinuxRoom`, win: `${WIN}\\wsl.exe`, app: "room" },
  { name: "Crapple", bin: "crapple", linux: `${ROOT}/Crapple`, win: `${WIN}\\Crapple.exe`, app: "crapple" },
  { name: "Asimov 01", bin: "asimov", linux: `${ROOT}/Asimov01`, win: `${WIN}\\Asimov01.exe`, app: "asimov" },
];

function nix(bin: string) {
  if (bin === "obs") return "/usr/bin/obs";
  if (bin === "comfyui") return "/opt/osv01d/suite/engine/ComfyUI/main.py";
  if (bin === "unreal") return "/opt/unreal/Engine/Binaries/Linux/UnrealEditor";
  if (bin === "penpot") return "/opt/osv01d/suite/penpot.sh";
  if (bin === "surge-xt") return "/usr/bin/surge-xt";
  return `/usr/bin/${bin}`;
}

function win(bin: string, title: string) {
  const safe = title.replace(/[^\w.-]+/g, "");
  return `${WIN}\\${safe || bin}.exe`;
}

export function catalog(): Prog[] {
  const suite: Prog[] = TOOLS.map((t) => ({
    name: t.title,
    bin: t.bin,
    linux: nix(t.bin),
    win: win(t.bin, t.title),
  }));
  const desk: Prog[] = APPS.filter((a) => a.desk && a.id !== "files" && a.id !== "programs" && a.id !== "trash").map((a) => ({
    name: a.title,
    bin: a.id,
    linux: `${ROOT}/${a.title.replace(/\s+/g, "")}`,
    win: win(a.id, a.title),
    app: a.id,
  }));
  const seen = new Set<string>();
  const out: Prog[] = [];
  for (const p of [...suite, ...desk, ...EXTRA]) {
    const k = p.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function findProg(q: string) {
  const t = q.trim().toLowerCase().replace(/^.*\//, "").replace(/\\/g, "/");
  return catalog().find(
    (p) =>
      p.name.toLowerCase() === t ||
      p.bin.toLowerCase() === t ||
      p.linux.toLowerCase().endsWith(`/${t}`) ||
      p.win.toLowerCase().replace(/\\/g, "/").endsWith(`/${t}`),
  );
}

export function folder() {
  return catalog().map((p) => ({ name: p.name, dir: false as const, run: p.linux, win: p.win }));
}
