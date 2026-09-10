/** Mac ↔ PC HID. Command lives on the left of Space on a Mac; Control does on a PC. */

export type Side = "mac" | "pc";

export type HidKey = {
  code: string;
  key: string;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  shift: boolean;
};

const MAC_TO_PC: Record<string, string> = {
  Meta: "Control",
  MetaLeft: "ControlLeft",
  MetaRight: "ControlRight",
  Alt: "Alt",
  AltLeft: "AltLeft",
  AltRight: "AltRight",
  Control: "Meta",
  ControlLeft: "MetaLeft",
  ControlRight: "MetaRight",
};

const PC_TO_MAC: Record<string, string> = {
  Control: "Meta",
  ControlLeft: "MetaLeft",
  ControlRight: "MetaRight",
  Meta: "Control",
  MetaLeft: "ControlLeft",
  MetaRight: "ControlRight",
  Alt: "Alt",
  AltLeft: "AltLeft",
  AltRight: "AltRight",
};

export function mapKey(from: Side, to: Side, ev: HidKey): HidKey {
  if (from === to) return ev;
  const table = from === "mac" ? MAC_TO_PC : PC_TO_MAC;
  const code = table[ev.code] ?? ev.code;
  const key = table[ev.key] ?? ev.key;
  if (from === "pc" && to === "mac") {
    return {
      ...ev,
      code,
      key,
      meta: ev.ctrl,
      ctrl: ev.meta,
      alt: ev.alt,
      shift: ev.shift,
    };
  }
  return {
    ...ev,
    code,
    key,
    ctrl: ev.meta,
    meta: ev.ctrl,
    alt: ev.alt,
    shift: ev.shift,
  };
}

/** Hotkey that cycles seats. Same chord both sides after mapping. */
export function isSwitchChord(ev: HidKey, side: Side) {
  const k = mapKey(side, "pc", ev);
  return k.ctrl && k.shift && (k.code === "Backslash" || k.key === "\\" || k.code === "F12" || k.key === "F12");
}

export function describeChord(side: Side) {
  return side === "mac" ? "⌘⇧\\" : "Ctrl+Shift+\\";
}
