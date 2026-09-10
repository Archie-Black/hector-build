import type { CSSProperties } from "react";
import { GhostSprite } from "@/components/forge/ghost-sprite";

type Props = {
  busy: boolean;
  ghosts: number;
  size?: "hero" | "compact" | "page";
};

const RINGS = [
  { tilt: "72deg", yaw: "8deg", dur: "4.6s", r: "9.1rem" },
  { tilt: "62deg", yaw: "128deg", dur: "5.8s", r: "8.4rem" },
  { tilt: "78deg", yaw: "-52deg", dur: "3.9s", r: "8.8rem" },
];

export function SpectreStage({ busy, ghosts, size = "hero" }: Props) {
  const compact = size === "compact";
  const page = size === "page";
  const rings = compact ? 1 : Math.min(3, Math.max(1, Math.round(ghosts / 2)));
  return (
    <div
      className={
        "atom-stage" +
        (compact ? " atom-compact" : page ? " atom-page" : " atom-hero") +
        (busy ? " hector-busy" : "")
      }
      aria-hidden={compact}
    >
      <span className="atom-halo" />
      {RINGS.slice(0, rings).map((ring, i) => (
        <div
          key={ring.yaw}
          className="atom-orbit"
          style={
            {
              "--tilt": ring.tilt,
              "--yaw": ring.yaw,
              "--dur": ring.dur,
              "--r": compact ? "2.15rem" : page ? `calc(${ring.r} * 0.5)` : ring.r,
              "--delay": `${i * -1.1}s`,
            } as CSSProperties
          }
        >
          <div className="atom-orbit-plane">
            <span className="atom-ring-line" />
            <div className="atom-orbit-spin">
              <div className="atom-electron-hold">
                <GhostSprite kind={page ? "ace" : "agent"} className={"atom-electron" + (page ? " atom-ace" : "")} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="atom-nucleus-hold">
        <GhostSprite kind="hector" className="atom-nucleus" />
      </div>
    </div>
  );
}
