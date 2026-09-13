import { describe, expect, it } from "vitest";
import { pick, tick, whoosh } from "./sphere-fx";

describe("sphere fx", () => {
  it("plays without throwing when there is no audio", () => {
    expect(() => tick()).not.toThrow();
    expect(() => whoosh(0.04)).not.toThrow();
    expect(() => pick()).not.toThrow();
  });
});
