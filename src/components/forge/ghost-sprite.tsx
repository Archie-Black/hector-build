import type { CSSProperties } from "react";

type Props = {
  kind: "hector" | "agent";
  className?: string;
  n?: number;
  style?: CSSProperties;
};

/** Clean sheet ghosts — vector, no PNG fringe. */
export function GhostSprite({ kind, className, n, style }: Props) {
  return (
    <svg viewBox="0 0 128 168" className={className} style={style} aria-hidden>
      {kind === "hector" ? (
        <g fill="#0b0d12">
          <ellipse cx="64" cy="34" rx="46" ry="7" />
          <path d="M38 32 Q64 6 90 32 L86 38 Q64 18 42 38 Z" />
        </g>
      ) : null}
      <path
        d="M30 56 Q30 28 64 28 Q98 28 98 56 L98 138 Q86 122 76 140 Q64 122 52 140 Q42 122 30 138 Z"
        fill="#f3f6ff"
      />
      <ellipse cx="50" cy="72" rx="7.5" ry="12" fill="#0b0d12" />
      <ellipse cx="78" cy="72" rx="7.5" ry="12" fill="#0b0d12" />
      {n != null ? (
        <text
          x="64"
          y="118"
          textAnchor="middle"
          fill="#0b0d12"
          fontFamily="ui-monospace, monospace"
          fontSize="28"
          fontWeight="700"
        >
          {n}
        </text>
      ) : null}
    </svg>
  );
}
