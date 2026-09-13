import { beforeEach, describe, expect, it } from "vitest";
import { canRun, inspect, live, WEIGHTS } from "./weights";
import { heal, keepGoing, resetLedger, sayHeal } from "./weights-heal";

const tiny = WEIGHTS[0]!;
const flux = WEIGHTS.find((w) => w.id === "flux-schnell")!;

describe("weight heal", () => {
  beforeEach(() => resetLedger());

  it("uses a verified tiny and does not stop for missing flux", () => {
    const good = inspect(tiny, { bytes: tiny.bytes, sha256: tiny.sha256 });
    expect(good.state).toBe("ok");
    expect(inspect(tiny, { bytes: 12, sha256: tiny.sha256 }).state).toBe("partial");
    expect(inspect(tiny, { bytes: tiny.bytes, sha256: "deadbeef".repeat(8) }).state).toBe("corrupt");
    const vs = [
      inspect(tiny, { bytes: tiny.bytes, sha256: tiny.sha256 }),
      inspect(flux, undefined),
    ];
    expect(canRun("captions", vs)).toBe(true);
    expect(canRun("comfy", vs)).toBe(true);
    expect(live(vs)).toContain("captions");
  });

  it("stamps a missing hash and keeps going", () => {
    const got = heal("flux-schnell", { bytes: 23_000_000_000, sha256: "ab".repeat(32) });
    expect(got.state).toBe("ok");
    expect(got.action).toBe("use");
    const k = keepGoing({
      "whisper-tiny": { bytes: tiny.bytes, sha256: tiny.sha256 },
    });
    expect(k.jobs).toContain("captions");
    expect(sayHeal({})).toMatch(/parity/i);
  });
});
