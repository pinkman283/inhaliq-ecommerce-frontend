import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-2 p-4 sm:p-5">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        <Skeleton className="h-[180px] w-full rounded-lg" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonBannerCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden p-6 space-y-4", className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-3/4 max-w-md" />
      <Skeleton className="h-4 w-1/2 max-w-sm" />
      <Skeleton className="h-[220px] sm:h-[300px] w-full rounded-xl mt-4" />
    </Card>
  );
}
