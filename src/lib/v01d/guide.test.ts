import { describe, expect, it } from "vitest";
import { greet, hear } from "./guide";

describe("hector wsl guide", () => {
  it("asks once when the person is unsure", () => {
    const j = hear("I don't know");
    expect(j.verb).toBe("ask");
    expect(j.sh).toBe("");
    expect(j.why).toMatch(/in charge/i);
    expect(greet(true, "yes")).toMatch(/why/i);
    expect(greet(true, "no")).toMatch(/won't explain/i);
  });

  it("turns windows-speak into linux work and teaches why", () => {
    const v = hear("install vlc");
    expect(v.verb).toBe("pacman");
    expect(v.inner).toMatch(/pacman -S --noconfirm vlc/);
    expect(v.what).toMatch(/package list/i);
    expect(v.why).toMatch(/Setup\.exe/i);
    expect(hear("keep linux up to date").what).toMatch(/newer copies/i);
    expect(hear("my files").why).toMatch(/one pile of files/i);
    expect(hear("run C:\\\\Games\\\\play.exe").what).toMatch(/Wine/i);
  });
});
