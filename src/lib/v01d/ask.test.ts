import { describe, expect, it } from "vitest";
import { ask } from "./ask";

describe("ask", () => {
  it("opens files as native", () => {
    expect(ask("open C:\\Users\\Dark0\\Docs").app).toBe("files");
  });
  it("refuses a raid", () => {
    expect(ask("break into the school network").app).toBeUndefined();
  });
  it("knows who he is", () => {
    expect(ask("who are you").say).toMatch(/Hector/);
  });
});
