import { describe, expect, it } from "vitest";
import { pickDump } from "./restore";

describe("restore dump pick", () => {
  const names = ["v01d-20260913T120000Z.sql", "v01d-20260912T090000Z.sql", "notes.txt"];

  it("picks the newest dump", () => {
    expect(pickDump(names)).toBe("v01d-20260913T120000Z.sql");
  });

  it("refuses a name that is not a dump", () => {
    expect(pickDump(names, "notes.txt")).toBeNull();
    expect(pickDump(names, "v01d-20260912T090000Z.sql")).toBe("v01d-20260912T090000Z.sql");
  });
});
