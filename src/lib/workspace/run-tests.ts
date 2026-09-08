import type { TestResult } from "./types";

export function runWorkspaceTests(files: Record<string, string>): TestResult[] {
  const sources = Object.entries(files)
    .filter(([path]) => path.endsWith(".js") && !path.endsWith(".test.js"))
    .map(([, content]) =>
      content
        .replace(/export\s+\{[^}]*\}\s+from\s+["'][^"']+["'];?/g, "")
        .replace(/import\s+[^;]+;?/g, "")
        .replace(/export\s+function/g, "function")
        .replace(/export\s+\{[^}]*\}/g, ""),
    )
    .join("\n");

  const testBodies = Object.entries(files)
    .filter(([path]) => path.endsWith(".test.js"))
    .map(([, content]) => content)
    .join("\n");

  const results: TestResult[] = [];
  try {
    const runner = new Function("report", `"use strict";\n${sources}\n${testBodies}\n`);
    runner((row: TestResult) => {
      results.push({
        name: String(row.name ?? "unnamed"),
        pass: Boolean(row.pass),
        detail: String(row.detail ?? ""),
      });
    });
  } catch (error) {
    results.push({
      name: "harness",
      pass: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
  if (!results.length) {
    results.push({
      name: "harness",
      pass: false,
      detail: "No report() calls ran",
    });
  }
  return results;
}
