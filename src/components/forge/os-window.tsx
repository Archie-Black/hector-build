import type { ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function OsWindow({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-lg glass-window sm:inset-6">
      <header className="flex h-11 shrink-0 items-center gap-2 px-3 glass-thin">
        <p className="text-sm">{title}</p>
        <button type="button" className="ml-auto flex h-11 items-center px-3 text-sm text-muted" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
