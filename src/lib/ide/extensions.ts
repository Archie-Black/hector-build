export type HxExtension = {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  builtin: boolean;
  enabled: boolean;
};

export const BUILTIN_EXTENSIONS: HxExtension[] = [
  {
    id: "spectral-hx.lattice",
    name: "Lattice Search",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "Geometric working-set search. Next-gen index, not grep.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.knot",
    name: "KnotNest IR",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "Braid / Jones / Alexander tools in the coding floor.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.host-chat",
    name: "Hector Host Chat",
    publisher: "Hector Build",
    version: "1.0.0",
    description: "Host intelligence in the IDE. Delegates to Spectral HX.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.git",
    name: "Git",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "Source control for the workspace. Native Electron uses the host git.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.debug",
    name: "Run and Debug",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "Breakpoints, call stack, debug console. DAP-shaped.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.python",
    name: "Python",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "Monaco Python language + test runner.",
    builtin: true,
    enabled: true,
  },
  {
    id: "spectral-hx.typescript",
    name: "TypeScript / JavaScript",
    publisher: "Spectral HX",
    version: "1.0.0",
    description: "VS Code Monaco TS/JS with workers.",
    builtin: true,
    enabled: true,
  },
];

const KEY = "hx.extensions.enabled";

export function loadEnabled(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveEnabled(map: Record<string, boolean>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export type OxvsHit = {
  name: string;
  namespace: string;
  version: string;
  description: string;
  files?: { download?: string };
};

export async function searchOpenVsx(query: string): Promise<OxvsHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://open-vsx.org/api/-/search?query=${encodeURIComponent(q)}&size=12`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { extensions?: OxvsHit[] };
  return data.extensions ?? [];
}
