export type HxContribute = {
  commands?: { command: string; title: string }[];
  languages?: { id: string; extensions: string[] }[];
  geometric?: boolean;
};

export type HostExtension = {
  id: string;
  name: string;
  enabled: boolean;
  contribute: HxContribute;
};

type HxApi = {
  lattice: { search: (q: string) => void };
  knot: { encode: (s: string) => string };
  commands: { register: (id: string, fn: () => void) => void };
};

const registry = new Map<string, () => void>();

export function activateExtension(ext: HostExtension, api: HxApi) {
  if (!ext.enabled) return;
  for (const c of ext.contribute.commands ?? []) {
    registry.set(c.command, () => api.commands.register(c.command, () => undefined));
  }
}

export function runCommand(id: string) {
  registry.get(id)?.();
}

export const HOST_EXTENSIONS: HostExtension[] = [
  {
    id: "spectral-hx.lattice",
    name: "Lattice",
    enabled: true,
    contribute: { geometric: true, commands: [{ command: "hx.lattice.reindex", title: "Reindex lattice" }] },
  },
  {
    id: "spectral-hx.knot",
    name: "KnotNest",
    enabled: true,
    contribute: { geometric: true, commands: [{ command: "hx.knot.encode", title: "Encode selection" }] },
  },
  {
    id: "spectral-hx.dap",
    name: "DAP",
    enabled: true,
    contribute: { commands: [{ command: "hx.debug.start", title: "Start debugging" }] },
  },
  {
    id: "spectral-hx.git",
    name: "Git",
    enabled: true,
    contribute: { commands: [{ command: "hx.git.commit", title: "Commit" }] },
  },
  {
    id: "spectral-hx.tab",
    name: "Tab complete",
    enabled: true,
    contribute: { languages: [{ id: "typescript", extensions: [".ts", ".tsx", ".js"] }] },
  },
  {
    id: "spectral-hx.fathom",
    name: "Fathom",
    enabled: true,
    contribute: { geometric: true, commands: [{ command: "hx.fathom.audit", title: "Audit Code-OSS depth" }] },
  },
];

/** Minimal extension host. Not VS Code's process. Geometric API is the tangent. */
export function bootExtensionHost() {
  const api: HxApi = {
    lattice: { search: () => undefined },
    knot: { encode: (s) => s },
    commands: { register: (id, fn) => registry.set(id, fn) },
  };
  for (const ext of HOST_EXTENSIONS) activateExtension(ext, api);
  return { live: true, loaded: HOST_EXTENSIONS.length };
}
