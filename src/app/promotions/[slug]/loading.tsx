import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function PromotionDetailLoading() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Hero Card Skeleton */}
        <Card className="overflow-hidden p-6 sm:p-10 space-y-6">
          <Skeleton className="w-full h-64 sm:h-80 rounded-xl" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Skeleton className="h-12 w-full sm:w-60 rounded-xl" />
              <Skeleton className="h-12 w-full sm:w-44 rounded-xl" />
            </div>
          </div>
        </Card>

        {/* Campaign Products Grid Skeleton using SkeletonCard */}
        <div className="space-y-4 pt-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
