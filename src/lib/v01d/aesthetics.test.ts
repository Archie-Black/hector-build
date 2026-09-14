import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FRAG } from "./void-gl";
import { ENGINE_DRIP, ENGINE_FIELD, ENGINE_SFX } from "./engine-sfx";
import { aestheticShaders, deskProjects, LOOK } from "./aesthetics";
import { SCORE_DUCK } from "./void-score";
import { hxDrip } from "@/lib/hx/niagara";

describe("aesthetics", () => {
  it("keeps the sealed palette and points look at Unreal plus Godot", () => {
    expect(LOOK.vanta).toBe("#050506");
    expect(LOOK.cobalt).toBe("#0047ab");
    expect(LOOK.uranium).toBe("#e6ff2a");
    expect(deskProjects().godot).toMatch(/Godot\/void/);
    expect(deskProjects().ue).toMatch(/VoidDesktop/);
    expect(aestheticShaders().join(" ")).toMatch(/nebula\.gdshader/);
    expect(LOOK.field).toMatch(/nebula\.gdshader/);
    expect(LOOK.sfx.godot).toMatch(/score\.gd/);
  });

  it("uses the Godot and Unreal field shaders, not a second look", () => {
    const godot = readFileSync(ENGINE_FIELD.godot, "utf8");
    const ue = readFileSync(ENGINE_FIELD.ue, "utf8");
    expect(godot).toContain("u_look");
    expect(godot).toContain("fbm");
    expect(ue).toContain("Fbm");
    expect(godot).toContain(String(ENGINE_FIELD.hash));
    expect(ue).toContain("43758.5453123");
    expect(FRAG).toContain("u_look");
    expect(FRAG).toContain("43758.5453123");
  });

  it("plays SFX from the engine hertz tables", () => {
    const gd = readFileSync(ENGINE_SFX.godot, "utf8");
    const ue = readFileSync(ENGINE_SFX.ue, "utf8");
    expect(gd).toContain(String(ENGINE_SFX.bed));
    expect(ue).toContain("36.7");
    expect(gd).toContain(String(ENGINE_SFX.tick));
    expect(ue).toContain("1240");
    expect(SCORE_DUCK).toBe(ENGINE_SFX.duck);
  });

  it("runs portal drip with the MenuDrip field", () => {
    const usf = readFileSync(ENGINE_DRIP.ue, "utf8");
    expect(usf).toContain("HXDrip");
    expect(usf).toContain("0.90, 1.0, 0.16");
    expect(hxDrip(0.2, 0.1, 0, 0.5)).toBeGreaterThanOrEqual(0);
  });
});
