import { describe, expect, it } from "vitest";
import { resetMetal } from "@/lib/hector/metal";
import { accel } from "./rdna";

describe("Spectral HX RDNA team", () => {
  it("compiles hipcc and nvcc together on a dual box", () => {
    resetMetal();
    const a = accel({ amd: true, nvidia: true });
    expect(a.cc).toEqual(["hipcc", "nvcc"]);
    expect(a.world).toBe("rdna");
    expect(a.eyes).toBe("cuda");
  });
});
