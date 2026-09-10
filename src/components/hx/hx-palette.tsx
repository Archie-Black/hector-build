import { useEffect, useMemo, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";

type Item = { id: string; label: string; hint: string; run: () => void };

type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
};

export function HxPalette({ open, onClose, onSend }: Props) {
  const [q, setQ] = useState("");
  const plan = useForgeStore((s) => s.plan);

  const items = useMemo<Item[]>(() => {
    return [
      {
        id: "plan",
        label: "Plan current job",
        hint: "Enter",
        run: () => onSend(useForgeStore.getState().draft || "Survey the workspace and propose a plan."),
      },
      {
        id: "hello",
        label: "Demo: add hello() to main.py",
        hint: "LIVE local",
        run: () => onSend("add a hello function to main.py"),
      },
      {
        id: "approve",
        label: "Approve plan",
        hint: "apply",
        run: () => {
          if (plan) onSend(`Execute the approved plan:\n${plan}`);
        },
      },
      {
        id: "tests",
        label: "Run checks",
        hint: "LIVE",
        run: () => useForgeStore.getState().runChecks(),
      },
      {
        id: "undo",
        label: "Undo checkpoint",
        hint: "restore",
        run: () => useForgeStore.getState().undoApply(),
      },
      {
        id: "grant",
        label: "Grant workspace",
        hint: "ACL",
        run: () => useForgeStore.getState().grant(),
      },
    ];
  }, [plan, onSend]);

  const shown = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 12);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 px-4 pt-[20vh]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg p-2 glass-window" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Command or file"
          className="h-12 w-full bg-transparent px-3 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && shown[0]) {
              shown[0].run();
              onClose();
            }
          }}
        />
        <ul className="max-h-72 overflow-auto">
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-md px-3 text-sm"
                onClick={() => {
                  item.run();
                  onClose();
                }}
              >
                <span>{item.label}</span>
                <span className="text-xs text-subtle">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
