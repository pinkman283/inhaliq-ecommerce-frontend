import { Skeleton } from "@/components/ui/skeleton";

export default function BrandsLoading() {
  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3 text-center max-w-2xl mx-auto flex flex-col items-center">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-72 sm:w-96 rounded-lg" />
        <Skeleton className="h-4 w-64 sm:w-80" />
      </div>

      {/* Brands Grid Skeleton (Matches actual brand cards layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="p-5 rounded-2xl bg-[#0e121e]/80 border border-white/[0.06] flex flex-col justify-between min-h-[160px] space-y-4 animate-shimmer"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.04]">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
