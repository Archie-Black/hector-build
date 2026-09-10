import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canView, publish, unpublish } from "./site.ts";
import { isPublishJob, slugFromHost } from "./names.ts";

describe("doomchat hosting", () => {
  it("maps slug.doomchat.ca like grok.me", () => {
    assert.equal(slugFromHost("maze.build.doomchat.ca"), "maze");
    assert.equal(slugFromHost("www.doomchat.ca"), "");
    assert.equal(slugFromHost("hx.doomchat.ca"), "");
    assert.equal(slugFromHost("maze.doomchat.ca"), "");
  });

  it("publishes a public build and serves it", () => {
    const site = publish({ slug: "hx-host-test", title: "Test", files: { "hello.html": "<h1>hi</h1>" }, access: "public" });
    assert.ok(site.wildcard.includes("hx-host-test.build.doomchat.ca"));
    assert.ok(site.path.includes("/h/hx-host-test"));
    const loaded = canView(site, undefined);
    assert.equal(loaded, true);
    unpublish(site.slug);
  });

  it("hears publish in plain language", () => {
    assert.equal(isPublishJob("publish this on doomchat"), true);
    assert.equal(isPublishJob("fix the login button"), false);
  });
});
