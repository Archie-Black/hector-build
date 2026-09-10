import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prove } from "./prove.ts";

describe("prove gate", () => {
  it("refuses done when a stub is in the tree", () => {
    const p = prove({ "src/a.ts": "export function f() { throw new Error('not implemented'); }\n" });
    assert.equal(p.done, false);
    assert.ok(p.stubs.length >= 1);
  });

  it("holds when the tree is clean enough", () => {
    const p = prove({ "src/ok.ts": "export const n = 1;\n" });
    assert.equal(p.stubs.length, 0);
  });
});
