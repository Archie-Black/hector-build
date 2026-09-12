import { describe, expect, it } from "vitest";
import { ask } from "./ask";
import { inquisitor } from "./inquisitor";

describe("inquisitor", () => {
  it("stays quiet on a clear task", () => {
    expect(inquisitor("Opening files.", "defense", "open Documents", "en").voice).toBe("silent");
  });
  it("asks when the job is empty", () => {
    expect(inquisitor("", "defense", "do it", "en").voice).toBe("ask");
  });
  it("speaks a short no", () => {
    const j = ask("break into the school network");
    expect(j.voice).toBe("error");
    expect(j.say.length).toBeLessThan(40);
  });
});
