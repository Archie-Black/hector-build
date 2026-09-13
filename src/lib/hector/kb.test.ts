import { describe, expect, it } from "vitest";
import { answer, search, wantsKb } from "./kb";

describe("hector library", () => {
  it("finds a letter and an invoice with a reason", () => {
    expect(wantsKb("need an invoice template")).toBe(true);
    const inv = answer("invoice");
    expect(inv).toMatch(/who, what, how much/i);
    expect(search("krita layers")[0]?.id).toBe("krita-layer");
  });
});
