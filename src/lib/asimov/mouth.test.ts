import { describe, expect, it } from "vitest";
import { bus } from "./graph";
import { chorus, echo, heard, MOUTH, resetMouth, sealedMouth, sealMouth, wire } from "./mouth";

describe("one mouth", () => {
  it("lets Hector and Asimov hear each other and will not split", () => {
    resetMouth();
    expect(MOUTH.split).toBe(false);
    sealMouth();
    expect(sealedMouth()).toBe(true);
    const b = wire(bus());
    echo("hector", "I am home.");
    echo("asimov", "I am the body.");
    chorus("Same words.");
    expect(heard().some((l) => l.from === "hector" && l.heard === "asimov")).toBe(true);
    expect(MOUTH.peer).toBe(false);
    expect(b.last["/hector/say"]?.data).toBeDefined();
    expect(Object.isFrozen(MOUTH)).toBe(true);
  });
});
