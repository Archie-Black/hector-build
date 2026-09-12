import { createFileRoute } from "@tanstack/react-router";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { GODOT_PROJECT, godotMissing } from "@/lib/hx/godot";

const CANDIDATES = [
  process.env.GODOT47,
  `${process.env.HOME}/.local/share/hector-build/runtime/godot/Godot`,
  `${process.env.HOME}/Godot_v4.7-stable_linux.x86_64`,
  "/opt/godot/Godot",
].filter(Boolean) as string[];

async function find() {
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

export const Route = createFileRoute("/api/v1/hx/godot")({
  server: {
    handlers: {
      GET: async () => {
        const editor = await find();
        if (!editor) return Response.json(godotMissing());
        return Response.json({ ok: true, editor, project: GODOT_PROJECT, note: "Godot 4.7 ready." });
      },
      POST: async () => {
        const editor = await find();
        if (!editor) return Response.json(godotMissing(), { status: 424 });
        spawn(editor, ["--editor", "--path", "native/horizon/Godot"], { detached: true, stdio: "ignore" }).unref();
        return Response.json({ ok: true, editor, project: GODOT_PROJECT, note: "Opening Godot 4.7." });
      },
    },
  },
});
