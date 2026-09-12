export type Gd = { ok: boolean; editor: string; project: string; note: string };

export const GODOT_PROJECT = "native/horizon/Godot/project.godot";

export function godotMissing(): Gd {
  return {
    ok: false,
    editor: "",
    project: GODOT_PROJECT,
    note: "Godot 4.7 is not on this machine yet. The project is ready. Hector opens it when the editor is installed.",
  };
}
