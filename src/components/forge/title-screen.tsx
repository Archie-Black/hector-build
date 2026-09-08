import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { useForgeStore } from "@/lib/forge-store";

export function TitleScreen() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("house") === "1") {
      useForgeStore.getState().setSurface("work");
    }
  }, []);
  return (
    <div className="relative flex h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg px-8 py-10 text-center glass-window">
        <SpectreStage busy={false} ghosts={3} />
        <h1 className="mt-4 text-3xl font-medium tracking-tight text-balance">Hector Build</h1>
        <p className="mt-2 text-sm text-muted">host intelligence · Spectral HX inside</p>
        <p className="mt-1 text-xs tracking-[0.14em] text-subtle uppercase">By DeltaKingZero</p>
        <button
          type="button"
          className="mt-8 h-12 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
          onClick={() => useForgeStore.getState().setSurface("work")}
        >
          Talk to Hector
        </button>
        <Link
          to="/hx"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-md text-sm glass-thin"
        >
          Spectral HX standalone
        </Link>
      </div>
    </div>
  );
}
