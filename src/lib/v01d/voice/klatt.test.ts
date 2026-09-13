import { describe, expect, it } from "vitest";
import { compact, RATE, render, resample } from "./klatt";
import { speak } from "./speak";
import { SPEECH } from "../overture";

describe("formant renderer", () => {
  it("speaks the intro line in range", () => {
    const u = speak("I am Hector");
    expect(u.engine).toBe("formant");
    expect(u.rate).toBe(RATE);
    expect(u.pcm.length).toBeGreaterThan(RATE / 2);
    let e = 0;
    let peak = 0;
    for (const x of u.pcm) {
      expect(Number.isFinite(x)).toBe(true);
      e += x * x;
      const a = Math.abs(x);
      if (a > peak) peak = a;
    }
    expect(e).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(1);
    expect(peak).toBeGreaterThan(0.2);
    const long = speak(SPEECH);
    expect(long.pcm.length / long.rate).toBeGreaterThan(4);
    expect(resample(u.pcm, 22050, 48000).length).toBeGreaterThan(u.pcm.length);
  });
  it("drops duplicate frames", () => {
    const f = { f0: 118, av: 0.4, af: 0, f1: 500, f2: 1500, f3: 2500, b1: 90, b2: 110, b3: 170 };
    expect(compact([f, f, f, { ...f, f1: 700 }]).length).toBe(2);
    expect(render([f, { ...f, f1: 700 }]).length).toBeGreaterThan(0);
  });
});
