import { wrap } from "@/lib/ghstkrt/knot";
import { readIntent } from "./intent";

export type Pkt = { to: string; tool: string; prompt: string };

/** Geometry on the wire. We cannot stop the attempt. We can refuse to carry it. */
export function carry(pkt: Pkt): { ok: boolean; braid: number; note: string } {
  const intent = readIntent({ tool: pkt.tool, prompt: pkt.prompt });
  const braid = knot(pkt.to + pkt.tool + pkt.prompt);
  if (intent.stance === "deny") return { ok: false, braid, note: intent.why };
  if (intent.stance === "range") return { ok: false, braid, note: `${intent.why} Not on this network.` };
  wrap(`${pkt.tool}:${pkt.to}`);
  return { ok: true, braid, note: "On the wire. Defense." };
}

function knot(s: string) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < s.length; i++) {
    a = (a + s.charCodeAt(i) * (i + 3)) % 9973;
    b = (b + a * 7) % 9967;
  }
  return (a ^ b) >>> 0;
}
