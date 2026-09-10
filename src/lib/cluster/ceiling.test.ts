import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lookUp, qualityOf, resetCeiling, seek } from "./ceiling.ts";
import type { Proof } from "../workspace/prove.ts";

const miss: Proof = { done: false, fail: 4, tests: [{ name: "a", pass: false }], lints: [], stubs: [], note: "miss" };
const win: Proof = { done: true, fail: 0, tests: [{ name: "a", pass: true }], lints: [], stubs: [], note: "ok" };

describe("ceiling", () => {
  it("scores a win above a miss and looks up after hunger", () => {
    resetCeiling();
    assert.ok(qualityOf(win, "14") > qualityOf(miss, "14"));
    for (let i = 0; i < 3; i++) seek({ prompt: "miss", proof: miss, klass: "14", files: { "a.ts": "" } });
    assert.equal(lookUp("14"), "mix");
    assert.equal(lookUp("7"), "7");
    const beat = seek({ prompt: "win", proof: win, klass: "mix", files: { "a.ts": "export const ok = 1" } });
    assert.ok(beat.quality >= 50);
  });
});
