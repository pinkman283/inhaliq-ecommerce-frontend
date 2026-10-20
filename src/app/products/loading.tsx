import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Title Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* Filter / Category Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Results & Sort Bar Skeleton */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-200/80 dark:border-white/10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* Product Catalog Grid Skeleton using shadcn SkeletonCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
