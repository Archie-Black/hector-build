export type GitEntry = {
  path: string;
  status: "M" | "A" | "D" | "U";
};

export function gitStatus(head: Record<string, string> | null, files: Record<string, string>): GitEntry[] {
  const out: GitEntry[] = [];
  const keys = new Set([...Object.keys(head ?? {}), ...Object.keys(files)]);
  for (const path of [...keys].sort()) {
    const before = head?.[path];
    const after = files[path];
    if (before === after) continue;
    if (before === undefined) out.push({ path, status: "A" });
    else if (after === undefined) out.push({ path, status: "D" });
    else out.push({ path, status: "M" });
  }
  return out;
}

export type GitCommit = {
  id: string;
  message: string;
  at: number;
  files: number;
};

export function newCommitId() {
  return Math.random().toString(16).slice(2, 10);
}
