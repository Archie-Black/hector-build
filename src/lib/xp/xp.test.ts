import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dnaHints, lessonsForJob, logExec, markAgent, noteLesson, watchHuman, xpContext } from "./experience.ts";

describe("experiential memory", () => {
  it("keeps a correction forever", () => {
    noteLesson({ mistake: "moment()", fix: "Temporal.Now.instant()", where: "dates", from: "user" });
    const hit = lessonsForJob("format a date with moment").join(" ");
    assert.match(hit, /Temporal/);
    assert.match(xpContext("dates"), /Don't moment/);
  });

  it("only treats survivors as working, and learns DNA from human edits", () => {
    logExec("add hello", { done: false, fail: 1, tests: [{ name: "t", pass: false }], lints: [], stubs: [{ path: "a.ts", line: 1, hit: "TODO" }], note: "open" }, { "a.ts": "TODO" });
    logExec("add hello", { done: true, fail: 0, tests: [{ name: "t", pass: true }], lints: [], stubs: [], note: "HOLD" }, { "a.ts": "export const x = 1" });
    markAgent({ "src/a.ts": "function run() {\n  return fetch('/x').then(r => r.json())\n}\n" });
    watchHuman({
      "src/a.ts": "const run = async () => {\n  if (!ok) return\n  return await fetch('/x')\n}\n",
    });
    assert.match(dnaHints(), /async\/await|early returns|arrow/i);
  });
});
