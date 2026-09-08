import { useEffect, useRef } from "react";
import { useForgeStore } from "@/lib/forge-store";

export function PaintView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const down = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, c.width, c.height);
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
    };
    const start = (e: PointerEvent) => {
      down.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (e: PointerEvent) => {
      if (!down.current) return;
      const p = pos(e);
      ctx.strokeStyle = "#8eb4ff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const end = () => {
      down.current = false;
    };
    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 px-4">
      <div className="w-full max-w-2xl rounded-lg p-3 glass-window">
        <div className="mb-2 flex items-center">
          <p className="text-sm font-medium">Paint</p>
          <button
            type="button"
            className="ml-auto h-11 px-3 text-sm text-muted"
            onClick={() => useForgeStore.getState().setSurface("work")}
          >
            Close
          </button>
        </div>
        <canvas ref={canvasRef} width={720} height={420} className="w-full rounded-md" />
      </div>
    </div>
  );
}
