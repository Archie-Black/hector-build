import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickRider, WEB_RIDERS } from "./ride.ts";
import { wantsDarkHorse } from "./dark-horse.ts";
import { punisherFetch } from "./punisher.ts";

describe("web riders", () => {
  it("names Punisher and Dark Horse", () => {
    assert.deepEqual(WEB_RIDERS.map((r) => r.id), ["punisher", "darkhorse"]);
  });

  it("onion goes to Dark Horse", () => {
    assert.equal(wantsDarkHorse("http://example.onion/"), true);
    assert.equal(pickRider("http://example.onion/path"), "darkhorse");
    assert.equal(pickRider("https://doomchat.ca"), "punisher");
    assert.equal(pickRider("https://doomchat.ca", true), "darkhorse");
  });

  it("Punisher refuses private hosts", async () => {
    const r = await punisherFetch("http://127.0.0.1/");
    assert.equal("error" in r, true);
  });
});
