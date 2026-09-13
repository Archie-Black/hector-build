import { describe, expect, it } from "vitest";
import { hear, mark } from "./mark";
import { seal, wantsForge } from "./seal";
import { bounceWav, STUDIO } from "./studio";
import { wav } from "./wav";

describe("Forge studio", () => {
  it("hears its own watermark and seals a bounce", async () => {
    expect(STUDIO.daw).toBe("Ardour");
    expect(STUDIO.rack.map((r) => r.name)).toContain("Cardinal");
    const silent = new Int16Array(4096);
    const m = mark(silent, "DeltaKingZero");
    expect(hear(m, "DeltaKingZero")).toBeGreaterThan(0.9);
    expect(hear(m, "someone-else")).toBeLessThan(0.7);
    const { receipt } = await seal(wav(bounceWav(0.2)), { holder: "DeltaKingZero", isrc: "CA-DKZ-26-00001", title: "Void Theme" });
    expect(receipt.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.mark).toBeGreaterThan(0.5);
    expect(wantsForge("protect this track")).toBe(true);
  });
});
