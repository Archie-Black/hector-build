import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authorizeKey, ensureHostKey, fingerprintOf, generateIdentity, isAuthorizedKey, maybeRotate, revokeKey, rotateIdentity, settleRotations } from "./keys.ts";
import { isolateTag } from "./onion.ts";

describe("ssh key management", () => {
  it("mints a host key and an identity", () => {
    const host = ensureHostKey();
    assert.ok(host.fingerprint.startsWith("SHA256:"));
    const id = generateIdentity("hx", "hx@test");
    assert.equal(id.user, "hx");
    assert.ok(id.public.startsWith("ssh-ed25519"));
    assert.equal(fingerprintOf(id.public), id.fingerprint);
    assert.equal(isAuthorizedKey(id.public), true);
  });

  it("authorizes a foreign public key and can revoke it", () => {
    const other = generateIdentity("peer", "peer@onion");
    const fp = authorizeKey(other.public, "peer");
    assert.equal(fp, other.fingerprint);
    assert.equal(revokeKey(other.fingerprint), true);
    assert.equal(isAuthorizedKey(other.public), false);
  });

  it("rotates with overlap then settles the previous key", () => {
    const first = generateIdentity("rot", "rot@a");
    const rotated = rotateIdentity("rot", Date.now());
    assert.notEqual(rotated.current.fingerprint, first.fingerprint);
    assert.equal(isAuthorizedKey(first.public), true);
    assert.equal(isAuthorizedKey(rotated.current.public), true);
    settleRotations(Date.now() + 25 * 60 * 60 * 1000);
    assert.equal(isAuthorizedKey(first.public), false);
    assert.equal(isAuthorizedKey(rotated.current.public), true);
  });

  it("maybeRotate is a no-op when the key is young", () => {
    const id = generateIdentity("young", "y@t");
    const again = maybeRotate("young", Date.now() + 1000);
    assert.equal(again.fingerprint, id.fingerprint);
  });

  it("isolates circuits per bot and host", () => {
    assert.notEqual(isolateTag("grok-build", "a.onion"), isolateTag("cursor", "a.onion"));
    assert.notEqual(isolateTag("hector", "a.onion"), isolateTag("hector", "b.onion"));
  });
});
