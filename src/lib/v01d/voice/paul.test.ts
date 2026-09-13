import { describe, expect, it } from "vitest";
import { pcm, PAUL_RATE, seconds } from "./paul";
import { SPEECH } from "../overture";

describe("paul", () => {
  it("bakes a real line", () => {
    const a = pcm("I am Hector.");
    expect(a.length).toBeGreaterThan(PAUL_RATE / 4);
    let e = 0;
    for (const x of a) {
      expect(Number.isFinite(x)).toBe(true);
      e += x * x;
    }
    expect(e).toBeGreaterThan(0);
    expect(seconds("I am Hector.")).toBeGreaterThan(0.4);
    expect(pcm(SPEECH).length).toBeGreaterThan(a.length);
  });
});
