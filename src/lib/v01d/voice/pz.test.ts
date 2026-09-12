import { describe, expect, it } from "vitest";
import type { Frame } from "./frame";
import { miss, predict } from "./mdpc";
import { map, stable } from "./pz";
import { speak } from "./speak";

const F = (f1: number, f2: number, f3: number): Frame => ({
  f0: 118, av: 0.4, af: 0, f1, f2, f3, b1: 90, b2: 110, b3: 170,
});

describe("pz mdpc", () => {
  it("keeps poles inside the circle", () => {
    expect(map(F(500, 1500, 2500)).poles.every(stable)).toBe(true);
  });
  it("predicts closer than staying put", () => {
    const a = F(400, 1200, 2400);
    const b = F(500, 1400, 2500);
    const c = F(700, 1600, 2600);
    expect(miss(predict(a, b, c), c)).toBeLessThan(miss(b, c));
  });
  it("still speaks", () => {
    expect(speak("man").pcm.length).toBeGreaterThan(400);
  });
});
