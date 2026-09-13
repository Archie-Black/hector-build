import { describe, expect, it } from "vitest";
import { plan, stale } from "./firmware";
import { atOrigin, ORIGIN, seat } from "./origin";

describe("firmware first, origin seat", () => {
  it("refuses a random flash and sits Hector at 0,0,0", () => {
    expect(ORIGIN.x).toBe(0);
    expect(atOrigin(seat())).toBe(true);
    expect(ORIGIN.note).toMatch(/LBA 0/);
    const noefi = plan({ vendor: "AMI", board: "x", bios: "1", date: "01/01/2018", efi: false, ac: true }, [{ id: "a", name: "BIOS", version: "2", signed: true }]);
    expect(noefi.flash).toBe(false);
    const nobat = plan({ vendor: "AMI", board: "x", bios: "1", date: "01/01/2024", efi: true, ac: false }, [{ id: "a", name: "BIOS", version: "2", signed: true }]);
    expect(nobat.flash).toBe(false);
    const ok = plan({ vendor: "AMI", board: "x", bios: "1", date: "01/01/2024", efi: true, ac: true }, [{ id: "a", name: "BIOS", version: "2", signed: true }]);
    expect(ok.flash).toBe(true);
    expect(stale("01/01/2018")).toBe(true);
  });
});
