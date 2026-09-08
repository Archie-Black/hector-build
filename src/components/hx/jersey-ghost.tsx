type Props = {
  number: number;
  busy?: boolean;
};

export function JerseyGhost({ number, busy }: Props) {
  const n = Math.max(0, Math.min(99, number));
  return (
    <div className={"jersey-ghost " + (busy ? "jersey-busy" : "")}>
      <img src="/hector/agent-v2.png" alt="" className="jersey-sprite" />
      <span className="jersey-num">{n}</span>
    </div>
  );
}
