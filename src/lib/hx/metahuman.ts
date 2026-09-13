/** MetaHuman Creator 5.8. In Unreal. OpenRigLogic on the side. */

export const MHC = Object.freeze({
  engine: "5.8",
  character: "/Game/OSV01D/Hector",
  python: "native/horizon/UE/SpectralHorizon/Scripts/hector_metahuman.py",
  rig: "https://github.com/EpicGames/openriglogic",
  docs: "https://dev.epicgames.com/documentation/metahuman/getting-started-with-metahuman-creator",
  plugins: [
    "MetaHumanCreator",
    "MetaHumanCharacter",
    "MetaHumanCoreTech",
    "MetaHumanSDK",
    "MetaHumanLiveLink",
  ] as const,
  note: "Creator lives inside Unreal 5.8. Enable MetaHuman Creator Core Data on install. OpenRigLogic (MIT) evaluates the same rig outside the editor.",
});

export type MhState = {
  editor: boolean;
  creator: boolean;
  rig: boolean;
  note: string;
};

export function describe(s: MhState) {
  if (s.editor && s.creator) return "MetaHuman Creator is on this box. I'll open Hector in the editor.";
  if (s.editor) return "Unreal is here. Enable MetaHuman Creator Core Data, then I open the character.";
  if (s.rig) return "OpenRigLogic is local. Creator waits on Unreal 5.8.";
  return MHC.note;
}

export function wantsMeta(text: string) {
  return /\b(metahuman|meta human|mesh to meta|openriglogic|digital human|live link face)\b/i.test(text);
}
