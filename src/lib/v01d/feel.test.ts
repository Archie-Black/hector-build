import { describe, expect, it } from "vitest";
import { DEFAULT, feel, patchFeel, saveFeel } from "./feel";

describe("feel", () => {
  it("keeps volume and type in range", () => {
    saveFeel({ ...DEFAULT, volume: 2, font: 9, brightness: 0 });
    expect(feel().volume).toBeLessThanOrEqual(1);
    expect(feel().font).toBeLessThanOrEqual(1.45);
    expect(feel().brightness).toBeGreaterThanOrEqual(0.62);
    patchFeel({ mute: true, spatial: false });
    expect(feel().mute).toBe(true);
    expect(feel().spatial).toBe(false);
  });
});
