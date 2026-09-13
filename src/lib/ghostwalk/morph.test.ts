import { describe, expect, it } from "vitest";
import { extOf, handle, sniff, wantsBrowse } from "./morph";

describe("ghostwalk morph", () => {
  it("stays GhostWalk for the web", () => {
    const h = handle("https://doomchat.ca");
    expect(h.app).toBe("ghostwalk");
    expect(h.browse).toBe(true);
    expect(h.habitat).toBe("web");
    expect(wantsBrowse("open https://doomchat.ca")).toBe(true);
  });

  it("morphs windows, linux, and mac files to the right runtime", () => {
    expect(sniff("C:\\\\Games\\\\play.exe")).toBe("win");
    expect(handle("C:\\\\Games\\\\play.exe").how).toBe("wine-staging");
    expect(sniff("/usr/bin/vlc")).toBe("nix");
    expect(handle("/Applications/Notes.app").app).toBe("crapple");
    expect(handle("/usr/local/bin/ksh").app).toBe("unix");
    expect(extOf("page.HTML")).toBe("html");
  });
});
