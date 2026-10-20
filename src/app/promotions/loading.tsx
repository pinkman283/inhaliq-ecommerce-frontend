import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function PromotionsLoading() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Banner Card Skeleton */}
        <Card className="p-8 sm:p-12 space-y-4">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-xl" />
          <Skeleton className="h-4 sm:h-5 w-2/3 max-w-lg" />
          <div className="pt-2 flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </Card>

        {/* Filter Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
            ))}
          </div>
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
        </div>

        {/* 6-Card Campaign Grid Skeleton using shadcn SkeletonCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
