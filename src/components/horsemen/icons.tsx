import type { AppId } from "@/lib/horsemen/layout";
import { APPS } from "@/lib/horsemen/layout";

export const ICON: Record<AppId, string> = {
  files: "/horsemen/icons/files.png",
  programs: "/horsemen/icons/files.png",
  ghostwalk: "/horsemen/icons/ghostwalk.png?v=www",
  code: "/horsemen/icons/hx.png",
  terminal: "/horsemen/icons/terminal.png",
  security: "/horsemen/icons/security.png",
  notes: "/horsemen/icons/notes.png",
  settings: "/horsemen/icons/settings.png",
  trash: "/horsemen/icons/trash.png",
  portal: "/horsemen/icons/portal.png",
  crapple: "/horsemen/icons/crapple.svg",
  unix: "/horsemen/icons/crapple.svg",
  helix: "/horsemen/icons/helix.svg",
  room: "/horsemen/icons/room.svg",
  asimov: "/horsemen/icons/asimov.svg",
  forge: "/horsemen/icons/forge.svg",
  suite: "/horsemen/icons/suite.svg",
};

export function DeskIcons({ onOpen }: { onOpen: (id: AppId) => void }) {
  return (
    <ul className="absolute top-28 left-4 z-[5] flex flex-col gap-3">
      {APPS.filter((a) => a.desk).map((a) => (
        <li key={a.id}>
          <button type="button" onClick={() => onOpen(a.id)} className={`desk-icon ${a.id === "portal" ? "desk-portal" : ""} ${a.id === "code" ? "desk-hx" : ""}`} title={a.blurb}>
            <img src={ICON[a.id]} alt="" className="desk-art" crossOrigin="anonymous" />
            <span className="mt-1 max-w-20 text-center text-xs leading-tight text-ash drop-shadow">{a.title}</span>
          </button>
        </li>
      ))}
      <li>
        <a href="https://y.doomchat.ca" target="_blank" rel="noreferrer" className="desk-icon desk-portal" title="DooMChaT">
          <img src="/horsemen/icons/doomchat.png" alt="" className="desk-art" crossOrigin="anonymous" />
          <span className="mt-1 max-w-20 text-center text-xs leading-tight text-uranium drop-shadow">DooMChaT</span>
        </a>
      </li>
    </ul>
  );
}

export function AppGlyph({ id, className }: { id: AppId; className?: string }) {
  return <img src={ICON[id]} alt="" className={`desk-art-sm ${className ?? "size-5"}`} crossOrigin="anonymous" />;
}

export function FileGlyph() {
  return <img src={ICON.files} alt="" className="size-4 object-contain" crossOrigin="anonymous" />;
}
