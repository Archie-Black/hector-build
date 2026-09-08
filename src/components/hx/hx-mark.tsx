export function HxMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";
  return (
    <div
      className={
        "flex items-center justify-center rounded-md bg-accent font-medium tracking-[0.18em] text-accent-fg " + box
      }
    >
      HX
    </div>
  );
}
