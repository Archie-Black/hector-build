import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("flex h-11 items-center gap-1 rounded-md px-1 glass-thin", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex h-9 items-center gap-1 rounded-sm px-3 text-sm text-muted data-[state=active]:bg-raised data-[state=active]:text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("min-h-0 min-w-0 flex-1 outline-none", className)} {...props} />;
}
