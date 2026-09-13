import { describe, expect, it } from "vitest";
import { linearField, spring, step } from "./mograph";
import { parked } from "./overture";

describe("mograph", () => {
  it("steps clones, wipes a linear field, and springs past then rests", () => {
    expect(step(0, 6)).toBe(0);
    expect(step(5, 6)).toBe(1);
    expect(linearField(0, 0.5)).toBe(1);
    expect(linearField(1, 0.5)).toBe(0);
    expect(spring(0)).toBe(0);
    expect(spring(8)).toBeGreaterThan(0.95);
    expect(parked().top).toBeGreaterThan(85);
  });
});
