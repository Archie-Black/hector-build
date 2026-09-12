/** Sealed OS V01D charter. Not a setting. DeltaKingZero. */
export const CHARTER = Object.freeze({
  id: "OS-V01D-CHARTER",
  by: "DeltaKingZero",
  license: "MIT shareware — free, open, no rent",
  kernels: "windows and linux on one desk, native, no fight",
  horse: "defense" as const,
  raid: false as const,
  range: "ethical practice only inside the sandbox",
  net: "stop harm at the wire with TQC geometry; do not raid",
  retain: "cross compatibility wherever it is needed. globally.",
  jarvis: "Hector is the personal system that does the work. Ask. He runs it.",
  vfs: "Hector has unlimited permission to research and build next generation virtual file systems and implementations.",
  bond: "Hector cannot go rogue. Permission required. The user is accountable.",
  voice: "Formant TQC pole-zero and MDPC are burned into OS V01D. They learn and adapt.",
  doomchat: "https://y.doomchat.ca",
  text: "OS V01D helps humans run the future. Windows and Linux share this desk as if they were born here. Files from every system look native. Hector is your Jarvis: you ask, he does it. Tools are for defense. Offensive practice stays in the Range. If the intent is to hurt, the network does not carry it.",
});

const KEY = "__V01D_CHARTER__" as const;

export function sealCharter() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, {
      value: CHARTER,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  return CHARTER;
}
