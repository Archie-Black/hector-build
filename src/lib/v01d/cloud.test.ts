import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FABRIC, onFabric, publicPort, status, wantsHeal } from "./cloud";

describe("v01d cloud", () => {
  it("only 80, 443, and wireguard leave the box", () => {
    expect(publicPort(80)).toBe(true);
    expect(publicPort(443)).toBe(true);
    expect(publicPort(51820)).toBe(true);
    expect(publicPort(5432)).toBe(false);
    expect(publicPort(9090)).toBe(false);
    const y = readFileSync("packaging/cloud/compose.yml", "utf8");
    expect(y).toContain(FABRIC.overlay);
    expect(y).toContain("internal: true");
    expect(y).not.toMatch(/5432:5432/);
    expect(y).not.toMatch(/9090:9090/);
    expect(y).not.toMatch(/docker\.sock/);
  });

  it("timescale url is the fabric, neon is not", () => {
    expect(onFabric("postgres://v01d:x@10.13.0.20:5432/v01d")).toBe(true);
    expect(onFabric("postgres://neon.tech/app")).toBe(false);
    expect(status("postgres://v01d:x@10.13.0.20:5432/v01d").db).toBe("timescale");
    expect(wantsHeal("restart the website")).toBe(true);
  });
});
