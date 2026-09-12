import { beforeEach, describe, expect, it } from "vitest";
import { begin, hear, reset, snapshot, tick } from "./place";

describe("place", () => {
  beforeEach(() => reset());
  it("keeps the place when interrupted", () => {
    begin("build files", ["open files", "share pictures"]);
    const here = snapshot()!;
    const mid = hear("also make a Programs folder");
    expect(mid.place?.at).toBe(here.at);
    expect(mid.place?.braid).not.toBe(0);
    expect(hear("instead use Pictures").how).toBe("amend");
    expect(snapshot()?.at).toBe(here.at);
  });
  it("moves only when the step is done", () => {
    begin("one", ["a", "b"]);
    const a = snapshot()!.at;
    tick();
    expect(snapshot()!.at).toBe(a + 1);
  });
});
