import { STUDIO } from "@/lib/forge/studio";

export const SUITE = Object.freeze({
  name: "Genesis HX Suite",
  home: "/v01d/suite",
  note: "Create here. Stream here. Nothing leaves the box unless you send it.",
});

export type Floor = "photo" | "vector" | "paint" | "world" | "motion" | "sound" | "live" | "spark" | "forge";

export type Tool = { id: string; floor: Floor; bin: string; title: string; job: string };

export const FLOORS: { id: Floor; title: string; blurb: string }[] = [
  { id: "photo", title: "Photo", blurb: "Still pictures. RAW. Layers. Heal." },
  { id: "vector", title: "Vector", blurb: "Lines, type, UI. SVG that stays sharp." },
  { id: "paint", title: "Paint", blurb: "Brushes. Comics. Concept." },
  { id: "world", title: "World", blurb: "3D. Mesh, light, MetaHuman, render." },
  { id: "motion", title: "Motion", blurb: "Cut. Grade. Ship the picture." },
  { id: "sound", title: "Sound", blurb: "Podcast desk. Mix. Caption." },
  { id: "forge", title: "Forge", blurb: "Ardour. Seal the bounce. Aether in the room." },
  { id: "live", title: "Live", blurb: "Stream and talk. Scenes already built." },
  { id: "spark", title: "Spark", blurb: "Local image graphs. Weights on disk." },
];

export const TOOLS: Tool[] = [
  { id: "gimp", floor: "photo", bin: "gimp", title: "GIMP", job: "Layers, masks, heal, plugins. The photo desk." },
  { id: "darktable", floor: "photo", bin: "darktable", title: "Darktable", job: "RAW lighttable. Non-destructive color." },
  { id: "inkscape", floor: "vector", bin: "inkscape", title: "Inkscape", job: "Nodes, paths, SVG. Type that prints." },
  { id: "penpot", floor: "vector", bin: "penpot", title: "Penpot", job: "UI boards. Local. http://127.0.0.1:9001" },
  { id: "krita", floor: "paint", bin: "krita", title: "Krita", job: "Brush engines, animation, comics." },
  { id: "blender", floor: "world", bin: "blender", title: "Blender", job: "Model, rig, sim, render, track." },
  { id: "metahuman", floor: "world", bin: "unreal", title: "MetaHuman", job: "Creator in UE 5.8. Mesh to Meta. OpenRigLogic on the side." },
  { id: "kdenlive", floor: "motion", bin: "kdenlive", title: "Kdenlive", job: "Multi-track cut. Audio mix. FX." },
  { id: "audacity", floor: "sound", bin: "audacity", title: "Audacity", job: "48 kHz desk. Record, edit, mix." },
  { id: "ardour", floor: "forge", bin: "ardour", title: "Ardour", job: STUDIO.rack[0]!.job },
  { id: "cardinal", floor: "forge", bin: "cardinal", title: "Cardinal", job: STUDIO.rack[1]!.job },
  { id: "surge", floor: "forge", bin: "surge-xt", title: "Surge XT", job: STUDIO.rack[4]!.job },
  { id: "vital", floor: "forge", bin: "vital", title: "Vital", job: STUDIO.rack[5]!.job },
  { id: "obs", floor: "live", bin: "obs", title: "OBS", job: "Scenes, NDI, StreamFX. Go live." },
  { id: "comfy", floor: "spark", bin: "comfyui", title: "ComfyUI", job: "Local graphs. Flux when the weight is here." },
];

export const FILTERS = [
  { id: "heal", floor: "photo" as Floor, name: "Heal", how: "Spot heal and clone. Dust off the plate." },
  { id: "curves", floor: "photo" as Floor, name: "Curves", how: "RGB and luma curves. Keep the blacks honest." },
  { id: "unsharp", floor: "photo" as Floor, name: "Unsharp", how: "Catch light on edges. Do not crunch skin." },
  { id: "dehaze", floor: "photo" as Floor, name: "Dehaze", how: "Lift veils. Hold the sky." },
  { id: "film", floor: "photo" as Floor, name: "Film", how: "Grain + mild roll-off. Not a filter sandwich." },
  { id: "bw", floor: "photo" as Floor, name: "Mono", how: "Channel mixer. Yellow filter on faces." },
  { id: "raw", floor: "photo" as Floor, name: "RAW", how: "Darktable: exposure, white, filmic." },
  { id: "node", floor: "vector" as Floor, name: "Nodes", how: "Break paths. Join. Offset." },
  { id: "type", floor: "vector" as Floor, name: "Type", how: "Convert to path last. Kern by eye." },
  { id: "board", floor: "vector" as Floor, name: "Board", how: "Penpot frame. Components, not copies." },
  { id: "brush", floor: "paint" as Floor, name: "Brush", how: "Krita: size on pressure, opacity on tilt." },
  { id: "layer", floor: "paint" as Floor, name: "Layers", how: "Line, color, shadow, light. Named." },
  { id: "mesh", floor: "world" as Floor, name: "Mesh", how: "Quad flow. Apply scale. Shade smooth." },
  { id: "light", floor: "world" as Floor, name: "Light", how: "One key. One fill. World HDRI." },
  { id: "grade", floor: "motion" as Floor, name: "Grade", how: "Lift, gamma, gain. Skin last." },
  { id: "cut", floor: "motion" as Floor, name: "Cut", how: "On the blink. Audio tells the truth." },
];

export const STREAMS = [
  { id: "doomchat", name: "DooMChaT", where: "y.doomchat.ca", w: 1920, h: 1080, fps: 60, kbps: 6000, scene: "desk+cam" },
  { id: "wide", name: "Stage", where: "RTMP you name", w: 1920, h: 1080, fps: 60, kbps: 8000, scene: "wide+game" },
  { id: "talk", name: "Talk", where: "RTMP you name", w: 1920, h: 1080, fps: 30, kbps: 4500, scene: "cam+notes" },
  { id: "phone", name: "Vertical", where: "Shorts / Reels", w: 1080, h: 1920, fps: 30, kbps: 4000, scene: "9:16" },
];

export const PODS = [
  { id: "solo", name: "Solo", rate: 48000, ch: 1, bits: 24, note: "One mic. Gate. Light compress." },
  { id: "two", name: "Two chairs", rate: 48000, ch: 2, bits: 24, note: "Two tracks. Pan L/R. High-pass 80." },
  { id: "field", name: "Field", rate: 48000, ch: 2, bits: 24, note: "Lav + room. Watch the wind." },
  { id: "mix", name: "Mix down", rate: 48000, ch: 2, bits: 16, note: "Loud, not crushed. -16 LUFS." },
];

export const LOOKS = [
  { id: "void", name: "Void", note: "Vanta, cobalt, uranium on glass." },
  { id: "ink", name: "Ink", note: "Paper white. Black line. Quiet UI." },
  { id: "film", name: "Film", note: "Warm grade. Soft shoulder." },
];

export function pick(id: string) {
  return TOOLS.find((t) => t.id === id || t.bin === id);
}

export function onFloor(floor: Floor) {
  return TOOLS.filter((t) => t.floor === floor);
}

export function wantsSuite(text: string) {
  return /\b(genesis|gimp|darktable|inkscape|penpot|krita|blender|obs|kdenlive|audacity|comfy|whisper|podcast|stream|broadcast|multimedia suite|paint|caption|photo editor|ardour|forge|aether)\b/i.test(text);
}

export function vertical(inName: string) {
  const out = inName.replace(/(\.[^.]+)?$/, "-9x16$1") || "out-9x16.mp4";
  return ["ffmpeg", "-y", "-i", inName, "-vf", "crop=ih*9/16:ih,scale=1080:1920", "-c:a", "copy", out];
}

export function caption(inName: string) {
  return ["python3", "packaging/suite/caption.py", inName];
}

export function streamCmd(id: string) {
  const s = STREAMS.find((x) => x.id === id);
  if (!s) return ["obs"];
  return ["obs", `--profile`, `genesis-${s.id}`, `--collection`, s.scene];
}
