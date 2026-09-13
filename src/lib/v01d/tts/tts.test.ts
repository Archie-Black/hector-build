import { describe, expect, it } from "vitest";
import { hints, sentences } from "./chunk";
import { maySpeak } from "./gate";
import { canStudio, engines, using } from "./index";
import { plan, spoken, sway } from "./predict";

describe("v01d tts", () => {
  it("cuts sentences and reads tags", () => {
    expect(sentences("Hello. I am Hector. Welcome.")).toHaveLength(3);
    expect(hints("[slow] Look up.").hint.rate).toBeLessThan(1);
    expect(hints("[whisper] hush").hint.whisper).toBe(true);
    expect(canStudio()).toBe(false);
    expect(using()).toBe("paul");
    expect(engines().some((e) => e.id === "studio")).toBe(true);
  });

  it("plans the whole line and keeps the machine quiet", () => {
    const beats = plan("I am Hector. Welcome to OS V01D.");
    expect(beats.length).toBeGreaterThan(1);
    expect(spoken("OS V01D")).toMatch(/oh ess void/i);
    expect(sway(7)[0]).toBe(0);
    expect(sway(7).at(-1)!).toBeCloseTo(1, 10);
    expect(maySpeak("thanks for keeping this clean")).toBe(true);
    expect(maySpeak("ffmpeg -i in.wav out.mp3")).toBe(false);
  });
});
