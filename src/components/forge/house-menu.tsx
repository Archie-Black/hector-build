import { Link } from "@tanstack/react-router";
import { useForgeStore } from "@/lib/forge-store";
import { desktopApi } from "@/lib/desktop/native";

export function HouseMenu() {
  return (
    <nav className="flex items-center gap-1">
      <Link
        to="/hx"
        className="flex h-11 items-center rounded-md px-3 text-sm glass-thin"
        onClick={(e) => {
          const desk = desktopApi();
          if (!desk) return;
          e.preventDefault();
          void desk.openHx();
        }}
      >
        Spectral HX
      </Link>
      <Link to="/chat" className="flex h-11 items-center rounded-md px-3 text-sm glass-thin">
        Chat
      </Link>
      <button
        type="button"
        className="flex h-11 items-center rounded-md px-3 text-sm glass-thin"
        onClick={() => useForgeStore.getState().setSurface("studio")}
      >
        Studio
      </button>
      <button
        type="button"
        className="flex h-11 items-center rounded-md px-3 text-sm glass-thin"
        onClick={() => useForgeStore.getState().setSurface("winamp")}
      >
        Amp
      </button>
    </nav>
  );
}
