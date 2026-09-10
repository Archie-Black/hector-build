import { GhostSprite } from "@/components/forge/ghost-sprite";

type Props = {
  busy: boolean;
  ghosts: number;
  size?: "hero" | "compact" | "page";
};

const RINGS = [
  { tilt: "0deg", duration: "0.55s" },
  { tilt: "62deg", duration: "0.72s" },
  { tilt: "-58deg", duration: "0.4s" },
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
          key={ring.tilt}
          className="atom-ring"
          style={{ transform: `translate(-50%, -50%) rotate(${ring.tilt})` }}
        >
          <GhostSprite
            kind="agent"
            className="atom-electron"
            style={{ animationDuration: ring.duration, animationDelay: `${i * -0.18}s` }}
          />
        </div>
      ))}
      <GhostSprite kind="hector" className="atom-nucleus" />
    </div>
  );
}
