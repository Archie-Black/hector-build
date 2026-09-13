import { describe, expect, it } from "vitest";
import { phones } from "./phones";

describe("paul lexicon", () => {
  it("says hector and hawking as words not letters", () => {
    expect(phones("Hector")).toEqual(["HH", "EH", "K", "T", "ER", "SIL"]);
    expect(phones("Look up")).toContain("UH");
    expect(phones("Hawking")).toContain("NG");
  });
});
