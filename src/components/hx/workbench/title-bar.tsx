import { SpectreStage } from "@/components/forge/spectre-stage";
import { SettingsButton } from "@/components/forge/settings-menu";
import { useForgeStore } from "@/lib/forge-store";

const MENUS = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"] as const;

export function TitleBar({ onBack }: { onBack: () => void }) {
  const busy = useForgeStore((s) => s.busy);
  return (
    <header className="hx-titlebar flex h-9 shrink-0 items-center gap-2 px-2">
      <button type="button" className="px-2 text-xs text-muted" onClick={onBack}>
        ←
      </button>
      <SpectreStage busy={busy} ghosts={3} size="compact" />
      <p className="text-xs tracking-wide">Spectral HX</p>
      <nav className="ml-2 hidden items-center gap-1 md:flex">
        {MENUS.map((m) => (
          <button
            key={m}
            type="button"
            className="h-7 px-2 text-xs text-muted"
            onClick={() => runMenu(m)}
          >
            {m}
          </button>
        ))}
      </nav>
      <p className="mx-auto hidden text-xs text-subtle sm:block">Hector Build — powered by Spectral HX</p>
      <SettingsButton />
    </header>
  );
}

function runMenu(m: string) {
  const s = useForgeStore.getState();
  if (m === "File") s.setPaletteOpen(true);
  if (m === "Edit") s.setSearchOpen(true);
  if (m === "View") s.setWorkbenchSide("explorer");
  if (m === "Go") s.setPaletteOpen(true);
  if (m === "Run") s.setDebugRunning(true);
  if (m === "Terminal") s.setBottomPane("term");
  if (m === "Help") s.setSettingsOpen(true);
  if (m === "Selection") s.setSearchOpen(true);
}
