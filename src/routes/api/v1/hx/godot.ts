import { createFileRoute } from "@tanstack/react-router";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { GODOT_PROJECT, godotMissing } from "@/lib/hx/godot";
import { LOOK } from "@/lib/v01d/aesthetics";

const CANDIDATES = [
  process.env.GODOT47,
  `${process.env.HOME}/.local/share/hector-build/runtime/godot/Godot`,
  `${process.env.HOME}/Godot_v4.7-stable_linux.x86_64`,
  "/opt/godot/Godot",
  "/usr/bin/godot",
  "/usr/local/bin/godot",
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
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { kind?: string };
        const editor = await find();
        if (!editor) return Response.json(godotMissing(), { status: 424 });
        const voidDesk = body.kind === "void";
        const path = voidDesk ? "native/horizon/Godot/void" : "native/horizon/Godot";
        const project = voidDesk ? LOOK.godot.desk : GODOT_PROJECT;
        spawn(editor, ["--editor", "--path", path], { detached: true, stdio: "ignore" }).unref();
        return Response.json({ ok: true, editor, project, note: voidDesk ? "Opening Godot void desk." : "Opening Godot 4.7." });
      },
    },
  },
});
