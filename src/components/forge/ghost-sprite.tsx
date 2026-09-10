import type { CSSProperties } from "react";

type Props = {
  kind: "hector" | "agent";
  className?: string;
  n?: number;
  style?: CSSProperties;
};

const SRC = {
  hector: "/hector/skull-cut.png",
  agent: "/hector/agent-cut.png",
};

/** Photoreal Unreal-style sheets. Black plate matches the void. */
export function GhostSprite({ kind, className, n, style }: Props) {
  return (
    <span className={className} style={style} aria-hidden>
      <img src={SRC[kind]} alt="" className="ghost-photo" />
      {n != null ? <span className="jersey-num">{n}</span> : null}
    </span>
  );
}
