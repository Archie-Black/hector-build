export type TreeNode = {
  name: string;
  path: string;
  kind: "file" | "dir";
  kids?: TreeNode[];
};

export function nestPaths(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of [...paths].sort()) {
    const parts = path.split("/").filter(Boolean);
    let level = root;
    let prefix = "";
    parts.forEach((part, i) => {
      prefix = prefix ? `${prefix}/${part}` : part;
      const file = i === parts.length - 1;
      let node = level.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path: prefix, kind: file ? "file" : "dir", kids: file ? undefined : [] };
        level.push(node);
      }
      if (!file) level = node.kids ?? (node.kids = []);
    });
  }
  return root;
}

export function langOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "JavaScript",
    ts: "TypeScript",
    tsx: "TSX",
    py: "Python",
    md: "Markdown",
    json: "JSON",
    css: "CSS",
    html: "HTML",
    sql: "SQL",
    sh: "Shell",
  };
  return map[ext] ?? (ext.toUpperCase() || "Text");
}

export function searchFiles(files: Record<string, string>, q: string, cap = 40) {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits: { path: string; line: number; text: string }[] = [];
  for (const [path, content] of Object.entries(files)) {
    content.split("\n").forEach((text, i) => {
      if (hits.length >= cap) return;
      if (text.toLowerCase().includes(needle)) hits.push({ path, line: i + 1, text: text.trim().slice(0, 120) });
    });
  }
  return hits;
}

export function lineCol(value: string, index: number) {
  const slice = value.slice(0, Math.max(0, index));
  const lines = slice.split("\n");
  return { line: lines.length, col: (lines[lines.length - 1] ?? "").length + 1 };
}

export function unifiedDiff(before: string, after: string, cap = 48) {
  const a = before.split("\n");
  const b = after.split("\n");
  const rows: { tag: "same" | "add" | "del"; text: string }[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && rows.length < cap; i++) {
    if (a[i] === b[i]) {
      if (a[i] !== undefined) rows.push({ tag: "same", text: a[i] });
    } else {
      if (a[i] !== undefined) rows.push({ tag: "del", text: a[i] });
      if (b[i] !== undefined) rows.push({ tag: "add", text: b[i] });
    }
  }
  return rows;
}
