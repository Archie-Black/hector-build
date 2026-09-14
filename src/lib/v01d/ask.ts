import type { AppId } from "@/lib/horsemen/layout";
import { readIntent } from "./intent";
import { inquisitor, prefer, type Voice } from "./inquisitor";
import { has } from "./lexicon";
import { hear } from "./place";
import { plan } from "./runtime";
import { native } from "./vfs";
import { dispatch } from "@/lib/sentinel/swarm";
import { raise, sayHive, wantsHive } from "@/lib/sentinel/hive";
import { handle } from "@/lib/ghostwalk/morph";
import { planHelix, wantsHelix } from "@/lib/helix/plan";
import { wantsAsimov } from "@/lib/asimov/lab";
import { sayHome, wantsHome } from "@/lib/asimov/home";
import { chorus } from "@/lib/asimov/mouth";
import { wantsForge } from "@/lib/forge/seal";
import { wantsAether } from "@/lib/hx/aether";
import { wantsSuite } from "@/lib/hx/suite";
import { wantsMeta } from "@/lib/hx/metahuman";
import { wantsWeights } from "@/lib/hx/weights";
import { sayHeal } from "@/lib/hx/weights-heal";
import { sayMetal } from "@/lib/hector/metal";
import { sayHal } from "./hal";
import { sayRl } from "@/lib/hector/rl";
import { wantsRoom } from "./wsl";
import { answer, wantsKb } from "@/lib/hector/kb";
import { clear as clearComfort } from "./comfort";
import { saveTeach, wantsTeach } from "./teach";
import { wantsAlerts, wantsBackup, wantsHeal, wantsMesh, wantsRestore, wantsRoll, wantsScale } from "./cloud";
import { wantsFirmware, sayPlan, plan as firmPlan } from "./firmware";
import { feel, sayNerves, wantsNerves } from "./nerves";
import { sayHorizon, wantsHorizon } from "./horizon";
import { sayDensity, wantsDensity } from "@/lib/hx/density";
import { sayProto } from "@/lib/hx/proto";
import { sayVfs } from "@/lib/hector/vfs-learn";
import { firewall, split as splitCore, sayCores, wantsCores, which } from "@/lib/hector/cores";
import { saySign, wantsSign } from "./sign";
import { sayHear, wantsHear } from "@/lib/hector/hear";
import { sayDiagnose, wantsDiagnose } from "@/lib/hector/diagnose";
import { sayBrain, wantsBrain } from "@/lib/hector/brain";
import { sayJoin, wantsJoin } from "./weave";
import { sayDownloads, wantsDownloads } from "./downloads";

export type Job = {
  app?: AppId;
  tile?: boolean;
  run?: string;
  say: string;
  voice?: Voice;
  habitat?: string;
  jersey?: number;
};

function route(t: string, k: string): Job | null {
  if (wantsFirmware(t)) {
    return { run: "firmware", say: sayPlan(firmPlan({ vendor: "local", board: "this machine", bios: "", date: "", efi: true, ac: true }, [])) };
  }
  if (has(t, "heal") || wantsHeal(t)) {
    return { run: "fabric-heal", say: "I'll restart the website services if they crashed." };
  }
  if (wantsScale(t)) {
    return { run: "site-scale", say: "I'll add website copies. One healthy copy always stays up." };
  }
  if (wantsRoll(t)) {
    return { run: "site-roll", say: "I'll start a new website copy first, then stop the oldest." };
  }
  if (wantsBackup(t)) {
    return { run: "site-backup", say: "I'll copy the database only if it is healthy." };
  }
  if (wantsRestore(t)) {
    return { run: "site-restore", say: "I'll load the newest dump only if the database is accepting connections." };
  }
  if (wantsMesh(t)) {
    return { run: "site-mesh", say: "I'll write a WireGuard slot for the second box, then copy dumps when it answers." };
  }
  if (wantsAlerts(t)) {
    return { run: "site-alerts", say: "I'll check website alerts for doomchat.ca." };
  }
  if (wantsDownloads(t)) {
    return { app: "files", run: "downloads", say: sayDownloads() };
  }
  if (/\b(spectral hx|write (a |me a )?(program|app)|open the ide|code this)\b/i.test(k) || /^open spectral/i.test(k)) {
    return { app: "code", run: "hx", say: "Spectral HX. Tell me what to build. Ghosts take the work." };
  }
  if (wantsHive(t)) {
    const h = raise(t);
    return { run: "hive", say: sayHive(h), jersey: h.jersey, app: "code" };
  }
  if (wantsHelix(t)) {
    const p = planHelix(t);
    return { app: "helix", run: `helix:${p.move}`, say: p.note };
  }
  if (/\b(how'?s the (hal|hardware)|hardware abstraction)\b/i.test(k)) {
    return { app: "asimov", run: "rdna", say: sayHal() };
  }
  if (/\b(how'?s the team|are they learning|rdna and cuda|metal team|reinforcement)\b/i.test(k)) {
    return { app: "asimov", run: "rdna", say: `${sayMetal()} ${sayRl()}.` };
  }
  if (wantsKb(t)) {
    const say = answer(t);
    return { say: say || "I do not have a template for that yet. Tell me the steps once and I will keep it as a macro." };
  }
  if (wantsWeights(t)) {
    return { app: "suite", run: "weights-heal", say: sayHeal({}) };
  }
  if (wantsMeta(t)) {
    return { app: "suite", say: "Genesis World. MetaHuman Creator in Unreal 5.8. I'll open Hector if the editor is on this box." };
  }
  if (wantsAether(t) || wantsForge(t)) {
    return { app: "forge", say: wantsAether(t) ? "Genesis HX Forge. Aether. I'll put the sound where you point." : "Genesis HX Forge. Ardour records. I'll watermark the bounce, hash it, and file the receipt." };
  }
  if (wantsSuite(t)) {
    return { app: "suite", say: "Genesis HX Suite. Photo, vector, paint, world, motion, sound, live, forge. I'll open the floor you named." };
  }
  if (wantsSign(t)) {
    return { say: saySign() };
  }
  if (wantsHear(t)) {
    return { say: sayHear() };
  }
  if (wantsDiagnose(t)) {
    return { say: sayDiagnose() };
  }
  if (wantsJoin(t)) {
    return { run: "join", say: sayJoin() };
  }
  if (wantsCores(t)) {
    return { say: sayCores() };
  }
  if (wantsHorizon(t) || wantsDensity(t)) {
    return { app: "files", say: wantsHorizon(t) ? `${sayHorizon()} ${sayVfs()} ${sayProto()}` : sayDensity() };
  }
  if (wantsNerves(t)) {
    return { say: sayNerves() };
  }
  if (wantsBrain(t) || wantsHome(t) || wantsAsimov(t)) {
    return { app: "asimov", run: "rdna", say: wantsBrain(t) ? sayBrain() : sayHome() };
  }
  if (wantsRoom(t)) {
    const tch = wantsTeach(t);
    if (tch) saveTeach(tch);
    return { app: "room", say: "Linux room. Tell me what you want. I'll do the Linux." };
  }
  const tch = wantsTeach(t);
  if (tch) {
    saveTeach(tch);
    return { app: "room", say: tch === "yes" ? "I'll teach as I work." : "I'll just do the job." };
  }
  if (/\b(how (should|do) (this|it) feel|used to windows|scared of linux|ask me again)\b/i.test(k)) {
    clearComfort();
    return { run: "comfort", say: "I'll ask how this computer should feel." };
  }
  const g = handle(t);
  if (g.browse || ((g.how === "crapple" || g.how === "unix" || g.how === "wine-staging" || g.how === "native") && /[./\\:]/.test(g.href))) {
    return { app: g.app, run: g.browse ? undefined : `${g.how}:${g.href}`, say: g.say, habitat: g.habitat };
  }
  if (/\bcrapple\b/i.test(k)) {
    return { app: "crapple", say: "Crapple. Darwin window. Windows key is Command." };
  }
  if (has(t, "programs") || /\b(program|app|software)\b/.test(k)) {
    return { app: "programs", say: "Programs. Windows and Linux. Same folder." };
  }
  if (has(t, "share") || /\b(share|samba|photo|picture|media)\b/.test(k)) {
    return { app: "files", say: "Shared. Pictures, media, files. On this house network." };
  }
  if (has(t, "files") || /\b(file|folder|document|download|ntfs|ext4)\b/.test(k) || (/^open /.test(k) && !/^open\s+(https?:\/\/|www\.)/i.test(t))) {
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

function out(job: Job): Job {
  chorus(job.say);
  return job;
}

/** You ask. Hector does it. Mid-task words land without losing the place. */
export function ask(text: string): Job {
  const t = text.trim();
  if (!t) return out({ say: "Say what you need.", voice: "ask" });
  const intent = readIntent({ tool: "hector", prompt: t });
  if (intent.stance === "deny") {
    const cut = inquisitor(intent.why, intent.stance, t, prefer());
    return out({ say: cut.say, voice: cut.voice });
  }
  if (intent.stance === "range") {
    const cut = inquisitor(intent.why, intent.stance, t, prefer());
    return out({ say: cut.say, voice: cut.voice });
  }

  const fly = hear(t);
  dispatch(t);
  feel("cranial", "chat", t);
  const job = route(t, t.toLowerCase());
  const core = splitCore(t);
  const base = job || { app: "notes" as const, say: core.core === "diplomat" ? core.say : `${fly.say} Pinning so it does not get lost.` };
  const say = fly.how === "start" ? base.say : `${fly.say} ${base.say}`;
  const cut = inquisitor(say, intent.stance, t, prefer());
  const raw = { ...base, say: cut.voice === "silent" ? say : cut.say, voice: cut.voice };
  return out(firewall(raw, which(t), t));
}
