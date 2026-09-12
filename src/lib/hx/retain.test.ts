import { describe, expect, it } from "vitest";
import { retain, type Session } from "./retain";

function row(id: string, day: number, ticks: number, last: 0 | 1 | 2 | 3, left: Session["left"]): Session {
  return { id, day, ticks, last, left };
}

describe("retain", () => {
  it("computes D1 from a cohort", () => {
    const rows: Session[] = [
      row("a", 0, 200, 1, "win"),
      row("a", 1, 180, 1, "win"),
      row("b", 0, 12, 0, "quit"),
      row("c", 0, 90, 2, "die"),
      row("c", 1, 40, 1, "quit"),
    ];
    const r = retain(rows);
    expect(r.n).toBe(3);
    expect(r.d1).toBeCloseTo(2 / 3);
    expect(r.d7).toBe(0);
    expect(r.note).toMatch(/lamp/);
    expect(r.holes[0]?.fix.length).toBeGreaterThan(8);
  });
});
