import { useEffect, useState, type MouseEvent } from "react";

type Scene = {
  retina?: { name: string; physical: { w: number; h: number }; logical: { w: number; h: number }; scale: number };
  active?: string;
  grab?: { who: string; kind: string } | null;
  cursor?: { x: number; y: number };
  windows?: { id: string; title: string; x: number; y: number; w: number; h: number; focused: boolean }[];
  menu?: string[];
  dock?: string[];
  chord?: string;
};

export function DarwinSeat() {
  const [scene, setScene] = useState<Scene | null>(null);

  async function pull() {
    try {
      const r = await fetch("/api/v1/kvm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "frame" }),
      });
      const j = (await r.json()) as { scene?: Scene } & Scene;
      setScene(j.scene ?? j);
    } catch {
      setScene(null);
    }
  }

  useEffect(() => {
    void pull();
    const t = window.setInterval(() => void pull(), 2400);
    return () => window.clearInterval(t);
  }, []);

  function point(e: MouseEvent<HTMLDivElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    void fetch("/api/v1/kvm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "input", x, y }),
    }).catch(() => undefined);
  }

  const retina = scene?.retina;
  return (
    <div className="darwin-seat">
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">Darwin seat · {retina?.name ?? "Cinema 30″"}</p>
      <div className="darwin-glass mt-2" onMouseMove={point} role="presentation">
        <div className="darwin-menubar">
          {(scene?.menu ?? ["Hector"]).map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        {(scene?.windows ?? []).map((w) => (
          <div
            key={w.id}
            className={"darwin-win" + (w.focused ? " is-on" : "")}
            style={{ left: `${w.x * 100}%`, top: `${w.y * 100}%`, width: `${w.w * 100}%`, height: `${w.h * 100}%` }}
          >
            <b>{w.title}</b>
          </div>
        ))}
        <div
          className="darwin-cursor"
          style={{ left: `${(scene?.cursor?.x ?? 0.5) * 100}%`, top: `${(scene?.cursor?.y ?? 0.5) * 100}%` }}
        />
        <div className="darwin-dock">{(scene?.dock ?? []).join("  ·  ")}</div>
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted">
        {retina ? `${retina.physical.w}×${retina.physical.h} @${retina.scale}x` : "2560×1600"} · seat {scene?.active ?? "host"} · {scene?.chord ?? "Ctrl+Shift+\\"}
        {scene?.grab ? ` · ${scene.grab.kind} ${scene.grab.who}` : ""}
      </p>
    </div>
  );
}
