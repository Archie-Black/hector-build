import { describe, expect, it } from "vitest";
import { fromVoice, HEAR, rms, voiced } from "./hear";

describe("diplomat hear", () => {
  it("detects voice energy and never returns a machine core", () => {
    expect(HEAR.node).toBe("osv01d.diplomat.hear");
    const quiet = new Int16Array(160);
    expect(voiced(quiet)).toBe(false);
    const loud = new Int16Array(160).map(() => 12000);
    expect(rms(loud)).toBeGreaterThan(0.02);
    expect(fromVoice(loud).core).toBe("diplomat");
    expect(fromVoice(loud).hear).toBe(true);
  });
});
