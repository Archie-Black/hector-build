import { describe, expect, it } from "vitest";
import { AGENT_TASKS, CODIUM, TERMINAL_PROFILES, sayCodium, wantsCodium } from "./codium";

describe("vscodium augment", () => {
  it("names the heavy editor and the agent tasks", () => {
    expect(CODIUM.bin).toMatch(/codium/);
    expect(CODIUM.install).toMatch(/install-vscodium/);
    expect(AGENT_TASKS.map((t) => t.id)).toEqual(["typecheck", "test", "build", "doctor", "iso"]);
    expect(TERMINAL_PROFILES).toContain("Machine Core");
    expect(wantsCodium("open vscodium")).toBe(true);
    expect(sayCodium()).toMatch(/VSCodium/);
  });
});
