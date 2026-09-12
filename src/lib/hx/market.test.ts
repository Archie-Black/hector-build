import { describe, expect, it } from "vitest";
import { author } from "./author";
import { boot } from "./horizon";
import { market } from "./market";

describe("market", () => {
  it("refuses fake noise", () => {
    const m = market(author("Ghost Maze"), boot());
    expect(m.never.join(" ")).toMatch(/fake reviews/);
    expect(m.hook.length).toBeGreaterThan(8);
    expect(m.holes.length).toBeGreaterThan(0);
  });
});
