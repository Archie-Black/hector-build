import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARTER } from "./charter";
import { IMAGES, MIRROR, fetchCmd, image, wantsDownloads } from "./downloads";
import { PACMAN } from "./pkgs";
import { catalog } from "./programs";
import { list } from "./vfs";

describe("doomchat downloads and packages", () => {
  it("burns www.doomchat.ca into the house and the Downloads folder", () => {
    expect(CHARTER.www).toBe("https://www.doomchat.ca");
    expect(CHARTER.downloads).toMatch(/www\.doomchat\.ca\/downloads/);
    expect(MIRROR.y).toBe("https://y.doomchat.ca");
    expect(image("hector-build")?.url).toContain("www.doomchat.ca/downloads");
    expect(IMAGES.some((i) => i.id === "spectral-hx")).toBe(true);
    expect(fetchCmd("os-iso").join(" ")).toMatch(/osv01d\.iso/);
    expect(wantsDownloads("download the os image from doomchat")).toBe(true);
    expect(list("/v01d/home/Downloads").some((n) => n.name === "Hector Build")).toBe(true);
  });

  it("lists every official bin in packages.x86_64", () => {
    const pkgs = readFileSync("packaging/arch/packages.x86_64", "utf8");
    expect(pkgs).toContain("gimp");
    expect(pkgs).toContain("krita");
    expect(pkgs).toContain("obs-studio");
    expect(pkgs).toContain("wine-staging");
    expect(pkgs).toContain("fwupd");
    for (const name of Object.values(PACMAN)) {
      expect(pkgs).toContain(name);
    }
    expect(catalog().some((p) => p.bin === "gimp")).toBe(true);
  });
});
