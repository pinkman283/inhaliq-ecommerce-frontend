import { Skeleton } from "@/components/ui/skeleton";

export default function PromotionsLoading() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Banner Card Skeleton */}
        <div className="p-8 sm:p-12 rounded-3xl border border-white/10 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent space-y-4 animate-shimmer">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-xl rounded-lg" />
          <Skeleton className="h-4 sm:h-5 w-2/3 max-w-lg rounded" />
          <div className="pt-2 flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Filter Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
            ))}
          </div>
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
        </div>

        {/* 6-Card Campaign Grid Skeleton (Matches actual campaign cards layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col justify-between animate-shimmer"
            >
              {/* Card Banner Image Skeleton */}
              <div className="w-full h-44 bg-white/[0.04]" />
              
              <div className="p-5 sm:p-6 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
                
                {/* Coupon Code Pill & Button Skeleton */}
                <div className="pt-3 flex items-center justify-between border-t border-white/[0.06]">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
