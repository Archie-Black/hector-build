import { diffsFrom } from "./diffs";

export function isHelloJob(prompt: string) {
  return /hello function|add a hello|hello\(\)/i.test(prompt) && /main\.py/i.test(prompt);
}

export function localPlanText() {
  return [
    "PLAN (local, LIVE — no model required for this demo)",
    "1. demo/main.py — add hello() and call it from main()",
    "2. demo/README.md — document hello()",
    "3. demo/HASHES.md — write SHA-256 after apply",
    "Commands: none (workspace files only)",
    "Risks: none. Small diff. Scope locked to demo/",
    "Spend guess: 1",
  ].join("\n");
}

export function localApply(files: Record<string, string>) {
  const next = { ...files };
  const py = next["demo/main.py"] ?? "";
  if (!py.includes("def hello")) {
    next["demo/main.py"] = [
      "def hello():",
      '    return "hello"',
      "",
      "def main():",
      "    print(hello())",
      "",
      'if __name__ == "__main__":',
      "    main()",
      "",
    ].join("\n");
  }
  const readme = next["demo/README.md"] ?? "";
  if (!readme.includes("hello()")) {
    next["demo/README.md"] = readme.trimEnd() + "\n\n`hello()` returns the greeting string.\n";
  }
  next["demo/HASHES.md"] = "# hashes\n\nFilled after apply.\n";
  return { files: next, diffs: diffsFrom(files, next) };
}
