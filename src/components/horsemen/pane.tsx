import { Maximize2, Minus, X } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import type { Pane } from "@/lib/horsemen/layout";

type Props = {
  pane: Pane;
  focused: boolean;
  tilt: { x: number; y: number };
  dropping: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMax: () => void;
  onMin: () => void;
  onDown: (e: PointerEvent) => void;
  onResize: (e: PointerEvent) => void;
  children: ReactNode;
};

export function Window({
  pane,
  focused,
  tilt,
  dropping,
  onFocus,
  onClose,
  onMax,
  onMin,
  onDown,
  onResize,
  children,
}: Props) {
  const { rect, title, leaving, max } = pane;
  const skin = [
    "pane-glass pane-compiz",
    leaving ? "pane-leave" : "",
    focused ? "pane-focus" : "",
    dropping ? "pane-jelly" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const box = max
    ? { left: 10, top: 48, width: "calc(100% - 20px)", height: "calc(100% - 128px)" }
    : { left: rect.x, top: rect.y, width: rect.w, height: rect.h };
  const wobble = max
    ? undefined
    : `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;

  return (
    <section
      role="dialog"
      aria-label={title}
      onPointerDown={onFocus}
      className={`absolute flex flex-col overflow-hidden rounded-[var(--radius-pane)] ${skin}`}
      style={{ ...box, zIndex: pane.z, transform: wobble }}
    >
      <span className="pane-sheen" aria-hidden="true" />
      <header
        onPointerDown={onDown}
        onDoubleClick={onMax}
        className="flex h-12 shrink-0 cursor-grab items-center gap-1 border-b border-cobalt/30 pl-3 active:cursor-grabbing"
      >
        <p className="min-w-0 flex-1 truncate text-sm text-ash">{title}</p>
        <button type="button" aria-label="Hide" onPointerDown={(e) => e.stopPropagation()} onClick={onMin} className="win-hit text-steel hover:bg-cobalt/30 hover:text-ash">
          <Minus className="size-4" />
        </button>
        <button type="button" aria-label={max ? "Restore" : "Fill screen"} onPointerDown={(e) => e.stopPropagation()} onClick={onMax} className="win-hit text-steel hover:bg-cobalt/30 hover:text-ash">
          <Maximize2 className="size-4" />
        </button>
        <button type="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} className="win-hit mr-1 text-steel hover:bg-cobalt/50 hover:text-uranium">
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {!max ? (
        <button type="button" aria-label="Resize" onPointerDown={onResize} className="absolute right-0 bottom-0 size-6 cursor-nwse-resize" />
      ) : null}
    </section>
  );
}
