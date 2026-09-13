import { describe, expect, it } from "vitest";
import { act, learn, resetRl, reward } from "./rl";

describe("Hector RL", () => {
  it("learns to pick the faster metal for a job", () => {
    resetRl();
    for (let i = 0; i < 12; i++) {
      learn("vision", "cuda", reward(40, true), "vision");
      learn("vision", "rdna", reward(4, true), "vision");
    }
    expect(act("vision", false)).toBe("rdna");
  });

  it("still tries an unseen queue first", () => {
    resetRl();
    learn("step", "rdna", reward(5, true), "step");
    const a = act("step", true);
    expect(a === "cuda" || a === "vulkan").toBe(true);
  });
});
