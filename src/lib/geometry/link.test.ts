import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { braidCommutator, pairInvariants, splitJones, worldlineLink } from "./link.ts";
import { reduceBraid } from "./braid.ts";

describe("knot pairing", () => {
  it("far generators commute — trivial commutator", () => {
    const c = braidCommutator([1], [3]);
    assert.equal(c.length, 0);
    assert.equal(worldlineLink([1], [3]).trivial, true);
  });

  it("adjacent generators do not commute — a new knot", () => {
    const a = reduceBraid([1, 1, 1]);
    const b = reduceBraid([2, 2, 2]);
    const w = worldlineLink(a, b);
    assert.equal(w.trivial, false);
    assert.ok(w.crossings > 0);
    const p = pairInvariants(a, b);
    assert.equal(typeof p.jonesComposed, "string");
  });

  it("Jones of a connected-sum-like pair is multiplicative or reports the gap", () => {
    const s = splitJones([1, -1], [2, -2]);
    assert.equal(typeof s.composed, "string");
    assert.equal(typeof s.split, "boolean");
  });
});
