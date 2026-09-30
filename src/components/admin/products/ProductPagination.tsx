import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function ProductPagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  loading,
  onPageChange,
  onPerPageChange,
}: ProductPaginationProps) {
  const fromIndex = totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const toIndex = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="p-3 rounded-xl bg-[#0f121b] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-white">{fromIndex}</span> to{" "}
          <span className="font-semibold text-white">{toIndex}</span> of{" "}
          <span className="font-semibold text-white">{totalItems}</span> products
        </span>

        <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.08]">
          <span className="text-slate-500 text-[11px]">Per page:</span>
          <select
            value={perPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
            }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value={25} className="bg-[#0f121b]">25</option>
            <option value={50} className="bg-[#0f121b]">50</option>
            <option value={100} className="bg-[#0f121b]">100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <span className="px-2.5 py-1 text-[11px] text-slate-400 font-medium">
          Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
          <span className="text-white font-semibold">{Math.max(1, totalPages)}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
