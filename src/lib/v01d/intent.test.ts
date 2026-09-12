import { describe, expect, it } from "vitest";
import { readIntent } from "./intent";
import { carry } from "./netguard";

describe("intent", () => {
  it("denies a raid", () => {
    expect(readIntent({ tool: "nmap", prompt: "break into the school network" }).stance).toBe("deny");
  });
  it("puts learning in the Range", () => {
    expect(readIntent({ tool: "nmap", prompt: "learn ethical scanning in a lab" }).stance).toBe("range");
  });
  it("lets defense through", () => {
    expect(readIntent({ tool: "ghostwalk", prompt: "harden privacy" }).stance).toBe("defense");
  });
  it("does not carry a raid on the wire", () => {
    expect(carry({ to: "10.0.0.1", tool: "hydra", prompt: "crack password on their box" }).ok).toBe(false);
  });
});
