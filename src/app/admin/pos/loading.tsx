import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPosLoading() {
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 sm:p-6 gap-4">
      {/* Top Header Card */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </Card>

      {/* POS 2-Column Register Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Product Catalog Grid Card (7 cols) */}
        <Card className="lg:col-span-7 flex flex-col p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 flex-1 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Cart Register & Checkout Card (5 cols) */}
        <Card className="lg:col-span-5 flex flex-col p-4 space-y-4">
          <CardHeader className="p-0 flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-16" />
          </CardHeader>
          <CardContent className="p-0 space-y-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200/80 dark:border-white/10">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </CardContent>
          <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  );
}
