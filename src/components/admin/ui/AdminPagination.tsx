"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage: propCurrentPage,
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}) => {
  const currentPage = propCurrentPage ?? page ?? 1;
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const endItem =
    itemsPerPage && totalItems
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#272B35] text-xs text-[#929BAD] bg-[#090B10]/40">
      <div>
        {totalItems !== undefined ? (
          <span>
            Showing <span className="font-semibold text-white">{startItem ?? 1}</span> to{" "}
            <span className="font-semibold text-white">{endItem ?? totalItems}</span> of{" "}
            <span className="font-semibold text-white">{totalItems}</span> records
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-white">{currentPage}</span> of{" "}
            <span className="font-semibold text-white">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || isLoading}
          className="p-1.5 rounded-md border border-[#272B35] bg-[#11141D] hover:bg-[#171B26] text-[#929BAD] hover:text-[#E5E7EB] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2.5 py-1 rounded-md bg-[#171B26] border border-[#272B35] font-mono text-[11px] font-semibold text-[#E5E7EB]">
          {currentPage} / {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || isLoading}
          className="p-1.5 rounded-md border border-[#272B35] bg-[#11141D] hover:bg-[#171B26] text-[#929BAD] hover:text-[#E5E7EB] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
