import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectFolderBots, fnv, kindOf } from "./protocol.ts";
import { joinPeer, leasePath, postNote, registerLink, syncFile, materializeShare } from "./room.ts";
import { puttyCommand, safeCollabCmd, safeSshHost } from "./wire.ts";

describe("shared workspace", () => {
  it("classifies grok build and other bots", () => {
    assert.equal(kindOf("Grok Build"), "grok-build");
    assert.equal(kindOf("Spectral HX"), "hx");
    const bots = detectFolderBots({ "AGENTS.md": "# App Builder\nYou are Grok Build\n", ".grok/skills/x.md": "" });
    assert.ok(bots.some((b) => b.kind === "grok-build"));
  });

  it("lets a second bot join and talk", () => {
    const a = joinPeer({ name: "Grok Build" });
    assert.equal(a.peer.kind, "grok-build");
    const note = postNote({ from: a.peer.id, to: "hector", kind: "task", body: "patch login" });
    assert.equal(note.kind, "task");
  });

  it("refuses a file lease held by someone else", () => {
    const r = leasePath({ bot: "hector", path: "src/share-lease-test.ts", seconds: 60 });
    assert.equal(r.ok, true);
    const deny = leasePath({ bot: "grok-build", path: "src/share-lease-test.ts", seconds: 60 });
    assert.equal(deny.ok, false);
  });

  it("syncs when the hash matches", () => {
    const first = syncFile({ bot: "hector", path: "demo/x.ts", content: "a" });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const clash = syncFile({ bot: "hx", path: "demo/x.ts", content: "b", expect: "deadbeef" });
    assert.equal(clash.ok, false);
    const ok = syncFile({ bot: "hx", path: "demo/x.ts", content: "b", expect: first.head.hash });
    assert.equal(ok.ok, true);
  });

  it("materializes a share folder other bots can read", () => {
    const files = materializeShare({ "AGENTS.md": "Grok Build" });
    assert.ok(files[".hector/share/README.md"]);
    assert.ok(files[".hector/share/peers.json"]?.includes("hector"));
    assert.ok(files[".hector/share/links.json"]);
  });

  it("hashes are stable", () => {
    assert.equal(fnv("abc"), fnv("abc"));
    assert.notEqual(fnv("abc"), fnv("abd"));
  });

  it("SSH collab: LAN ok, metadata blocked, pipes blocked", () => {
    assert.equal(safeSshHost("192.168.1.10", "bot"), "192.168.1.10");
    assert.equal(safeSshHost("y.doomchat.ca", "bot"), "y.doomchat.ca");
    assert.equal(safeSshHost("169.254.1.1", "bot"), null);
    assert.equal(safeSshHost("evil.com", "bot"), null);
    assert.equal(safeCollabCmd("git status"), "git status");
    assert.equal(safeCollabCmd("rm -rf /"), null);
    assert.equal(safeCollabCmd("uname -a; cat /etc/shadow"), null);
    const link = registerLink({ from: "hector", to: "grok-build", kind: "putty", host: "127.0.0.1", port: 22, user: "dev" });
    assert.ok(puttyCommand(link).putty.includes("dev@127.0.0.1"));
  });
});
