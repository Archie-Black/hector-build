import { describe, expect, it } from "vitest";
import { autoWire, joinBuild, kindOf, order, pin, saveWeave, weave } from "./weave";

describe("workspace weave", () => {
  it("wires art into code and joins one build", () => {
    saveWeave({ parts: [], wires: [], join: null });
    pin(0, "suite", "Genesis HX Suite");
    pin(1, "code", "Spectral HX");
    pin(2, "portal", "Portal 00:13");
    autoWire();
    expect(weave().wires.some((w) => w.from.endsWith("suite") && w.to.endsWith("code"))).toBe(true);
    const j = joinBuild();
    expect(j.join?.order.length).toBe(3);
    expect(order()[0]).toMatch(/suite|code|portal/);
    expect(j.join?.note).toMatch(/join|wire|build/i);
    expect(j.join?.files.some((f) => f.path.endsWith("/ORDER"))).toBe(true);
    expect(j.join?.steps.length).toBe(3);
    expect(kindOf("code")).toBe("code");
  });
});
