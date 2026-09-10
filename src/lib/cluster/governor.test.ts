import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decide, pickDynModel } from "./governor.ts";
import { canHoldVram, PATRIOT } from "./profile.ts";
import { resetCeiling } from "./ceiling.ts";

describe("dynB 7/14", () => {
  it("scouts on 7B and pins 14B for the real job", () => {
    resetCeiling();
    const scout = decide({ mode: "scout", prompt: "open the file" });
    assert.equal(scout.class, "7");
    const work = decide({ mode: "patch", prompt: "fix the kvm grab" });
    assert.equal(work.class, "14");
    assert.equal(work.keepAlive, "-1");
    assert.equal(work.pin, true);
  });

  it("mix is dynamic B, MoE if it fits, never 100B", () => {
    const mix = decide({ mode: "swarm", prompt: "implement the whole kvm map", names: ["qwen2.5-coder:14b"] });
    assert.equal(mix.class, "mix");
    const moe = decide({
      mode: "swarm",
      prompt: "implement",
      names: ["qwen2.5-coder:14b", "gpt-oss:20b"],
    });
    assert.equal(moe.class, "mix");
    const names = ["qwen2.5-coder:7b", "qwen2.5-coder:14b", "gpt-oss:20b"];
    assert.equal(pickDynModel(names, "7", "qwen2.5-coder:7b", "qwen2.5-coder:14b"), "qwen2.5-coder:7b");
    assert.equal(pickDynModel(names, "14", "qwen2.5-coder:7b", "qwen2.5-coder:14b"), "qwen2.5-coder:14b");
    assert.equal(pickDynModel(names, "mix", "qwen2.5-coder:7b", "qwen2.5-coder:14b"), "gpt-oss:20b");
    assert.equal(PATRIOT.vramGb, 16);
    assert.equal(canHoldVram(7), true);
    assert.equal(canHoldVram(14), true);
    assert.equal(canHoldVram(32), false);
    assert.equal(canHoldVram(100), false);
  });
});
