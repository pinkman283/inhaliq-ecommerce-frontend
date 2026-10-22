import { Skeleton } from "@/components/ui/skeleton";

/**
 * Product Detail Page (PDP) Loading Skeleton.
 * Accurately replicates the 6:6 two-column layout, image gallery aspect ratio,
 * typography rhythm, and action button positions of ProductDetailClient.tsx.
 */
export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 sm:space-y-10">
      {/* 1. Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 pb-1">
        <Skeleton className="h-3.5 w-14 rounded" />
        <span className="text-slate-500/40 text-xs">/</span>
        <Skeleton className="h-3.5 w-16 rounded" />
        <span className="text-slate-500/40 text-xs">/</span>
        <Skeleton className="h-3.5 w-24 rounded" />
        <span className="text-slate-500/40 text-xs">/</span>
        <Skeleton className="h-3.5 w-36 rounded" />
      </div>

      {/* 2. Main Product Showcase Section (Exact 6:6 Grid, gap-8 lg:gap-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (6 cols, max-w-[530px]) */}
        <div className="lg:col-span-6 max-w-[530px] w-full mx-auto lg:mx-0 space-y-3">
          {/* Main Gallery Image (aspect-square) */}
          <div className="aspect-square w-full rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 animate-shimmer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
          </div>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 animate-shimmer shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right Info & Actions Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          {/* Badge & Title */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-8 sm:h-10 w-4/5 rounded-lg" />
            
            {/* Rating Stars & SKU */}
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-xl border border-gray-200/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-3 w-40 rounded" />
          </div>

          {/* Variant Selector Skeleton */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-3 border-t border-gray-200/60 dark:border-white/10">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <Skeleton className="h-11 w-28 rounded-lg shrink-0" />
              {/* Add to Cart */}
              <Skeleton className="h-11 flex-1 rounded-lg" />
            </div>
            {/* Buy Now Button */}
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Shipping & Reassurance Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/10 space-y-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/10 space-y-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
