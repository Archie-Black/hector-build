import { SmokeLayer } from "@/components/forge/smoke-layer";
import { GhostSprite } from "@/components/forge/ghost-sprite";

type Props = {
  busy: boolean;
  ghosts: number;
  size?: "hero" | "compact" | "page";
};

export function SpectreStage({ busy, ghosts, size = "hero" }: Props) {
  const n = Math.max(2, Math.min(ghosts, size === "page" ? 9 : 5));
  const compact = size === "compact";
  const page = size === "page";
  return (
    <div
      className={
        "relative mx-auto " +
        (compact ? "h-11 w-20" : page ? "h-[min(72vh,32rem)] w-full max-w-3xl" : "h-44 w-full max-w-sm") +
        (busy ? " hector-busy" : "")
      }
      aria-hidden={compact}
    >
      {compact ? null : <SmokeLayer busy={busy || page} />}
      {Array.from({ length: n }, (_, i) => (
        <GhostSprite
          key={i}
          kind="agent"
          className={"ghost-orbit-img" + (compact ? " ghost-orbit-sm" : page ? " ghost-orbit-page" : "")}
          style={{ animationDelay: `${i * -1.1}s` }}
        />
      ))}
      <GhostSprite
        kind="hector"
        className={"hector-hero" + (compact ? " hector-hero-sm" : page ? " hector-hero-page" : "")}
      />
    </div>
  );
}
