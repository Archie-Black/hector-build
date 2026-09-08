import { SmokeLayer } from "@/components/forge/smoke-layer";

type Props = {
  busy: boolean;
  ghosts: number;
  size?: "hero" | "compact";
};

export function SpectreStage({ busy, ghosts, size = "hero" }: Props) {
  const n = Math.max(2, Math.min(ghosts, 5));
  const compact = size === "compact";
  return (
    <div
      className={
        "relative mx-auto " +
        (compact ? "h-11 w-20" : "h-44 w-full max-w-sm") +
        (busy ? " hector-busy" : "")
      }
      aria-hidden={compact}
    >
      {compact ? null : <SmokeLayer busy={busy} />}
      {Array.from({ length: n }, (_, i) => (
        <img
          key={i}
          src="/hector/agent-v2.png"
          alt=""
          className={"ghost-orbit-img" + (compact ? " ghost-orbit-sm" : "")}
          style={{ animationDelay: `${i * -1.1}s` }}
        />
      ))}
      <img src="/hector/hector-v2.png" alt={compact ? "" : "Hector"} className={"hector-hero" + (compact ? " hector-hero-sm" : "")} />
    </div>
  );
}
