import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lookAhead } from "./look-ahead.ts";

describe("look-ahead spool", () => {
  it("always warms the core path", () => {
    const lanes = lookAhead("");
    assert.deepEqual(lanes, ["core", "git", "term", "model"]);
  });

  it("starts chrome and tests before the agent asks", () => {
    const lanes = lookAhead("open chrome and run npm test on the site");
    assert.ok(lanes.includes("browser"));
    assert.ok(lanes.includes("build"));
  });

  it("does not spool onion for a local button fix", () => {
    const lanes = lookAhead("fix the login button color");
    assert.equal(lanes.includes("onion"), false);
    assert.ok(lanes.includes("git"));
  });

  it("spools ssh when the user mentions a remote host", () => {
    assert.ok(lookAhead("ssh into the other bot and git status").includes("ssh"));
  });
});
