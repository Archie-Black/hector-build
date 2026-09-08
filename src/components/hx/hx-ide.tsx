import { useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { BarChart3, Box, Brain, Code2, Database, Hexagon, Waypoints } from "lucide-react";
import { HxLattice } from "@/components/hx/hx-lattice";
import { HxSqlLab } from "@/components/hx/hx-sql-lab";
import { HxMemory } from "@/components/hx/hx-memory";
import { EditorPane } from "@/components/forge/editor-pane";
import { FileTree } from "@/components/forge/file-tree";
import { TermPreview } from "@/components/forge/term-preview";
import { BackButton } from "@/components/forge/back-button";
import { HxDashboard } from "@/components/hx/hx-dashboard";
import { HxMessages } from "@/components/hx/hx-messages";
import { HxOrchestration } from "@/components/hx/hx-orchestration";
import { HxRoster } from "@/components/hx/hx-roster";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { CommandPalette } from "@/components/ide/command-palette";
import { SearchPanel } from "@/components/ide/search-panel";
import { StatusBar } from "@/components/ide/status-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMod } from "@/lib/ide/keys";
import { useForgeStore } from "@/lib/forge-store";
import { SettingsButton, SettingsHost } from "@/components/forge/settings-menu";
import { OsWindow } from "@/components/forge/os-window";
import { SandboxStage } from "@/components/forge/sandbox-stage";

type Props = {
  onSend: (text: string) => void;
  error: string | null;
  onBack: () => void;
};

export function HxIde({ onSend, error, onBack }: Props) {
  const overlay = useForgeStore((s) => s.sandboxOverlay);
  const busy = useForgeStore((s) => s.busy);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = isMod(e);
      if (!mod) return;
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        useForgeStore.getState().setPaletteOpen(true);
      }
      if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        useForgeStore.getState().setSearchOpen(true);
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        useForgeStore.getState().saveActive();
      }
      if (e.key === "`") {
        e.preventDefault();
        useForgeStore.getState().setBottomPane("term");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex h-dvh flex-col bg-bg text-fg">
      <Tabs defaultValue="code" className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 px-2 glass-thin">
          <BackButton onClick={onBack} />
          <SpectreStage busy={busy} ghosts={3} size="compact" />
          <p className="text-sm">Spectral HX</p>
          <TabsList className="ml-2">
            <TabsTrigger value="code">
              <Code2 className="size-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="orch">
              <Waypoints className="size-4" />
              Orchestrate
            </TabsTrigger>
            <TabsTrigger value="bi">
              <BarChart3 className="size-4" />
              Dashboards
            </TabsTrigger>
            <TabsTrigger value="sql">
              <Database className="size-4" />
              SQL Lab
            </TabsTrigger>
            <TabsTrigger value="mem">
              <Brain className="size-4" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="lat">
              <Hexagon className="size-4" />
              Lattice
            </TabsTrigger>
          </TabsList>
          <button
            type="button"
            className="ml-auto flex h-11 items-center gap-1 px-3 text-sm text-muted"
            onClick={() => void useForgeStore.getState().openSandbox()}
          >
            <Box className="size-4" />
            Sandbox
          </button>
          <SettingsButton />
        </header>
        <div className="flex min-h-0 flex-1">
          <TabsContent value="code" className="relative flex min-h-0 flex-1 flex-col">
            <Group orientation="horizontal" className="flex min-h-0 flex-1">
              <Panel defaultSize="18" minSize="12" className="hidden min-h-0 lg:flex lg:flex-col">
                <FileTree />
              </Panel>
              <Separator className="hidden w-1 bg-line lg:block" />
              <Panel defaultSize="62" minSize="30" className="flex min-h-0 min-w-0 flex-1 flex-col">
                <Group orientation="vertical" className="flex min-h-0 flex-1 flex-col">
                  <Panel defaultSize="72" minSize="30" className="flex min-h-0 flex-col">
                    <EditorPane />
                  </Panel>
                  <Separator className="h-1 bg-line" />
                  <Panel defaultSize="28" minSize="16" className="flex min-h-0 flex-col">
                    <TermPreview />
                  </Panel>
                </Group>
              </Panel>
              <Separator className="hidden w-1 bg-line md:block" />
              <Panel defaultSize="20" minSize="12" className="hidden min-h-0 md:flex md:flex-col">
                <HxRoster compact />
              </Panel>
            </Group>
            <StatusBar />
            <SearchPanel />
          </TabsContent>
          <TabsContent value="orch" className="flex min-h-0 flex-1">
            <HxOrchestration onRun={onSend} />
          </TabsContent>
          <TabsContent value="bi" className="flex min-h-0 flex-1">
            <HxDashboard />
          </TabsContent>
          <TabsContent value="sql" className="flex min-h-0 flex-1">
            <HxSqlLab />
          </TabsContent>
          <TabsContent value="mem" className="flex min-h-0 flex-1">
            <HxMemory />
          </TabsContent>
          <TabsContent value="lat" className="flex min-h-0 flex-1">
            <HxLattice />
          </TabsContent>
          <div className="flex w-full min-w-0 max-w-md flex-col border-l border-line">
            <HxMessages
              onSend={onSend}
              error={error}
              placeholder="Ask the coding agent…"
              speaker="hx"
              busyLabel="parallel bots"
              compact
            />
          </div>
        </div>
      </Tabs>
      <CommandPalette />
      <SettingsHost />
      {overlay ? (
        <OsWindow title="Sandbox" onClose={() => useForgeStore.getState().closeSandbox()}>
          <SandboxStage onClose={() => useForgeStore.getState().closeSandbox()} />
        </OsWindow>
      ) : null}
    </div>
  );
}
