import { describe, expect, it } from "vitest";
import { list, native, same, windows } from "./vfs";

describe("vfs", () => {
  it("sees Windows as native", () => {
    expect(native("C:\\Users\\Dark0\\Docs").path).toBe("/win/c/Users/Dark0/Docs");
    expect(windows("/win/c/Users/Dark0/Docs")).toBe("C:\\Users\\Dark0\\Docs");
  });
  it("treats the same file as the same file", () => {
    expect(same("C:\\Users\\a\\x", "/mnt/c/Users/a/x")).toBe(true);
  });
  it("never shows sealed files", () => {
    expect(list("/v01d/home").every((n) => !/\.ghstkrt$/i.test(n.name))).toBe(true);
  });
});
