import { describe, expect, it } from "vitest";
import { muted, setMuted } from "./sound";

describe("master bus", () => {
  it("is on unless the user mutes", () => {
    setMuted(false);
    expect(muted()).toBe(false);
    setMuted(true);
    expect(muted()).toBe(true);
    setMuted(false);
    expect(muted()).toBe(false);
  });
});
