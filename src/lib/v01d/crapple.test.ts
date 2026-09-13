import { describe, expect, it } from "vitest";
import { guest, mapButton, mapKey, mapWheel, planMac } from "./crapple";

describe("crapple", () => {
  it("opens darwin for a .app and unix for posix", () => {
    expect(guest("/Applications/Hex.app")).toBe("darwin");
    expect(guest("/usr/local/bin/ksh")).toBe("unix");
    expect(planMac("Notes.app").how).toBe("crapple");
    expect(planMac("/opt/bin/tool.out").how).toBe("unix");
  });

  it("maps windows keys and both clicks to Mac one-button", () => {
    expect(mapKey("MetaLeft")).toEqual({ cmd: true, key: "Meta" });
    expect(mapKey("OSRight")).toEqual({ cmd: true, key: "Meta" });
    expect(mapButton(0)).toBe(0);
    expect(mapButton(2)).toBe(0);
    expect(mapWheel(40, 12)).toEqual({ scroll: 12, pan: 0, zoom: 0 });
  });
});
