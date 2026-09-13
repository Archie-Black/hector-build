import { describe, expect, it } from "vitest";
import { care } from "./care";

describe("kernel care", () => {
  it("teaches darwin and unix dialects", () => {
    const t = care();
    expect(t.dialects).toEqual(expect.arrayContaining(["apfs", "hfs", "ufs", "xnu"]));
    expect(t.ticks).toBeGreaterThan(0);
  });
});
