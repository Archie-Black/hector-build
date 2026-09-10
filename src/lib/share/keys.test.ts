import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authorizeKey, ensureHostKey, fingerprintOf, generateIdentity, isAuthorizedKey, revokeKey } from "./keys.ts";

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
});
