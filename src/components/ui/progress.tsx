import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: ProgressPrimitive.ProgressProps) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root className={cn("h-2 overflow-hidden rounded-full bg-inset", className)} value={v} {...props}>
      <ProgressPrimitive.Indicator className="h-full bg-accent" style={{ width: `${v}%` }} />
    </ProgressPrimitive.Root>
  );
}
