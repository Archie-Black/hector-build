import type { TestResult, ToolTrace } from "./types";

export function computeProgress(
  busy: boolean,
  traces: ToolTrace[],
  tests: TestResult[],
): number {
  if (!traces.length && !busy) return 0;
  const ok = traces.filter((t) => t.ok).length;
  const writes = traces.filter(
    (t) => t.ok && (t.name === "write_file" || t.name === "apply_patch"),
  ).length;
  const tested = traces.some((t) => t.name === "run_tests");
  const failing = tests.filter((t) => !t.pass).length;
  let n = 8;
  n += Math.min(40, ok * 8);
  n += Math.min(25, writes * 10);
  if (tested) n += failing ? 12 : 30;
  if (busy) n = Math.min(92, Math.max(n, 18));
  else if (failing === 0 && tested) n = 100;
  return Math.max(0, Math.min(100, n));
}
