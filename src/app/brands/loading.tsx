import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function BrandsLoading() {
  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3 text-center max-w-2xl mx-auto flex flex-col items-center">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-72 sm:w-96 rounded-lg" />
        <Skeleton className="h-4 w-64 sm:w-80" />
      </div>

      {/* Brands Grid Skeleton using shadcn SkeletonCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
