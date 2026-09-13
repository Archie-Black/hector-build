import { describe, expect, it } from "vitest";
import { VOID_LOOP } from "./overture";
import { SCORE_DUCK } from "./void-score";
import { score } from "./void-score";

describe("void score", () => {
  it("starts a score and can stop it", () => {
    expect(VOID_LOOP).toMatch(/void-overture/);
    expect(SCORE_DUCK).toBeLessThan(0.1);
    expect(typeof score()).toBe("function");
  });
});
