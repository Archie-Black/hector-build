import { describe, expect, it } from "vitest";
import { resetRl } from "@/lib/hector/rl";
import { bind, devices, HAL, submit } from "./hal";

describe("V01D HAL", () => {
  it("exposes RDNA, CUDA, and Vulkan as one command model", () => {
    resetRl();
    const d = devices();
    expect(d.map((x) => x.backend).sort()).toEqual(["cuda", "rdna", "vulkan"]);
    expect(HAL.api).toMatch(/Vulkan/);
    const s = submit("vision", 6, true, "step");
    expect(s.family).toBe("compute");
    expect(["rdna", "cuda", "vulkan"]).toContain(s.backend);
    expect(bind("vision", false).queues.compute).toBeGreaterThan(0);
  });
});
