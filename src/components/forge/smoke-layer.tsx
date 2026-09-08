type Props = { busy: boolean };

export function SmokeLayer({ busy }: Props) {
  const n = busy ? 8 : 5;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={"smoke-puff " + (busy ? "smoke-busy" : "")} style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
    </div>
  );
}
