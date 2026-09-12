import { describe, expect, it } from "vitest";
import { mix } from "./mix";
import { teach, VOICE } from "./adapt";
import type { Frame } from "./frame";
import { speak } from "./speak";

const F = (f1: number): Frame => ({
  f0: 118, av: 0.4, af: 0, f1, f2: 1500, f3: 2500, b1: 90, b2: 110, b3: 170,
});

describe("voice adapt", () => {
  it("is burned in", () => {
    expect(VOICE.improve).toBe(true);
    expect(VOICE.ask).toBe(false);
  });
  it("learns from a run of frames", () => {
    const before = mix().hits;
    teach([F(400), F(500), F(620), F(700)]);
    expect(mix().hits).toBeGreaterThan(before);
    expect(speak("hello").pcm.length).toBeGreaterThan(100);
  });
});
