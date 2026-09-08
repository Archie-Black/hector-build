import { useForgeStore } from "@/lib/forge-store";

export function UsefulnessBar() {
  const chip = useForgeStore((s) => s.chip);
  const fileSeal = useForgeStore((s) => s.fileSeal);
  const pinSeal = useForgeStore((s) => s.pinSeal);
  const spend = useForgeStore((s) => s.spend);
  const spendCap = useForgeStore((s) => s.spendCap);
  const phase = useForgeStore((s) => s.phase);
  const sealed = chip || fileSeal || pinSeal;
  const asked = phase === "review" || phase === "apply";

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs">
      <span className="rounded-md px-2 py-1 glass-thin">LIVE workspace</span>
      <span className="rounded-md px-2 py-1 glass-thin">STUB host terminal</span>
      <span className="tabular-nums text-muted">
        spend {spend}/{spendCap}
      </span>
      <span className={"ml-auto flex gap-1 rounded-md px-2 py-1 " + (asked && !sealed ? "bg-fail text-accent-fg" : "glass-thin")}>
        <span className={chip ? "text-pass" : "text-subtle"}>CHIP</span>
        <span className="text-subtle">|</span>
        <span className={fileSeal ? "text-pass" : "text-subtle"}>FILE</span>
        <span className="text-subtle">|</span>
        <span className={pinSeal ? "text-pass" : "text-subtle"}>PIN</span>
      </span>
    </div>
  );
}
