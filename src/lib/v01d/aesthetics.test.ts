import { describe, expect, it } from "vitest";
import { aestheticShaders, deskProjects, gameProjects, LOOK, wantsEngines } from "./aesthetics";

describe("aesthetics", () => {
  it("keeps the sealed palette and points look at Unreal plus Godot", () => {
    expect(LOOK.vanta).toBe("#050506");
    expect(LOOK.cobalt).toBe("#0047ab");
    expect(LOOK.uranium).toBe("#e6ff2a");
    expect(deskProjects().godot).toMatch(/Godot\/void/);
    expect(deskProjects().ue).toMatch(/VoidDesktop/);
    expect(gameProjects().godot).toMatch(/Godot\/project\.godot/);
    expect(gameProjects().ue).toMatch(/SpectralHorizon/);
    expect(aestheticShaders().join(" ")).toMatch(/nebula\.gdshader/);
    expect(aestheticShaders().join(" ")).toMatch(/VoidNebula\.usf/);
    expect(wantsEngines("open godot")).toBe(true);
    expect(wantsEngines("open unreal editor")).toBe(true);
  });
});
