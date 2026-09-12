/** Ethical practice only. Emulators. Nothing leaves. */
export const RANGE = Object.freeze({
  id: "OS-V01D-RANGE",
  net: false,
  emu: ["qemu", "dosbox", "wine-prefix-lab"],
  note: "Learn here. Packets do not go out. Hector watches the tools.",
});

export function admit(prompt: string) {
  return {
    ok: true,
    island: true,
    emu: RANGE.emu[0],
    note: RANGE.note,
    prompt,
  };
}
