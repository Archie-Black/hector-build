import { describe, expect, it } from "vitest";
import { canStopCopy, clampCopies, planRoll, planScale } from "./orchestrate";
import type { Row } from "./repair";

const up = (name: string, n = 0): Row => ({
  name,
  service: "v01d",
  state: "running",
  health: "healthy",
  restarts: n,
});

describe("website copies", () => {
  it("will not scale below one, or above four", () => {
    expect(clampCopies(0)).toBe(1);
    expect(clampCopies(9)).toBe(4);
  });

  it("will not stop the last healthy copy", () => {
    expect(canStopCopy(1)).toBe(false);
    expect(canStopCopy(2)).toBe(true);
    const hold = planScale([up("osv01d-v01d-1")], 0);
    expect(hold[0].action).toBe("hold");
  });

  it("adds a copy first when replacing (rolling)", () => {
    const moves = planRoll([up("osv01d-v01d-1")]);
    expect(moves[0].action).toBe("add-copy");
    expect(moves[1].action).toBe("stop-copy");
  });

  it("repairs before scaling if every copy is dead", () => {
    const dead: Row = { name: "osv01d-v01d-1", service: "v01d", state: "exited", health: "unhealthy", restarts: 2 };
    expect(planScale([dead], 2)[0].action).toBe("repair-first");
  });
});
