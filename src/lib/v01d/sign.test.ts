import { describe, expect, it } from "vitest";
import { may, SIGN } from "./sign";

describe("sign gate", () => {
  it("refuses unsigned firmware and unsigned packages", () => {
    expect(SIGN.by).toBe("DeltaKingZero");
    expect(may("firmware", false)).toBe("refuse");
    expect(may("firmware", true)).toBe("ok");
    expect(may("package", false)).toBe("refuse");
    expect(may("units", true, false)).toBe("refuse");
    expect(may("weights", false)).toBe("skip");
    expect(may("weights", true)).toBe("ok");
  });
});
