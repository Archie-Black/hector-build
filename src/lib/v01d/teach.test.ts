import { describe, expect, it } from "vitest";
import { askTeach, lesson, wantsTeach } from "./teach";

describe("teach choice", () => {
  it("hears yes teach me and just do the job", () => {
    expect(wantsTeach("Yes, teach me")).toBe("yes");
    expect(wantsTeach("No, I don't want to know, just do the job")).toBe("no");
    expect(askTeach()).toMatch(/Yes, teach me/);
  });

  it("hides the lesson when they said no", () => {
    const job = { what: "pacman", why: "store" };
    expect(lesson(job, "no")).toEqual({ what: "", why: "" });
    expect(lesson(job, "yes").why).toBe("store");
  });
});
