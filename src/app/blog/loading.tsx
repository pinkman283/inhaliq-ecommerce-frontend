import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Skeleton */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-80 max-w-full mx-auto" />
      </div>

      {/* Category Filter Pills Skeleton */}
      <div className="flex items-center justify-center gap-2 overflow-hidden py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Featured Hero Article Card Skeleton */}
      <Card className="p-6 sm:p-8 space-y-4">
        <Skeleton className="w-full h-64 sm:h-80 rounded-xl" />
        <div className="space-y-2 max-w-2xl">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Card>

      {/* Article Grid Skeleton using shadcn SkeletonCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
