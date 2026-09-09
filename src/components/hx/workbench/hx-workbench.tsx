import { Group, Panel, Separator } from "react-resizable-panels";
import { ActivityBar } from "@/components/hx/workbench/activity-bar";
import { MonacoPane } from "@/components/hx/workbench/monaco-pane";
import { PanelBar } from "@/components/hx/workbench/panel-bar";
import { SideView } from "@/components/hx/workbench/side-view";
import { TitleBar } from "@/components/hx/workbench/title-bar";
import { HxMessages } from "@/components/hx/hx-messages";
import { StatusBar } from "@/components/ide/status-bar";
import { CommandPalette } from "@/components/ide/command-palette";
import { useForgeStore } from "@/lib/forge-store";

type Props = {
  onSend: (text: string) => void;
  error: string | null;
  onBack: () => void;
};

export function HxWorkbench({ onSend, error, onBack }: Props) {
  const tabs = useForgeStore((s) => s.openTabs);
  const active = useForgeStore((s) => s.activePath);
  const dirty = useForgeStore((s) => s.dirty);
  const chat = useForgeStore((s) => s.hostChatOpen);

  return (
    <div className="hx-workbench flex min-h-0 flex-1 flex-col">
      <TitleBar onBack={onBack} />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        <Group orientation="horizontal" className="flex min-h-0 flex-1">
          <Panel defaultSize="16" minSize="10" className="hx-sidebar hidden min-h-0 lg:flex lg:flex-col">
            <SideView />
          </Panel>
          <Separator className="hidden w-px bg-line lg:block" />
          <Panel defaultSize={chat ? 58 : 84} minSize="30" className="flex min-h-0 min-w-0 flex-col">
            <div className="flex h-9 shrink-0 items-center overflow-auto border-b border-line">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={"hx-tab " + (tab === active ? "is-on" : "")}
                  onClick={() => useForgeStore.getState().openPath(tab)}
                >
                  {dirty[tab] ? "● " : ""}
                  {tab.split("/").pop()}
                  <span
                    className="ml-2 text-subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      useForgeStore.getState().closeTab(tab);
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
            <Group orientation="vertical" className="flex min-h-0 flex-1 flex-col">
              <Panel defaultSize="70" minSize="30" className="flex min-h-0 flex-col">
                <MonacoPane
                  onEdit={(instruction, selection, path, start, end) => {
                    onSend(
                      `INLINE EDIT ${path} L${start}-${end}\n\`\`\`\n${selection.slice(0, 4000)}\n\`\`\`\n${instruction}`,
                    );
                  }}
                />
              </Panel>
              <Separator className="h-px bg-line" />
              <Panel defaultSize="30" minSize="14" className="flex min-h-0 flex-col">
                <PanelBar />
              </Panel>
            </Group>
          </Panel>
          {chat ? (
            <>
              <Separator className="hidden w-px bg-line md:block" />
              <Panel defaultSize="26" minSize="16" className="hx-hostchat hidden min-h-0 md:flex md:flex-col">
                <p className="hx-side-title">Hector</p>
                <HxMessages
                  onSend={onSend}
                  error={error}
                  placeholder="Ask Hector to build…"
                  speaker="hector"
                  busyLabel="delegating"
                  compact
                />
              </Panel>
            </>
          ) : null}
        </Group>
      </div>
      <StatusBar />
      <CommandPalette />
    </div>
  );
}
