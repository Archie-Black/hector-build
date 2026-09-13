import { describe, expect, it } from "vitest";
import { evolveSplit, prefer, resetMetal, watch } from "./metal";

describe("Hector metal learning", () => {
  it("moves vision to RDNA when CUDA is slower, and back when CUDA improves", () => {
    resetMetal();
    for (let i = 0; i < 8; i++) watch("vision", "cuda", 40, true);
    for (let i = 0; i < 8; i++) watch("vision", "rdna", 8, true);
    expect(prefer("vision", "cuda", false)).toBe("rdna");
    for (let i = 0; i < 20; i++) watch("vision", "cuda", 2, true);
    expect(prefer("vision", "rdna", false)).toBe("cuda");
  });

  it("evolves the split without giving up on either metal", () => {
    resetMetal();
    for (let i = 0; i < 6; i++) watch("step", "rdna", 3, true);
    for (let i = 0; i < 6; i++) watch("step", "cuda", 30, true);
    const s = evolveSplit("rdna", "cuda");
    expect(s.world).toBe("rdna");
    expect(s.note).toMatch(/Hector/);
  });
});
