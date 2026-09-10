const DEFAULT_ROOTS = ["demo", "src", "README.md", "package.json", "AGENTS.md", "demo/HECTOR.md", ".hector"];

export function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function pathAllowed(path: string, allowlist: string[] = []) {
  const p = normalizePath(path);
  if (!p || p === "." || p === "/" || p.includes("..")) return false;
  const roots = [...DEFAULT_ROOTS, ...allowlist];
  return roots.some((r) => {
    const root = normalizePath(r);
    return p === root || p.startsWith(root + "/");
  });
}

export function mayDelete(path: string, files: Record<string, string>) {
  const p = normalizePath(path);
  if (!p || p === "README.md" || p === "demo/HECTOR.md" || p === "AGENTS.md") return false;
  if (Object.keys(files).length <= 1) return false;
  return true;
}
