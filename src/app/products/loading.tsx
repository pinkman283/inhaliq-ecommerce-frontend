import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

/**
 * Product Catalog Loading Skeleton.
 * Matches exact grid columns (2 / 3 / 4 / 5 / 6), gap (3 / 4 / 4.5),
 * and filter toolbar layout of ProductCatalogClient.tsx.
 */
export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. Filter Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
        {/* Left: Filter Trigger Button + Search Input */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <Skeleton className="h-9 w-24 rounded-md shrink-0" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>

        {/* Right: Sort Dropdown Skeleton */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* 2. Results Count Summary Bar Skeleton */}
      <div className="flex items-center justify-between py-1 text-xs">
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* 3. Product Catalog Grid Skeleton (Exact 2 / 3 / 4 / 5 / 6 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
        {Array.from({ length: 15 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
