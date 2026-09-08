export type GrepHit = {
  path: string;
  line: number;
  text: string;
};

export function listFilePaths(files: Record<string, string>): string[] {
  return Object.keys(files).sort();
}

export function globFiles(files: Record<string, string>, pattern: string): string[] {
  const re = globToRegExp(pattern);
  return Object.keys(files)
    .filter((p) => re.test(p) || re.test(p.split("/").pop() ?? p))
    .sort();
}

export function grepFiles(
  files: Record<string, string>,
  query: string,
  regex = false,
  maxHits = 80,
): GrepHit[] {
  const hits: GrepHit[] = [];
  let cre: RegExp | null = null;
  if (regex) {
    try {
      cre = new RegExp(query);
    } catch {
      return [{ path: "(grep)", line: 0, text: "Invalid regular expression" }];
    }
  }
  for (const [path, content] of Object.entries(files)) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const found = cre ? cre.test(line) : line.includes(query);
      if (!found) continue;
      hits.push({ path, line: i + 1, text: line.slice(0, 240) });
      if (hits.length >= maxHits) return hits;
    }
  }
  return hits;
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DS::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DS::/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + escaped + "$");
}
