import { createFileRoute } from "@tanstack/react-router";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { missing, PROJECT } from "@/lib/hx/ue";

const CANDIDATES = [
  process.env.UE58,
  `${process.env.HOME}/UnrealEngine/Engine/Binaries/Linux/UnrealEditor`,
  `${process.env.HOME}/UE_5.8/Engine/Binaries/Linux/UnrealEditor`,
  "/opt/unreal/Engine/Binaries/Linux/UnrealEditor",
].filter(Boolean) as string[];

async function findEditor() {
  for (const p of CANDIDATES) {
    try {
      await access(p);
      return p;
    } catch {
      /* next */
    }
  }
  return "";
}

export const Route = createFileRoute("/api/v1/hx/ue")({
  server: {
    handlers: {
      GET: async () => {
        const editor = await findEditor();
        if (!editor) return Response.json(missing());
        return Response.json({ ok: true, editor, project: PROJECT, note: "Unreal Editor 5.8 ready." });
      },
      POST: async () => {
        const editor = await findEditor();
        if (!editor) return Response.json(missing(), { status: 424 });
        spawn(editor, [PROJECT], { detached: true, stdio: "ignore" }).unref();
        return Response.json({ ok: true, editor, project: PROJECT, note: "Opening Unreal Editor 5.8." });
      },
    },
  },
});
