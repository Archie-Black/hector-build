export const SEED_README = `# Scar Ledger

Doomchat credit lattice. This is a complete working package, not a sketch.

Hector Build uses this workspace to finish real jobs: features, tests, and clean files.

## Layout

- \`src/ledger.js\` — add, clamp, scar density
- \`src/format.js\` — display lines
- \`src/policy.js\` — write / refuse gates
- \`src/session.js\` — open a lattice session
- \`src/index.js\` — public surface
- \`*.test.js\` — harness checks (call \`report\`)
`;

export const SEED_PACKAGE = `{
  "name": "scar-ledger",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Doomchat scar ledger — complete lattice math and policy."
}
`;

export const SEED_LEDGER = `/** Doomchat lattice ledger — keep this module side-effect free. */

export function add(left, right) {
  return left + right;
}

export function clampTau(value) {
  if (value <= 0) return 0.01;
  if (value >= 1) return 0.99;
  return value;
}

export function scarDensity(writes, refuses) {
  return writes * 2 + refuses;
}
`;

export const SEED_FORMAT = `export function formatLedgerLine(name, amount) {
  const sign = amount >= 0 ? "+" : "";
  return name + " " + sign + String(amount);
}

export function formatSession(id, tau) {
  return "session " + id + " tau=" + String(tau);
}
`;

export const SEED_POLICY = `export function mayWrite(granted, scout) {
  return Boolean(granted) && !scout;
}

export function refuseReason(granted, scout) {
  if (!granted) return "Waiting for the human to allow work.";
  if (scout) return "Scout looks only. Nothing is rewritten.";
  return "";
}
`;

export const SEED_SESSION = `import { clampTau } from "./ledger.js";
import { formatSession } from "./format.js";

export function openSession(id, tau) {
  const safe = clampTau(tau);
  return {
    id: String(id),
    tau: safe,
    line: formatSession(id, safe),
  };
}
`;

export const SEED_INDEX = `export { add, clampTau, scarDensity } from "./ledger.js";
export { formatLedgerLine, formatSession } from "./format.js";
export { mayWrite, refuseReason } from "./policy.js";
export { openSession } from "./session.js";
`;

export const SEED_LEDGER_TESTS = `report({
  name: "add combines credits",
  pass: add(4, 9) === 13,
  detail: "add(4, 9) => " + String(add(4, 9)),
});

report({
  name: "add is commutative",
  pass: add(2, 5) === add(5, 2),
  detail: "order should not matter",
});

report({
  name: "clampTau stays inside (0, 1)",
  pass: clampTau(0) > 0 && clampTau(1) < 1 && clampTau(0.4) === 0.4,
  detail: "bounds are exclusive of 0 and 1",
});

report({
  name: "scarDensity counts writes harder than refuses",
  pass: scarDensity(3, 1) === 7,
  detail: "3*2 + 1",
});
`;

export const SEED_POLICY_TESTS = `report({
  name: "writes need a grant",
  pass: mayWrite(false, false) === false && mayWrite(true, false) === true,
  detail: "grant is the gate",
});

report({
  name: "scout never writes",
  pass: mayWrite(true, true) === false,
  detail: "look-only",
});
`;

export const SEED_SESSION_TESTS = `report({
  name: "openSession clamps tau",
  pass: openSession("helix", 2).tau === 0.99,
  detail: String(openSession("helix", 2).tau),
});

report({
  name: "openSession formats a line",
  pass: openSession("helix", 0.4).line.indexOf("helix") !== -1,
  detail: openSession("helix", 0.4).line,
});
`;

export function seedFiles(): Record<string, string> {
  return {
    "AGENTS.md": `# Spectral HX

This workspace is granted to Spectral HX inside Hector Build.

- Finish the whole job. No stubs.
- Read before write.
- Keep tests. Never delete them to pass.
- Ask again only for a new repo or unapproved software.
`,
    "README.md": SEED_README,
    "package.json": SEED_PACKAGE,
    "src/index.js": SEED_INDEX,
    "src/ledger.js": SEED_LEDGER,
    "src/format.js": SEED_FORMAT,
    "src/policy.js": SEED_POLICY,
    "src/session.js": SEED_SESSION,
    "src/ledger.test.js": SEED_LEDGER_TESTS,
    "src/policy.test.js": SEED_POLICY_TESTS,
    "src/session.test.js": SEED_SESSION_TESTS,
    "demo/README.md": `# Demo

Sample workspace for Hector Build.

Try: add a hello function to main.py
`,
    "demo/main.py": `def main():
    print("hector")

if __name__ == "__main__":
    main()
`,
    "demo/HECTOR.md": `You are Hector Build, the host intelligence.
Grok is your assistant when a key is present.
Spectral HX plans, applies, and files under you.
After Approve, execute the plan. Do not lecture.
Do not expand scope. File a hash. Prefer small diffs.
You are not Cursor. You are not Grok Bot.
`,
  };
}
