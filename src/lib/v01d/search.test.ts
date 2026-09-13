import { describe, expect, it } from "vitest";
import { search } from "./search";

describe("hector search", () => {
  it("finds programs on this box and a web hit", () => {
    const g = search("gimp");
    expect(g.system.some((h) => /gimp/i.test(h.title))).toBe(true);
    expect(g.web[0]?.app).toBe("ghostwalk");
    expect(search("ghostwalk").system[0]?.app).toBe("ghostwalk");
    expect(search("https://doomchat.ca").web[0]?.url).toMatch(/doomchat/);
  });
});
