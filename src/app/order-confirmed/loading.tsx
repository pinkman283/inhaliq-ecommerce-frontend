import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderConfirmedLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
      {/* 1. Header & Confirmation Status Skeleton */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>

      {/* 2. Order Summary Card Skeleton */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/80 dark:border-white/10">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* 2 Items */}
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-200/80 dark:border-white/10">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </Card>

      {/* 3. Action Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
