import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allowCert, classifyHost, isolationHeaders, isSafeSlug } from "./isolate.ts";
import { slugFromHost } from "./names.ts";
import { publish, unpublish } from "./site.ts";

describe("subdomain isolation", () => {
  it("puts user builds in the build zone only", () => {
    assert.equal(classifyHost("maze.build.doomchat.ca").kind, "user");
    assert.equal(classifyHost("maze.build.doomchat.ca").slug, "maze");
    assert.equal(classifyHost("www.doomchat.ca").kind, "apex");
    assert.equal(classifyHost("hx.doomchat.ca").kind, "service");
    assert.equal(classifyHost("maze.doomchat.ca").kind, "unknown");
    assert.equal(classifyHost("evil.www.doomchat.ca").kind, "nested");
    assert.equal(slugFromHost("maze.build.doomchat.ca"), "maze");
    assert.equal(slugFromHost("maze.doomchat.ca"), "");
  });

  it("rejects punycode and reserved slugs", () => {
    assert.equal(isSafeSlug("xn--pple-43d"), false);
    assert.equal(isSafeSlug("www"), false);
    assert.equal(isSafeSlug("build"), false);
    assert.equal(isSafeSlug("ok-maze"), true);
  });

  it("issues certs only for published user origins", () => {
    const site = publish({ slug: "iso-cert-test", title: "iso", files: { "index.html": "<p>x</p>" }, access: "public" });
    assert.equal(allowCert("iso-cert-test.build.doomchat.ca"), true);
    assert.equal(allowCert("nope.build.doomchat.ca"), false);
    assert.equal(allowCert("iso-cert-test.doomchat.ca"), false);
    assert.ok(isolationHeaders("user")["cross-origin-opener-policy"]);
    unpublish(site.slug);
  });
});
