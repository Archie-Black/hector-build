export type SymbolKind = "fn" | "class" | "const" | "import" | "type";

export type SymbolHit = {
  name: string;
  kind: SymbolKind;
  path: string;
  line: number;
  col: number;
  text: string;
};

export type Lint = {
  path: string;
  line: number;
  col: number;
  message: string;
  severity: "error" | "warning";
};

const DEF_RE =
  /(?:(?:export\s+)?(?:async\s+)?function\s+|export\s+class\s+|class\s+|def\s+|export\s+(?:const|let|var|type|interface|enum)\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/g;

const IMPORT_RE = /(?:from\s+|import\s+|require\()['"]([^'"]+)['"]/g;

function lineCol(text: string, index: number) {
  let line = 1;
  let last = 0;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") {
      line++;
      last = i + 1;
    }
  }
  return { line, col: index - last + 1 };
}

export function indexSymbols(files: Record<string, string>): SymbolHit[] {
  const out: SymbolHit[] = [];
  for (const [path, text] of Object.entries(files)) {
    DEF_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = DEF_RE.exec(text))) {
      const { line, col } = lineCol(text, m.index);
      const kind: SymbolKind = /class/.test(m[0])
        ? "class"
        : /function|def\s/.test(m[0])
          ? "fn"
          : /type|interface/.test(m[0])
            ? "type"
            : "const";
      const end = text.indexOf("\n", m.index);
      out.push({
        name: m[1],
        kind,
        path,
        line,
        col,
        text: text.slice(m.index, end === -1 ? m.index + 80 : end).slice(0, 120),
      });
    }
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(text))) {
      const { line, col } = lineCol(text, m.index);
      out.push({
        name: m[1],
        kind: "import",
        path,
        line,
        col,
        text: m[0],
      });
    }
  }
  return out;
}

export function findDefinition(files: Record<string, string>, name: string, fromPath?: string): SymbolHit | null {
  const all = indexSymbols(files);
  const exact = all.filter((s) => s.name === name && s.kind !== "import");
  if (fromPath) {
    const local = exact.find((s) => s.path === fromPath);
    if (local) return local;
  }
  return exact[0] ?? all.find((s) => s.name === name) ?? null;
}

export function findReferences(files: Record<string, string>, name: string): SymbolHit[] {
  const hits: SymbolHit[] = [];
  const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  for (const [path, text] of Object.entries(files)) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const { line, col } = lineCol(text, m.index);
      hits.push({ name, kind: "const", path, line, col, text: text.split("\n")[line - 1] ?? name });
      if (hits.length >= 80) return hits;
    }
  }
  return hits;
}

export function renameSymbol(files: Record<string, string>, name: string, next: string): Record<string, string> {
  if (!/^[A-Za-z_$][\w$]*$/.test(name) || !/^[A-Za-z_$][\w$]*$/.test(next) || name === next) return files;
  const re = new RegExp(`\\b${name}\\b`, "g");
  const out = { ...files };
  for (const [path, text] of Object.entries(files)) {
    if (re.test(text)) out[path] = text.replace(re, next);
    re.lastIndex = 0;
  }
  return out;
}

function unmatched(text: string, open: string, close: string): number {
  let n = 0;
  let inStr = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\" ) {
        i++;
        continue;
      }
      if (c === inStr) inStr = "";
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      inStr = c;
      continue;
    }
    if (c === open) n++;
    else if (c === close) n--;
    if (n < 0) return i;
  }
  return n === 0 ? -1 : text.length - 1;
}

export function diagnostics(files: Record<string, string>): Lint[] {
  const lints: Lint[] = [];
  const symbols = indexSymbols(files);
  for (const [path, text] of Object.entries(files)) {
    if (!/\.(js|ts|tsx|jsx|mjs|cjs|py|json)$/.test(path)) continue;
    if (path.endsWith(".json")) {
      try {
        JSON.parse(text);
      } catch (err) {
        lints.push({ path, line: 1, col: 1, message: String(err).slice(0, 120), severity: "error" });
      }
      continue;
    }
    for (const [o, c] of [
      ["{", "}"],
      ["(", ")"],
      ["[", "]"],
    ] as const) {
      const at = unmatched(text, o, c);
      if (at >= 0) {
        const { line, col } = lineCol(text, at);
        lints.push({ path, line, col, message: `Unmatched ${o}${c}`, severity: "error" });
      }
    }
    IMPORT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = IMPORT_RE.exec(text))) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue;
      const dir = path.split("/").slice(0, -1).join("/");
      const resolved = normalizeRel(dir, spec);
      const exists = Object.keys(files).some(
        (p) => p === resolved || p.startsWith(resolved + ".") || p === resolved + "/index.ts" || p === resolved + "/index.js",
      );
      if (!exists) {
        const { line, col } = lineCol(text, m.index);
        lints.push({ path, line, col, message: `Missing import ${spec}`, severity: "warning" });
      }
    }
  }
  const seen = new Map<string, SymbolHit>();
  for (const s of symbols) {
    if (s.kind === "import") continue;
    const key = `${s.path}:${s.name}:${s.kind}`;
    if (seen.has(key)) {
      lints.push({
        path: s.path,
        line: s.line,
        col: s.col,
        message: `Duplicate ${s.name}`,
        severity: "warning",
      });
    } else seen.set(key, s);
  }
  return lints.slice(0, 80);
}

function normalizeRel(dir: string, spec: string) {
  const parts = `${dir}/${spec}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

export function completeTokens(path: string, prefix: string, files: Record<string, string>): string[] {
  const needle = prefix.trim();
  if (needle.length < 1) return [];
  const names = indexSymbols(files)
    .map((s) => s.name)
    .filter((n) => n.startsWith(needle) && n !== needle);
  const local = (files[path] ?? "").match(/[A-Za-z_$][\w$]{2,}/g) ?? [];
  for (const n of local) if (n.startsWith(needle) && n !== needle) names.push(n);
  return [...new Set(names)].slice(0, 12);
}

export function formatFile(path: string, text: string): string {
  let next = text.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "");
  if (path.endsWith(".json")) {
    try {
      next = JSON.stringify(JSON.parse(next), null, 2) + "\n";
    } catch {
      /* keep */
    }
  }
  if (!next.endsWith("\n")) next += "\n";
  return next;
}
