"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";

interface ColorsFilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onReset: () => void;
}

export function ColorsFilterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
}: ColorsFilterToolbarProps) {
  const isFiltered = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08]">
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or #HEX..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400/50 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          aria-label="Filter by color status"
          className="bg-[#161a26] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-amber-400/50 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/5 border border-white/[0.08] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
