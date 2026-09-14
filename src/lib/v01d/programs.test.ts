import { describe, expect, it } from "vitest";
import { catalog, findProg, folder, ROOT } from "./programs";
import { list } from "./vfs";
import { plan } from "./runtime";

describe("programs folder", () => {
  it("puts every tool on a real path", () => {
    const names = catalog().map((p) => p.name);
    expect(names).toContain("GIMP");
    expect(names).toContain("Krita");
    expect(names).toContain("GhostWalk");
    expect(names).toContain("Godot");
    expect(names).toContain("Unreal Editor");
    expect(names).toContain("VSCodium");
    expect(names).toContain("notepad.exe");
    expect(findProg("gimp")?.linux).toBe("/usr/bin/gimp");
    expect(findProg("krita")?.linux).toBe("/usr/bin/krita");
    expect(findProg("godot")?.linux).toBe("/opt/godot/Godot");
    expect(findProg("codium")?.linux).toMatch(/codium/);
    expect(plan("GIMP").path).toBe("/usr/bin/gimp");
    expect(plan("GhostWalk").how).toMatch(/ghostwalk/);
    expect(folder().every((p) => p.run.startsWith("/") || p.run.includes("wine"))).toBe(true);
    expect(list(ROOT).some((n) => n.name === "notepad.exe")).toBe(true);
    expect(list(ROOT).find((n) => n.name === "GIMP")?.native).toBe("/usr/bin/gimp");
  });
});
