import { describe, expect, it } from "vitest";
import { compact, render } from "./klatt";
import { speak } from "./speak";

describe("formant tqc", () => {
  it("speaks without a GPU", () => {
    const u = speak("hello");
    expect(u.engine).toBe("formant");
    expect(u.pcm.length).toBeGreaterThan(800);
    let e = 0;
    for (const x of u.pcm) e += x * x;
    expect(e).toBeGreaterThan(0);
  });
  it("drops duplicate frames", () => {
    const f = { f0: 118, av: 0.4, af: 0, f1: 500, f2: 1500, f3: 2500, b1: 90, b2: 110, b3: 170 };
    expect(compact([f, f, f, { ...f, f1: 700 }]).length).toBe(2);
    expect(render([f, { ...f, f1: 700 }]).length).toBeGreaterThan(0);
  });
});
