import { useEffect, useState } from "react";
import { GhostSprite } from "@/components/forge/ghost-sprite";

type Ghost = { id: number; x: number; y: number; delay: number; scale: number };

function spawn(): Ghost {
  return {
    id: Math.random(),
    x: Math.random() * 88 + 4,
    y: Math.random() * 78 + 8,
    delay: Math.random() * 2,
    scale: 0.45 + Math.random() * 0.55,
  };
}

type Props = { on: boolean; beat: number; layer?: "front" | "back" };

/** Click-through. Never steals keyboard or mouse. */
export function GhostVis({ on, beat, layer = "front" }: Props) {
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  useEffect(() => {
    if (!on) {
      setGhosts([]);
      return;
    }
    setGhosts(Array.from({ length: 5 }, spawn));
    const id = window.setInterval(() => {
      setGhosts((cur) => {
        const next = cur.filter(() => Math.random() > 0.35);
        while (next.length < 3 + Math.floor(Math.random() * 4)) next.push(spawn());
        return next.slice(0, 8);
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, [on]);
  if (!on) return null;
  return (
    <div className={"ghost-desktop" + (layer === "back" ? " ghost-desktop-back" : "")} aria-hidden>
      {ghosts.map((g) => (
        <GhostSprite
          key={g.id}
          kind="agent"
          className="ghost-float"
          style={{
            left: g.x + "%",
            top: g.y + "%",
            animationDelay: `${g.delay}s`,
            transform: `scale(${g.scale + beat * 0.15})`,
          }}
        />
      ))}
    </div>
  );
}
