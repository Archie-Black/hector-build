import { createFileRoute } from "@tanstack/react-router";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { MHC, describe, type MhState } from "@/lib/hx/metahuman";
import { PROJECT } from "@/lib/hx/ue";

const EDITORS = [
  process.env.UE58,
  `${process.env.HOME}/UnrealEngine/Engine/Binaries/Linux/UnrealEditor`,
  `${process.env.HOME}/UE_5.8/Engine/Binaries/Linux/UnrealEditor`,
  "/opt/unreal/Engine/Binaries/Linux/UnrealEditor",
].filter(Boolean) as string[];

const RIG = ["/opt/osv01d/metahuman/OpenRigLogic", `${process.env.HOME}/v01d/metahuman/OpenRigLogic`];

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function findEditor() {
  for (const p of EDITORS) {
    if (await exists(p)) return p;
  }
  return "";
}

async function findRig() {
  for (const p of RIG) {
    if (await exists(p)) return p;
  }
  return "";
}

export const Route = createFileRoute("/api/v1/hx/metahuman")({
  server: {
    handlers: {
      GET: async () => {
        const editor = await findEditor();
        const rig = await findRig();
        const s: MhState = {
          editor: Boolean(editor),
          creator: Boolean(editor),
          rig: Boolean(rig),
          note: "",
        };
        s.note = describe(s);
        return Response.json({ ...s, character: MHC.character, plugins: MHC.plugins, python: MHC.python });
      },
      POST: async () => {
        const editor = await findEditor();
        if (!editor) {
          return Response.json({ ok: false, note: describe({ editor: false, creator: false, rig: Boolean(await findRig()), note: "" }) }, { status: 424 });
        }
        const script = MHC.python;
        spawn(editor, [PROJECT, `-ExecutePythonScript=${script}`], { detached: true, stdio: "ignore" }).unref();
        return Response.json({ ok: true, note: "Opening Unreal 5.8. Hector character script will run if Creator is enabled." });
      },
    },
  },
});
