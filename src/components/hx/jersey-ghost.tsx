import { GhostSprite } from "@/components/forge/ghost-sprite";

type Props = {
  number: number;
  busy?: boolean;
};

export function JerseyGhost({ number, busy }: Props) {
  const n = Math.max(0, Math.min(99, number));
  return (
    <div className={"jersey-ghost " + (busy ? "jersey-busy" : "")}>
      <GhostSprite kind="agent" n={n} className="jersey-sprite" />
    </div>
  );
}
