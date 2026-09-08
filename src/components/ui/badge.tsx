import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex h-6 items-center rounded-md px-2 text-xs", {
  variants: {
    tone: {
      muted: "bg-inset text-muted",
      accent: "bg-accent text-accent-fg",
      pass: "bg-inset text-pass",
      fail: "bg-inset text-fail",
    },
  },
  defaultVariants: { tone: "muted" },
});

type Props = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

export function Badge({ className, tone, ...props }: Props) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
