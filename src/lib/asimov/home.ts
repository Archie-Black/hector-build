/** The host is the body. Origin 0,0,0. Firmware is the skin. Motors on a separate robot still need a permit. */

import { seat, type Seat } from "@/lib/v01d/origin";
import { FIRM } from "@/lib/v01d/firmware";
import { LAWS } from "./laws";

export const HOME = Object.freeze({
  body: "host",
  name: "this chassis",
  origin: "/v01d/origin",
  skin: FIRM.path,
  note: "Hector lives in the machine. Census, HAL, signed firmware. A Gazebo bot is not this box.",
});

export type House = { body: "host"; seat: Seat; laws: typeof LAWS };

export function inhabit(): House {
  return { body: "host", seat: seat(true), laws: LAWS };
}

export function wantsHome(text: string) {
  return /\b(robotic home|host hardware|this (pc|machine|box|chassis)|install (the )?lab|asimov home)\b/i.test(text);
}

export function sayHome() {
  const h = inhabit();
  return `One brain. I am the left hemisphere. Asimov is the right. HAL is the nerves. TQC is the callosum. This chassis is home. Immutable. Seat ${h.seat.x},${h.seat.y},${h.seat.z}. I keep the BIOS on LVFS. I will not drive a robot without you.`;
}
