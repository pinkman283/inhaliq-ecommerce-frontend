"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";

interface BrandsFilterToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  featuredFilter: string;
  onFeaturedFilterChange: (filter: string) => void;
  onReset: () => void;
}

export function BrandsFilterToolbar({
  search,
  onSearchChange,
  featuredFilter,
  onFeaturedFilterChange,
  onReset,
}: BrandsFilterToolbarProps) {
  const isFiltered = search.trim() !== "" || featuredFilter !== "all";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="relative w-full sm:w-72">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search brands or websites..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <select
          value={featuredFilter}
          onChange={(e) => onFeaturedFilterChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="all" className="bg-[#0c0e15] text-white">All Tiers</option>
          <option value="featured" className="bg-[#0c0e15] text-white">Featured Only</option>
          <option value="standard" className="bg-[#0c0e15] text-white">Standard Only</option>
        </select>

        {isFiltered && (
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
