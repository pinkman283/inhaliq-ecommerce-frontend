import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Search Header Card */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </Card>

      {/* Tracking Details Card */}
      <Card className="p-6 space-y-8">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </CardHeader>

        <CardContent className="p-0 space-y-6">
          {/* Milestone timeline */}
          <div className="flex items-center justify-between relative py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 z-10">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>

          {/* Courier Telemetry Block */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
