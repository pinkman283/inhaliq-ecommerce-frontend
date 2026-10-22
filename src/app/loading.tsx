import { HeroSectionSkeleton, ExploreCategoriesSkeleton, SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Root Storefront Skeleton Loader.
 * Perfectly mirrors the exact layout, margins, paddings, and component alignments
 * of HomePageClient.tsx to achieve 0 Cumulative Layout Shift (CLS).
 */
export default function RootStorefrontLoading() {
  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 pb-8 sm:pb-12 lg:pb-16">
      {/* 1. Hero Section Skeleton (8:4 Carousel + Secondary Banner) */}
      <HeroSectionSkeleton />

      {/* 2. Explore Categories Skeleton (Category circle tiles) */}
      <ExploreCategoriesSkeleton />

      {/* 3. Featured Collection Carousel Track Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        {/* Header & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-7 w-52 rounded-lg" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>

        {/* Product Cards Row (Matches real ProductCard aspect-square & dimensions) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
