import { describe, expect, it } from "vitest";
import { RDNA, rdnaProbe } from "./rdna";
import { rdnaStep } from "./rdna-step";
import { world } from "./sim";

describe("Asimov RDNA", () => {
  it("is gfx1201 first-class and answers CUDA", () => {
    expect(RDNA.gfx).toBe("gfx1201");
    expect(RDNA.note).toMatch(/team/);
    expect(rdnaProbe().engine).toBe("Asimov RDNA");
  });

  it("steps the bot without tunneling a wall", () => {
    const wo = world();
    wo.bot.v = 2;
    wo.bot.th = 0;
    const before = wo.bot.x;
    rdnaStep(wo, 0.05);
    expect(wo.bot.x).not.toBe(before);
    expect(wo.scan.length).toBeGreaterThanOrEqual(36);
    expect(wo.bot.x).toBeGreaterThan(wo.bot.r - 1e-6);
  });
});
