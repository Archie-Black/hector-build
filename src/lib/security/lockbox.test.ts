import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { redactSecrets } from "./lockbox.ts";

describe("lockbox redact", () => {
  it("strips bearer and vendor keys", () => {
    const raw = "Bearer xai-abcdefghijklmnopqrstuv Authorization sk-abcdefghijklmnopqrstuv gsk_abcdefghijklmnop password=hunter2 -pw secret";
    const out = redactSecrets(raw);
    assert.equal(out.includes("xai-abc"), false);
    assert.equal(out.includes("sk-abc"), false);
    assert.ok(out.includes("***"));
    assert.equal(out.includes("hunter2"), false);
    assert.equal(out.includes("-pw secret"), false);
  });
});
