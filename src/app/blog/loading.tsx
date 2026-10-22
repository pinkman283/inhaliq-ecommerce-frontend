import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Skeleton */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full mx-auto rounded" />
      </div>

      {/* Category Filter Pills Skeleton */}
      <div className="flex items-center justify-center gap-2 overflow-hidden py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Article Grid Skeleton (Matches actual 16:10 blog cards layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <article 
            key={i} 
            className="flex flex-col rounded-2xl bg-white dark:bg-[#0e121e] border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xs animate-shimmer"
          >
            {/* 16:10 Featured Image Skeleton */}
            <div className="aspect-[16/10] w-full bg-gray-100 dark:bg-white/[0.04]" />
            
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
