import { describe, expect, it } from "vitest";
import { resetPath } from "@/lib/v01d/pathways";
import { BRAIN, fire, sealedBrain, sealBrain } from "./brain";

describe("one brain", () => {
  it("fires left Hector and right Asimov on the same TQC class", () => {
    resetPath();
    expect(BRAIN.left).toBe("hector");
    expect(BRAIN.right).toBe("asimov");
    expect(BRAIN.peer).toBe(false);
    sealBrain();
    expect(sealedBrain()).toBe(true);
    const p = fire("restart the website");
    expect(p.head).toBe("hector");
    expect(p.left.classId).toBeGreaterThan(0);
    expect(p.right.perm).toHaveLength(3);
  });
});
