import { describe, expect, it } from "vitest";
import { conf, listing, unc } from "./samba";
import { list } from "./vfs";

describe("samba", () => {
  it("shares pictures and media", () => {
    expect(unc("pictures")).toBe("\\\\V01D\\Pictures");
    expect(listing().some((s) => s.id === "media")).toBe(true);
    expect(conf()).toContain("SMB3");
  });
  it("has a Programs folder", () => {
    expect(list("/v01d/programs").some((n) => n.name === "notepad.exe")).toBe(true);
  });
});
