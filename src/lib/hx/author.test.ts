import { describe, expect, it } from "vitest";
import { author } from "./author";

describe("author", () => {
  it("fills every chair", () => {
    const k = author("Ghost Maze");
    expect(k.engine).toBe("both");
    expect(k.seats.promo).toMatch(/DooMChaT/);
    expect(k.trailer.length).toBeGreaterThan(2);
  });
});
