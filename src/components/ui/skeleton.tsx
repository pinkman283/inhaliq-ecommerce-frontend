import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-neutral-200/80 dark:bg-white/[0.06] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
