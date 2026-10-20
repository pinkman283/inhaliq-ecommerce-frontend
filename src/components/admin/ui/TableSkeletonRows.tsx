import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonRowsProps {
  rows?: number;
  colSpan?: number;
  hasCheckbox?: boolean;
  hasThumbnail?: boolean;
}

export function TableSkeletonRows({
  rows = 6,
  colSpan = 8,
  hasCheckbox = true,
  hasThumbnail = false,
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className="border-b border-neutral-200/60 dark:border-white/10 hover:bg-transparent"
        >
          {hasCheckbox && (
            <td className="px-4 py-3.5 w-10">
              <Skeleton className="w-4 h-4 rounded" />
            </td>
          )}
          {hasThumbnail && (
            <td className="px-4 py-3.5 w-14">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            </td>
          )}
          <td className="px-4 py-3.5">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-16" />
          </td>
          {colSpan > 5 && (
            <td className="px-4 py-3.5 hidden md:table-cell">
              <Skeleton className="h-4 w-20" />
            </td>
          )}
          {colSpan > 6 && (
            <td className="px-4 py-3.5 hidden lg:table-cell">
              <Skeleton className="h-4 w-20" />
            </td>
          )}
          <td className="px-4 py-3.5 text-right w-24">
            <div className="flex items-center justify-end gap-1.5">
              <Skeleton className="w-7 h-7 rounded-md" />
              <Skeleton className="w-7 h-7 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
