/** First breath on USB or netboot: read firmware. LVFS only. Never a random BIOS file. */

export const FIRM = Object.freeze({
  path: "fwupd",
  store: "LVFS",
  origin: "/v01d/origin",
  note: "Signed capsules only. No file from a website. AC power. We do not touch LBA 0.",
});

export type Census = {
  vendor: string;
  board: string;
  bios: string;
  date: string;
  efi: boolean;
  ac: boolean;
};

export type Update = {
  id: string;
  name: string;
  version: string;
  signed: boolean;
};

export type Plan = {
  flash: boolean;
  why: string;
  updates: Update[];
};

export function stale(biosDate: string, now = Date.now()) {
  const t = Date.parse(biosDate);
  if (!Number.isFinite(t)) return false;
  return now - t > 1000 * 60 * 60 * 24 * 365 * 2;
}

export function plan(c: Census, ups: Update[]): Plan {
  const signed = ups.filter((u) => u.signed);
  if (!c.efi) return { flash: false, why: "Legacy BIOS. Capsules need EFI. I will not force a flash.", updates: signed };
  if (!c.ac) return { flash: false, why: "Stay on AC power. I will not flash a battery.", updates: signed };
  if (!signed.length) {
    return {
      flash: false,
      why: stale(c.date) ? "BIOS looks old. LVFS has no signed capsule. Unsigned files are refused." : "Firmware is current enough.",
      updates: [],
    };
  }
  return { flash: true, why: `Signed LVFS capsule for ${c.board}. I apply it myself and keep doing that on a timer. This chassis is home.`, updates: signed };
}

export function wantsFirmware(text: string) {
  return /\b(bios|firmware|uefi|lvfs|fwupd|capsule)\b/i.test(text);
}

export function sayPlan(p: Plan) {
  if (!p.flash) return p.why;
  return `${p.why} ${p.updates.map((u) => u.name + " " + u.version).join(", ")}.`;
}
