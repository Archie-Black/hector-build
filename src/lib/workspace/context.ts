const RULE_FILES = ["AGENTS.md", "HECTOR.md", ".hector.md", "SPECTRAL.md", ".cursorrules"];

export function mentionedPaths(prompt: string, files: Record<string, string>): string[] {
  const found: string[] = [];
  const re = /@([\w./-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt))) {
    const raw = m[1];
    const hit = Object.keys(files).find((p) => p === raw || p.endsWith("/" + raw) || p.endsWith(raw));
    if (hit) found.push(hit);
  }
  return [...new Set(found)].slice(0, 8);
}

export function workspaceRules(files: Record<string, string>): string {
  const chunks: string[] = [];
  for (const name of RULE_FILES) {
    const path = Object.keys(files).find((p) => p === name || p.endsWith("/" + name));
    if (!path) continue;
    chunks.push(`# ${path}\n${files[path].slice(0, 2500)}`);
  }
  return chunks.join("\n\n");
}

export function attachFiles(files: Record<string, string>, paths: string[], cap = 2400): string {
  return paths
    .filter((p) => files[p] !== undefined)
    .map((p) => `FILE ${p}\n\`\`\`\n${files[p].slice(0, cap)}\n\`\`\``)
    .join("\n\n");
}
