"use client";

import React from "react";
import { Search, X, RotateCcw, LayoutList, FolderTree } from "lucide-react";
import { Category } from "@/types";

interface CategoriesFilterToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  typeFilter: "all" | "root_only" | "sub_only" | "level_2" | "level_3";
  onTypeFilterChange: (type: "all" | "root_only" | "sub_only" | "level_2" | "level_3") => void;
  selectedRootId: number | "all";
  onSelectedRootIdChange: (id: number | "all") => void;
  selectedParentId: number | "all";
  onSelectedParentIdChange: (id: number | "all") => void;
  rootCategories: Category[];
  parentOptions: Category[];
  isFiltered: boolean;
  onResetFilters: () => void;
  viewMode: "table" | "tree";
  onViewModeChange: (mode: "table" | "tree") => void;
}

export function CategoriesFilterToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  selectedRootId,
  onSelectedRootIdChange,
  selectedParentId,
  onSelectedParentIdChange,
  rootCategories,
  parentOptions,
  isFiltered,
  onResetFilters,
  viewMode,
  onViewModeChange,
}: CategoriesFilterToolbarProps) {
  return (
    <div className="p-4 rounded-md bg-[#0e121e] border border-white/10 space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search category, subcategory, slug..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-9.5 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Hierarchy Level */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as "all" | "root_only" | "sub_only" | "level_2" | "level_3")}
            className="w-full bg-[#131722] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 cursor-pointer"
          >
            <option value="all">All Levels (Root & Subcategories)</option>
            <option value="root_only">📁 Root Categories Only (Level 1)</option>
            <option value="sub_only">↳ All Subcategories (Level 2+)</option>
            <option value="level_2">↳ Direct Subcategories (Level 2)</option>
            <option value="level_3">↳↳ Deep Subcategories (Level 3+)</option>
          </select>
        </div>

        {/* Filter by Root Branch */}
        <div>
          <select
            value={selectedRootId === "all" ? "all" : selectedRootId}
            onChange={(e) => onSelectedRootIdChange(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full bg-[#131722] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 cursor-pointer"
          >
            <option value="all">All Root Department Branches</option>
            {rootCategories.map((root) => (
              <option key={root.id} value={root.id}>
                📁 Branch: {root.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Specific Parent */}
        <div className="flex items-center gap-2">
          <select
            value={selectedParentId === "all" ? "all" : selectedParentId}
            onChange={(e) => onSelectedParentIdChange(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full bg-[#131722] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 cursor-pointer min-w-0"
          >
            <option value="all">All Parent Categories</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                Under: {parent.name}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-[#A78BFA] hover:text-[#B9A3FF] border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Toggle & Status Footer Bar */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-400">
        <span className="text-[11px]">
          {isFiltered ? "Filters active — showing filtered catalog scope" : "Displaying full catalog taxonomy hierarchy"}
        </span>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#090d18] p-1 rounded-md border border-white/10">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("tree")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "tree"
                ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Tree View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
