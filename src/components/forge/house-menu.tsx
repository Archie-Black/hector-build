import { Link } from "@tanstack/react-router";
import { useForgeStore } from "@/lib/forge-store";

export function HouseMenu() {
  return (
    <nav className="flex items-center gap-1">
      <Link to="/hx" className="flex h-11 items-center rounded-md px-3 text-sm glass-thin">
        Spectral HX
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
        onClick={() => useForgeStore.getState().setSurface("maze")}
      >
        Play
      </button>
    </nav>
  );
}
