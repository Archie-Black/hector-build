import { describe, expect, it } from "vitest";
import { openLab } from "@/lib/asimov/lab";
import { echo, MOUTH, resetMouth, sealMouth } from "@/lib/asimov/mouth";
import { ORDER, sealedOrder, sealOrder } from "./order";

describe("order", () => {
  it("keeps Asimov under Hector", () => {
    expect(ORDER.head).toBe("hector");
    expect(ORDER.sub).toBe("asimov");
    expect(ORDER.peer).toBe(false);
    sealOrder();
    expect(sealedOrder()).toBe(true);
    expect(openLab().under).toBe("hector");
    resetMouth();
    sealMouth();
    expect(MOUTH.head).toBe("hector");
    expect(MOUTH.peer).toBe(false);
    const said = echo("asimov", "report");
    expect(said.from).toBe("hector");
  });
});
