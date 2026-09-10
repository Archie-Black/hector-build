import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { geoLane, geoPack, geoUser, pickLaneModel } from "./pair.ts";

describe("geometric 7b/14b pair", () => {
  it("scouts on 7B and collapses writes onto 14B", () => {
    assert.equal(geoLane("what is in src?", "scout"), "fast");
    assert.equal(geoLane("implement the kvm grab", "patch"), "best");
    assert.equal(geoLane("look around", "swarm", [{ name: "write_file" }]), "best");
    assert.equal(pickLaneModel("fast", "qwen2.5-coder:7b", "qwen2.5-coder:14b"), "qwen2.5-coder:7b");
    assert.equal(pickLaneModel("best", "qwen2.5-coder:7b", "qwen2.5-coder:14b"), "qwen2.5-coder:14b");
  });

  it("packs the collapsed lattice into the user turn", () => {
    const files = {
      "src/lib/kvm/mach.ts": "export function machSend() { return 1 }",
      "README.md": "hello world",
    };
    const pack = geoPack(files, "mach send rights");
    assert.ok(pack.text.includes("geo W="));
    assert.ok(pack.paths.length >= 1);
    const user = geoUser(files, "fix machSend");
    assert.ok(user.includes("fix machSend"));
    assert.ok(user.includes("geo W="));
  });
});
