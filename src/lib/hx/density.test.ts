import { describe, expect, it } from "vitest";
import { audit, density, fits, maxBits, volume } from "./density";

describe("holographic node ceiling", () => {
  it("matches the 1 nm Bousso audit", () => {
    const r = 1e-9;
    const a = audit(r);
    expect(a.volume).toBeCloseTo(volume(r), 20);
    expect(a.bits).toBeGreaterThan(1e51);
    expect(a.bits).toBeLessThan(1e53);
    expect(density(r)).toBeGreaterThan(1e77);
    expect(fits(16 * 1024 * 1024, r)).toBe(true);
    expect(maxBits(r) / volume(r)).toBeCloseTo(density(r), 5);
  });
});
