import { describe, expect, it } from "vitest";
import { CLASS, empty, grade, next, offer } from "./linux-class";

describe("linux for beginners", () => {
  it("starts at begin and hardens after a full pass", () => {
    const first = next(empty());
    expect(first?.band).toBe("begin");
    expect(CLASS.find((l) => l.id === "hello-sh")?.parts?.length).toBeGreaterThan(1);
    expect(CLASS.find((l) => l.id === "c-hello")?.code).toMatch(/int main/);
    let p = empty();
    for (const l of CLASS.filter((x) => x.band === "begin")) {
      const g = grade(l, l.quiz.map((q) => q.ok), p);
      expect(g.ok).toBe(true);
      p = g.progress;
    }
    expect(p.band).toBe("more");
    expect(next(p)?.band).toBe("more");
  });

  it("offers a lesson only while agents work and teach is on", () => {
    expect(offer(true, false, empty())).toBeNull();
    expect(offer(false, true, empty())).toBeNull();
    expect(offer(true, true, empty())).toMatch(/ghosts are working/i);
  });
});
