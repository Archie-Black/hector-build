import { diagnostics, type Lint } from "../ide/symbols.ts";
import { runWorkspaceTests } from "./run-tests.ts";

export type Proof = {
  done: boolean;
  fail: number;
  tests: { name: string; pass: boolean }[];
  lints: Lint[];
  stubs: { path: string; line: number; hit: string }[];
  note: string;
};

const STUB_RE = /\b(TODO|FIXME|NotImplemented|coming soon|not implemented|throw new Error\(\s*['"]STUB)/i;

export function scanStubs(files: Record<string, string>) {
  const out: Proof["stubs"] = [];
  for (const [path, text] of Object.entries(files)) {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (STUB_RE.test(line) && out.length < 40) {
        out.push({ path, line: i + 1, hit: line.trim().slice(0, 120) });
      }
    });
  }
  return out;
}

/** Other bots say “done”. This is the gate. */
export function prove(files: Record<string, string>): Proof {
  const tests = runWorkspaceTests(files).map((t) => ({ name: t.name, pass: t.pass }));
  const lints = diagnostics(files).filter((l) => l.severity === "error");
  const stubs = scanStubs(files);
  const fail = tests.filter((t) => !t.pass).length + lints.length + stubs.length;
  const done = fail === 0;
  return {
    done,
    fail,
    tests,
    lints,
    stubs,
    note: done ? "HOLD. Checks clear." : `${fail} still open. Not done.`,
  };
}

export function proofLine(p: Proof) {
  const tFail = p.tests.filter((t) => !t.pass).length;
  return `${p.note} tests ${p.tests.length - tFail}/${p.tests.length} · lints ${p.lints.length} · stubs ${p.stubs.length}`;
}
