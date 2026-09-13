import { describe, expect, it } from "vitest";
import { counterparts, facet, pick } from "./backend";
import { CUDA } from "./cuda";
import { COUNTERPART, RDNA } from "./rdna";

describe("ROCm is the counterpart to CUDA", () => {
  it("maps every CUDA facet onto a ROCm piece and teams them", () => {
    const rows = counterparts();
    expect(rows.length).toBe(Object.keys(CUDA).length);
    expect(rows.every((r) => r.team)).toBe(true);
    expect(COUNTERPART.runtime).toBe("HIP");
    expect(COUNTERPART.chip).toBe(RDNA.gfx);
  });

  it("picks the team when both metals are here", () => {
    expect(pick({ amd: true, nvidia: true })).toBe("team");
    expect(pick({ amd: true })).toBe("rdna");
    expect(pick({ nvidia: true, amd: false })).toBe("cuda");
    expect(facet({ amd: true, nvidia: true }).runtime).toBe("HIP + CUDA");
  });
});
