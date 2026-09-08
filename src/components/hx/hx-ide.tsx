import { useEffect } from "react";
import { HxWorkbench } from "@/components/hx/workbench/hx-workbench";
import { isMod } from "@/lib/ide/keys";
import { useForgeStore } from "@/lib/forge-store";
import { SettingsHost } from "@/components/forge/settings-menu";
import { OsWindow } from "@/components/forge/os-window";
import { SandboxStage } from "@/components/forge/sandbox-stage";
import { scanEnvironment } from "@/lib/hw/env-scan";
import { lockPlatform } from "@/lib/workspace/platform";

type Props = {
  onSend: (text: string) => void;
  error: string | null;
  onBack: () => void;
};

export function HxIde({ onSend, error, onBack }: Props) {
  const overlay = useForgeStore((s) => s.sandboxOverlay);
  useEffect(() => {
    useForgeStore.getState().bootHost();
    void scanEnvironment().then((env) => lockPlatform(env.platform));
  }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = isMod(e);
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        useForgeStore.getState().setPaletteOpen(true);
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        useForgeStore.getState().setSearchOpen(true);
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        useForgeStore.getState().saveActive();
      }
      if (mod && e.key === "`") {
        e.preventDefault();
        useForgeStore.getState().setBottomPane("term");
      }
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        useForgeStore.getState().setHostChatOpen(!useForgeStore.getState().hostChatOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex h-dvh flex-col bg-bg text-fg">
      <HxWorkbench onSend={onSend} error={error} onBack={onBack} />
      <SettingsHost />
      {overlay ? (
        <OsWindow title="Sandbox" onClose={() => useForgeStore.getState().closeSandbox()}>
          <SandboxStage onClose={() => useForgeStore.getState().closeSandbox()} />
        </OsWindow>
      ) : null}
    </div>
  );
}
