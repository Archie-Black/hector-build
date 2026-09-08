export function monacoLang(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    py: "python",
    md: "markdown",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    rs: "rust",
    go: "go",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    xml: "xml",
    svg: "xml",
  };
  return map[ext] ?? "plaintext";
}
