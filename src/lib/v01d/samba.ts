import { readIntent } from "./intent";

export type Share = {
  id: "files" | "pictures" | "media" | "programs";
  name: string;
  path: string;
  who: string;
};

export const SHARES: Share[] = [
  { id: "files", name: "Files", path: "/v01d/home", who: "people you allow" },
  { id: "pictures", name: "Pictures", path: "/v01d/home/Pictures", who: "people you allow" },
  { id: "media", name: "Media", path: "/v01d/media", who: "people you allow" },
  { id: "programs", name: "Programs", path: "/v01d/programs", who: "this machine" },
];

export function unc(id: Share["id"]) {
  return `\\\\V01D\\${id[0].toUpperCase()}${id.slice(1)}`;
}

export function smb(id: Share["id"]) {
  return `smb://v01d/${id}`;
}

/** Next-gen Samba. Same shares on Windows and Linux. Guest off. Defense only. */
export function conf() {
  const rooms = SHARES.map(
    (s) => `[${s.name}]
   path = ${s.path}
   browseable = yes
   read only = no
   guest ok = no
   veto files = /*.exe.raid/
`,
  ).join("\n");
  return `[global]
   workgroup = V01D
   server string = OS V01D
   map to guest = never
   smb ports = 445
   min protocol = SMB3
   smb encrypt = desired

${rooms}`;
}

export function mayShare(prompt: string) {
  const intent = readIntent({ tool: "samba", prompt });
  if (intent.stance === "deny") return { ok: false, note: intent.why };
  return { ok: true, note: "Share is on this house network. Not the open internet." };
}

export function listing() {
  return SHARES.map((s) => ({ ...s, unc: unc(s.id), smb: smb(s.id) }));
}
