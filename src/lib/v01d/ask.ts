import type { AppId } from "@/lib/horsemen/layout";
import { readIntent } from "./intent";
import { inquisitor, prefer, type Voice } from "./inquisitor";
import { has } from "./lexicon";
import { hear } from "./place";
import { plan } from "./runtime";
import { native } from "./vfs";

export type Job = {
  app?: AppId;
  tile?: boolean;
  run?: string;
  say: string;
  voice?: Voice;
};

function route(t: string, k: string): Job | null {
  if (has(t, "programs") || /\b(program|app|software)\b/.test(k)) {
    return { app: "programs", say: "Programs. Windows and Linux. Same folder." };
  }
  if (has(t, "share") || /\b(share|samba|photo|picture|media)\b/.test(k)) {
    return { app: "files", say: "Shared. Pictures, media, files. On this house network." };
  }
  if (has(t, "files") || /\b(file|folder|document|download|ntfs|ext4)\b/.test(k) || /^open /.test(k)) {
    const n = native(t.replace(/^open\s+/i, ""));
    return { app: "files", say: `Opening files. ${n.kind === "win" ? "Windows path, native here." : "Linux path, native here."}` };
  }
  if (/\b(browse|web|search|google|site)\b/.test(k)) {
    return { app: "ghostwalk", say: "GhostWalk. I will not be followed." };
  }
  if (/\b(note|remember|todo|sticky)\b/.test(k)) {
    return { app: "notes", say: "GhostIT. I will keep a copy." };
  }
  if (/\b(setting|wifi|network|sound)\b/.test(k)) {
    return { app: "settings", say: "Settings." };
  }
  if (/\b(arrange|tidy|tile)\b/.test(k)) {
    return { tile: true, say: "Lining windows up." };
  }
  if (/\b(who are you|jarvis|hector)\b/.test(k) || k === "who") {
    return { say: "Hector. OS V01D. You ask. I run it. Windows or Linux, same desk." };
  }
  const run = t.match(/\b(run|open|launch|start)\s+(\S+)/i);
  if (run) {
    const file = run[2];
    const go = plan(file);
    return { run: file, app: "terminal", say: go.note };
  }
  return null;
}

/** You ask. Hector does it. Mid-task words land without losing the place. */
export function ask(text: string): Job {
  const t = text.trim();
  if (!t) return { say: "Say what you need.", voice: "ask" };
  const intent = readIntent({ tool: "hector", prompt: t });
  if (intent.stance === "deny") {
    const cut = inquisitor(intent.why, intent.stance, t, prefer());
    return { say: cut.say, voice: cut.voice };
  }
  if (intent.stance === "range") {
    const cut = inquisitor(intent.why, intent.stance, t, prefer());
    return { say: cut.say, voice: cut.voice };
  }

  const fly = hear(t);
  const job = route(t, t.toLowerCase());
  const base = job || { app: "notes" as const, say: `${fly.say} Pinning so it does not get lost.` };
  const say = fly.how === "start" ? base.say : `${fly.say} ${base.say}`;
  const cut = inquisitor(say, intent.stance, t, prefer());
  return { ...base, say: cut.voice === "silent" ? say : cut.say, voice: cut.voice };
}
