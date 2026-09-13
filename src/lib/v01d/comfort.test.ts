import { describe, expect, it } from "vitest";
import { face, onRing, QUIZ, welcome, type Profile } from "./comfort";

const win: Profile = { desk: "work", home: "windows", term: "never", nerve: "hide", files: "explorer" };
const play: Profile = { desk: "play", home: "windows", term: "never", nerve: "hide", files: "explorer" };

describe("comfort", () => {
  it("asks the install flavor first and keeps games off the work ring", () => {
    expect(QUIZ[0]?.id).toBe("desk");
    expect(QUIZ).toHaveLength(5);
    const f = face(win);
    expect(f.start).toBe("Start");
    expect(f.desk).toBe("work");
    expect(onRing("portal", "work")).toBe(false);
    expect(onRing("portal", "play")).toBe(true);
    expect(welcome(play)).toMatch(/Games/i);
    expect(welcome(win)).toMatch(/Games live in Start/i);
  });
});
