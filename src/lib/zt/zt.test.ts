import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bootZt, decide, issueGrant } from "./zero.ts";

describe("zero trust", () => {
  it("denies anonymous and metadata", () => {
    assert.equal(decide({ who: { id: "x", kind: "anon" }, verb: "dial", resource: "ssh", loc: "127.0.0.1" }).allow, false);
    assert.equal(decide({ who: { id: "bot", kind: "bot" }, verb: "dial", resource: "ssh", loc: "169.254.1.1" }).allow, false);
  });

  it("does not trust LAN for bots without a grant", () => {
    const d = decide({ who: { id: "zt-lan-bot", kind: "bot" }, verb: "dial", resource: "ssh", loc: "192.168.1.10" });
    assert.equal(d.allow, false);
    assert.match(d.reason, /lan is not trust/);
  });

  it("allows loopback, onion, human, and a live grant", () => {
    assert.equal(decide({ who: { id: "hx", kind: "bot" }, verb: "dial", resource: "ssh", loc: "127.0.0.1" }).allow, true);
    assert.equal(decide({ who: { id: "you", kind: "human" }, verb: "dial", resource: "ssh", loc: "192.168.1.10" }).allow, true);
    issueGrant({ principal: "war", resource: "192.168.1.10", verb: "dial", ttlMs: 60_000 });
    assert.equal(decide({ who: { id: "war", kind: "bot" }, verb: "dial", resource: "ssh", loc: "192.168.1.10" }).allow, true);
  });

  it("kernel may exec the stack after boot grants", () => {
    bootZt();
    assert.equal(decide({ who: { id: "netd", kind: "kernel" }, verb: "exec", resource: "stack" }).allow, true);
    assert.equal(decide({ who: { id: "war", kind: "bot" }, verb: "exec", resource: "stack" }).allow, false);
  });
});
