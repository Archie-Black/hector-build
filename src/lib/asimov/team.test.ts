import { describe, expect, it } from "vitest";
import { resetMetal } from "@/lib/hector/metal";
import { crew, deal } from "./team";

describe("RDNA + CUDA team", () => {
  it("splits the lab when both metals are here", () => {
    resetMetal();
    const c = crew({ amd: true, nvidia: true });
    expect(c.mode).toBe("team");
    expect(c.note).toMatch(/Hector/);
    const d = deal(["step", "vision"], { amd: true, nvidia: true }, false);
    expect(d[0].metal).toBe("rdna");
    expect(d[1].metal).toBe("cuda");
  });

  it("stays RDNA when CUDA is not in the box", () => {
    expect(crew({ amd: true }).mode).toBe("rdna");
    expect(crew({ nvidia: true, amd: false }).mode).toBe("cuda");
  });
});
