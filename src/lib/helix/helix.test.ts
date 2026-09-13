import { describe, expect, it } from "vitest";
import { planHelix, wantsHelix } from "./plan";
import { kind } from "./sniff";

describe("helix", () => {
  it("rebuilds when source is present", () => {
    const p = planHelix("convert CMakeLists.txt to windows");
    expect(p.move).toBe("rebuild");
    expect(p.to).toBe("win");
    expect(p.steps.join(" ")).toMatch(/cmake/i);
  });

  it("writes a portable adapter when there is only a binary", () => {
    const p = planHelix("convert C:\\\\Games\\\\play.exe to linux");
    expect(kind("C:\\\\Games\\\\play.exe")).toBe("pe");
    expect(p.move).toBe("adapt");
    expect(p.sh).toMatch(/wine/);
    expect(p.bat).toMatch(/wsl/i);
    expect(p.note).toMatch(/never heard of Hector/i);
  });

  it("hears convert speech", () => {
    expect(wantsHelix("make it work on linux")).toBe(true);
    expect(wantsHelix("linux to windows")).toBe(true);
  });
});
