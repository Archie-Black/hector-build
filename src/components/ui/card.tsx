import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg p-4 glass-window", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs tracking-[0.14em] text-subtle uppercase", className)} {...props} />;
}
