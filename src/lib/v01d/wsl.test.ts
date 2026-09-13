import { describe, expect, it } from "vitest";
import { room, wantsRoom } from "./wsl";

describe("arch wsl", () => {
  it("is installed even with no profile", () => {
    const r = room(null);
    expect(r.installed).toBe(true);
    expect(r.systemd).toBe(true);
    expect(r.distro).toBe("OSV01D");
    expect(r.wine).toBe(true);
  });

  it("hears linux room", () => {
    expect(wantsRoom("open the linux room")).toBe(true);
  });
});
