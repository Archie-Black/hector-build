import { describe, expect, it } from "vitest";
import { cap, FACE, MAX_LOGICAL, raise, want, wantsHive } from "./hive";

describe("hive", () => {
  it("reads a requested count", () => {
    expect(want("raise 200 agents to scan the repo")).toBe(200);
    expect(wantsHive("build a massive swarm for this")).toBe(true);
  });

  it("never runs more bodies than the machine can hold", () => {
    const h = raise("refactor the repository", 2000);
    expect(h.logical).toBe(2000);
    expect(h.physical).toBeLessThanOrEqual(cap());
    expect(h.physical).toBeGreaterThan(0);
    expect(h.faces).toBe(Math.ceil(2000 / FACE));
    expect(h.jersey).toBe(2000);
    expect(h.cells).toHaveLength(2000);
  });

  it("clamps a crazy ask to the logical ceiling", () => {
    const h = raise("spawn 99999 agents", 99_999);
    expect(h.logical).toBe(MAX_LOGICAL);
  });
});
