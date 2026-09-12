export type AppId = "files" | "programs" | "ghostwalk" | "code" | "terminal" | "security" | "notes" | "settings" | "trash" | "portal";

export type Rect = { x: number; y: number; w: number; h: number };

export type AppMeta = {
  id: AppId;
  title: string;
  blurb: string;
  desk: boolean;
};

export type Pane = {
  id: string;
  app: AppId;
  title: string;
  rect: Rect;
  z: number;
  leaving: boolean;
  max: boolean;
  hidden: boolean;
};

export const APPS: AppMeta[] = [
  { id: "files", title: "Files", blurb: "Windows and Linux files. Same folders.", desk: true },
  { id: "programs", title: "Programs", blurb: "Windows and Linux programs. Same folder.", desk: true },
  { id: "ghostwalk", title: "GhostWalk", blurb: "Browse without being followed.", desk: true },
  { id: "notes", title: "GhostIT", blurb: "Sticky notes for you and Hector. Markdown.", desk: true },
  { id: "portal", title: "Portal", blurb: "Games. Lava. DooMChaT.", desk: true },
  { id: "trash", title: "Trash", blurb: "Things you deleted.", desk: true },
  { id: "code", title: "Code", blurb: "Write and edit programs.", desk: false },
  { id: "terminal", title: "Terminal", blurb: "Type commands if you want to.", desk: false },
  { id: "security", title: "Security", blurb: "See that this machine is locked down.", desk: false },
  { id: "settings", title: "Settings", blurb: "Sound, network, and how this computer feels.", desk: false },
];

export const MENU = APPS.filter((a) => a.id !== "trash" && a.id !== "settings");

export function meta(id: AppId): AppMeta {
  return APPS.find((a) => a.id === id)!;
}

export function place(vw: number, vh: number): Rect {
  const w = Math.min(760, Math.max(320, vw - 48));
  const h = Math.min(520, Math.max(280, vh - 140));
  return { x: Math.round((vw - w) / 2), y: 88, w, h };
}

export function tiles(vw: number, vh: number, ids: AppId[]): Record<string, Rect> {
  const pad = 16;
  const dock = 24;
  const gap = 12;
  const top = 88;
  const usableH = Math.max(240, vh - dock - top - pad);
  const usableW = Math.max(280, vw - pad * 2);
  const n = Math.max(1, ids.length);
  const cols = n === 1 ? 1 : n === 2 ? 2 : Math.min(3, n);
  const rows = Math.ceil(n / cols);
  const cw = Math.floor((usableW - gap * (cols - 1)) / cols);
  const ch = Math.floor((usableH - gap * (rows - 1)) / rows);
  const out: Record<string, Rect> = {};
  ids.forEach((id, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out[id] = { x: pad + c * (cw + gap), y: top + r * (ch + gap), w: cw, h: ch };
  });
  return out;
}
