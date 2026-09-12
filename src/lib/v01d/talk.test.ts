import { describe, expect, it } from "vitest";
import { say, spread, taught } from "./talk";
import { native, same, windows } from "./vfs";

describe("talk", () => {
  it("teaches every dialect to every other", () => {
    const known = spread();
    expect(known.length).toBeGreaterThanOrEqual(8);
    expect(taught().words).toBeGreaterThan(0);
  });
  it("ntfs and ext4 speak without a copy", () => {
    expect(say("C:\\Users\\Dark0\\Docs", "ntfs", "ext4")).toContain("Users");
    expect(windows("/win/c/Users/Dark0/Docs")).toBe("C:\\Users\\Dark0\\Docs");
    expect(native("C:\\Users\\Dark0\\Docs").path).toBe("/win/c/Users/Dark0/Docs");
  });
  it("same file, two mouths", () => {
    expect(same("C:\\Users\\a\\x", "/mnt/c/Users/a/x")).toBe(true);
  });
});
