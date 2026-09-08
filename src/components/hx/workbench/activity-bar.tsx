import { Bug, Files, GitBranch, MessageSquare, Puzzle, Search, Users } from "lucide-react";
import { useForgeStore } from "@/lib/forge-store";

const ITEMS = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "scm", label: "Source Control", icon: GitBranch },
  { id: "debug", label: "Run and Debug", icon: Bug },
  { id: "ext", label: "Extensions", icon: Puzzle },
] as const;

const BOTTOM = [
  { id: "agents", label: "Agents", icon: Users },
  { id: "hector", label: "Hector", icon: MessageSquare },
] as const;

export function ActivityBar() {
  const side = useForgeStore((s) => s.workbenchSide);
  return (
    <nav className="hx-activity flex h-full w-12 shrink-0 flex-col items-center py-1" aria-label="Activity Bar">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const on = side === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={on}
            className={"hx-activity-btn " + (on ? "is-on" : "")}
            onClick={() => useForgeStore.getState().setWorkbenchSide(item.id)}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
      <span className="mt-auto" />
      {BOTTOM.map((item) => {
        const Icon = item.icon;
        const on = side === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={on}
            className={"hx-activity-btn " + (on ? "is-on" : "")}
            onClick={() => {
              if (item.id === "hector") {
                const s = useForgeStore.getState();
                if (s.workbenchSide === "hector") s.setHostChatOpen(!s.hostChatOpen);
                s.setWorkbenchSide("hector");
                s.setHostChatOpen(true);
              } else useForgeStore.getState().setWorkbenchSide(item.id);
            }}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </nav>
  );
}
