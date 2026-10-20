import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-neutral-400">/</span>
        <Skeleton className="h-4 w-24" />
        <span className="text-neutral-400">/</span>
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Main 2-Column Layout with shadcn Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Media Gallery Card (7 cols) */}
        <Card className="lg:col-span-7 overflow-hidden p-6 space-y-4">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="flex items-center gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg shrink-0" />
            ))}
          </div>
        </Card>

        {/* Right Column: Product Info Card (5 cols) */}
        <Card className="lg:col-span-5 p-6 space-y-6">
          <CardHeader className="p-0 space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-4/5" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {/* Price Box */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Variant Selectors */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-28 rounded-lg" />
                <Skeleton className="h-11 flex-1 rounded-lg" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            {/* Trust Perks */}
            <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
