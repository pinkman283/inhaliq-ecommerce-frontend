import { SkeletonCard, SkeletonBannerCard } from "@/components/ui/skeleton-card";

export default function RootStorefrontLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Hero Card Skeleton */}
      <SkeletonBannerCard className="w-full" />

      {/* 2. Responsive Card Skeletons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
