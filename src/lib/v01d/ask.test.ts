import { describe, expect, it } from "vitest";
import { ask } from "./ask";

describe("ask", () => {
  it("opens files as native", () => {
    expect(ask("open C:\\Users\\Dark0\\Docs").app).toBe("files");
  });
  it("refuses a raid", () => {
    expect(ask("break into the school network").app).toBeUndefined();
  });
  it("opens Crapple for a Mac program", () => {
    expect(ask("open /Applications/Notes.app").app).toBe("crapple");
    expect(ask("run /usr/local/bin/ksh").app).toBe("unix");
    expect(ask("open https://doomchat.ca").app).toBe("ghostwalk");
  });
  it("opens the Linux room because Arch WSL is always on", () => {
    expect(ask("open the linux room").app).toBe("room");
  });
  it("opens Helix to convert or wrap a program", () => {
    expect(ask("convert play.exe to linux").app).toBe("helix");
  });
  it("raises a swarm without extra chrome", () => {
    const j = ask("raise 200 agents to refactor the repository");
    expect(j.run).toBe("hive");
    expect(j.jersey).toBe(200);
    expect(j.app).toBe("code");
  });
  it("names the nerves", () => {
    expect(ask("what is the nervous system").say).toMatch(/nerves/i);
  });
  it("checks firmware before it talks about the desk", () => {
    expect(ask("check the bios").run).toBe("firmware");
  });
  it("answers from Hector's library", () => {
    expect(ask("need an invoice template").say).toMatch(/invoice/i);
  });
  it("opens Forge to seal a bounce", () => {
    expect(ask("protect this track").app).toBe("forge");
    expect(ask("spatial audio").app).toBe("forge");
    expect(ask("open krita").app).toBe("suite");
    expect(ask("open metahuman").app).toBe("suite");
    expect(ask("heal the weights").run).toBe("weights-heal");
  });
  it("opens Asimov 01 as an RDNA + CUDA team", () => {
    const j = ask("open asimov");
    expect(j.app).toBe("asimov");
    expect(j.run).toBe("rdna");
    expect(j.say).toMatch(/HAL/);
    expect(ask("how's the team").say).toMatch(/Hector/);
  });
  it("restarts website services without a new app", () => {
    expect(ask("restart the website").run).toBe("fabric-heal");
    expect(ask("scale the website").run).toBe("site-scale");
    expect(ask("backup the website").run).toBe("site-backup");
    expect(ask("restore the website").run).toBe("site-restore");
    expect(ask("add a website peer").run).toBe("site-mesh");
    expect(ask("replace website copies").run).toBe("site-roll");
    expect(ask("alert the website").run).toBe("site-alerts");
  });
  it("sends coding work to Spectral HX", () => {
    expect(ask("open spectral hx").app).toBe("code");
    expect(ask("write a program").app).toBe("code");
    expect(ask("write a program").run).toBe("hx");
  });
  it("opens VSCodium as the Spectral HX heavy editor", () => {
    expect(ask("open vscodium").app).toBe("code");
    expect(ask("open vscodium").run).toBe("codium");
  });
  it("routes Hyper PBX jobs through hx-exec", () => {
    expect(ask("open hyper pbx").app).toBe("code");
    expect(ask("open hyper pbx").run).toBe("hx-exec");
    expect(ask("open pbx console").run).toBe("hx-exec");
    expect(ask("open pbx").run).toBe("hx-exec");
  });
  it("opens Godot and Unreal for the OS look", () => {
    expect(ask("open godot").app).toBe("portal");
    expect(ask("open godot").run).toBe("godot");
    expect(ask("open unreal editor").run).toBe("ue");
  });
});
