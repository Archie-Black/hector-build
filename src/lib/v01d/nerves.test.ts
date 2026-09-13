import { describe, expect, it } from "vitest";
import { resetPath } from "./pathways";
import { BODY, feel, map, NERVE, sealNerves } from "./nerves";

describe("nervous system", () => {
  it("maps brain software, body hardware, nerves as web and desk", () => {
    resetPath();
    expect(NERVE.brain).toBe("software");
    expect(NERVE.body).toBe("hardware");
    expect(NERVE.nerves).toMatch(/web/);
    expect(BODY.seat).toMatch(/origin/);
    sealNerves();
    const m = map();
    expect(m.brain.left).toBe("hector");
    expect(m.brain.right).toBe("asimov");
    expect(m.nerves.tracts).toContain("cranial");
    const i = feel("cranial", "chat", "open files");
    expect(i.speak).toBe(true);
    expect(feel("autonomic", "field", "field").speak).toBe(false);
  });
});
