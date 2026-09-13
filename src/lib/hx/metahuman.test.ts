import { describe, expect, it } from "vitest";
import { describe as say, MHC, wantsMeta, type MhState } from "./metahuman";

describe("MetaHuman", () => {
  it("knows Creator 5.8 and OpenRigLogic", () => {
    expect(MHC.engine).toBe("5.8");
    expect(MHC.character).toMatch(/Hector/);
    expect(MHC.plugins).toContain("MetaHumanCreator");
    expect(wantsMeta("open metahuman creator")).toBe(true);
    const none: MhState = { editor: false, creator: false, rig: false, note: "" };
    expect(say(none)).toMatch(/Unreal/);
  });
});
