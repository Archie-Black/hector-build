export type Ue = { ok: boolean; editor: string; project: string; note: string };

export const PROJECT = "native/horizon/UE/SpectralHorizon/SpectralHorizon.uproject";

export function missing(): Ue {
  return {
    ok: false,
    editor: "",
    project: PROJECT,
    note: "Unreal Editor 5.8 is not on this machine yet. The project is ready. Hector opens it when the editor is installed.",
  };
}
