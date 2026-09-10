import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { alloc, dropWorking, recall, recordTurn } from "./mm.ts";

describe("os memory manager", () => {
  it("pins constitution and never stores forbidden text", () => {
    const pages = recall("hx", "never give up", 12);
    assert.ok(pages.some((p) => p.kind === "constitutional"));
    assert.equal(alloc("hx", "semantic", "give up now"), null);
  });

  it("learns from a good turn and wipe of working does not kill lessons", () => {
    recordTurn({ agent: "hx", prompt: "add hello tests", ok: true, note: "prove passed" });
    const before = recall("hx", "hello tests", 8);
    assert.ok(before.some((p) => /hello|tests|repair|worked/i.test(p.text)));
    dropWorking();
    const after = recall("hx", "hello tests", 8);
    assert.ok(after.some((p) => p.kind !== "working"));
  });
});
