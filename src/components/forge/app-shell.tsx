import { ChatView } from "@/components/forge/chat-view";
import { JournalView } from "@/components/forge/journal-view";
import { PaintView } from "@/components/forge/paint-view";
import { SpectreMaze } from "@/components/forge/spectre-maze";
import { Studio } from "@/components/forge/studio";
import { TitleScreen } from "@/components/forge/title-screen";
import { WinampDeck } from "@/components/forge/winamp-deck";
import { SupportOverlay } from "@/components/forge/support-overlay";
import { useForgeStore } from "@/lib/forge-store";

export function AppShell() {
  const surface = useForgeStore((s) => s.surface);
  if (surface === "title") return <TitleScreen />;
  return (
    <>
      <ChatView />
      {surface === "maze" ? <SpectreMaze /> : null}
      {surface === "journal" ? <JournalView /> : null}
      {surface === "paint" ? <PaintView /> : null}
      {surface === "studio" ? <Studio /> : null}
      {surface === "winamp" ? <WinampDeck /> : null}
      <SupportOverlay />
    </>
  );
}
