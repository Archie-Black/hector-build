import { describe, expect, it } from "vitest";
import { ltv } from "./ltv";
import type { Session } from "./retain";

describe("ltv", () => {
  it("treats free as time", () => {
    const rows: Session[] = [
      { id: "a", day: 0, ticks: 100, last: 1, left: "win" },
      { id: "a", day: 1, ticks: 80, last: 1, left: "win" },
      { id: "b", day: 0, ticks: 20, last: 0, left: "quit" },
    ];
    const free = ltv(rows, 0);
    expect(free.money).toBe(0);
    expect(free.time).toBeGreaterThan(0);
    expect(free.note).toMatch(/Shareware/);
    const paid = ltv(rows, 10);
    expect(paid.money).toBeGreaterThan(0);
    expect(paid.lives).toBeCloseTo(1 / (1 - 0.5));
  });
});
