import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Enclave } from "./enclave.ts";
import { ctEq, wipe } from "./ct.ts";
import { padToBucket, unpad } from "./morph.ts";
import { wrap, unwrap } from "./vectors.ts";
import { Riv } from "./riv.ts";

describe("chimera", () => {
  it("compares in constant time and wipes", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    const c = new Uint8Array([1, 2, 4]);
    assert.equal(ctEq(a, b), true);
    assert.equal(ctEq(a, c), false);
    wipe(a);
    assert.equal(a[0], 0);
  });

  it("seals, mutates, and rejects a bad tag with a decoy", async () => {
    const enc = new Enclave(new Uint8Array(32).fill(7));
    const msg = new TextEncoder().encode("grant");
    const wire = await wrap(enc, "grpc", msg);
    const ok = await unwrap(enc, "grpc", wire);
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(new TextDecoder().decode(ok.plain), "grant");
    wire.tag = "00";
    const bad = await unwrap(enc, "rest", wire);
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.ok(bad.decoy.length > 8);
  });

  it("pads to a bucket and restores", () => {
    const p = new Uint8Array([9, 8, 7]);
    assert.equal(unpad(padToBucket(p))[0], 9);
  });

  it("pins integrity", async () => {
    const riv = new Riv();
    await riv.pin([{ name: "core", bytes: new TextEncoder().encode("ok") }]);
    assert.equal((await riv.check()).ok, true);
  });
});
