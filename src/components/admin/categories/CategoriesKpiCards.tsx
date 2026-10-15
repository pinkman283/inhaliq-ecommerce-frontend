"use client";

import React from "react";
import { Boxes, Folder, FolderTree, Layers, Package } from "lucide-react";

export interface CategoryStats {
  total: number;
  rootCount: number;
  subCount: number;
  deepCount: number;
  totalProducts: number;
}

interface CategoriesKpiCardsProps {
  stats: CategoryStats;
  typeFilter: "all" | "root_only" | "sub_only" | "level_2" | "level_3";
  selectedRootId: number | "all";
  selectedParentId: number | "all";
  onSelectFilter: (type: "all" | "root_only" | "sub_only" | "level_2" | "level_3") => void;
}

export function CategoriesKpiCards({
  stats,
  typeFilter,
  selectedRootId,
  selectedParentId,
  onSelectFilter,
}: CategoriesKpiCardsProps) {
  return (
    <div className="space-y-3">
      {/* 3-Tier Hierarchy Tab Bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onSelectFilter("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            typeFilter === "all"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>All Categories ({stats.total})</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter("root_only")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            typeFilter === "root_only"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Main Categories ({stats.rootCount})</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter("sub_only")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            typeFilter === "sub_only"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Subcategories ({stats.subCount})</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter("level_3")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            typeFilter === "level_3"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Child Categories ({stats.deepCount})</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Items */}
        <button
          type="button"
          onClick={() => onSelectFilter("all")}
          className={`p-3.5 rounded-md border text-left transition-all cursor-pointer ${
            typeFilter === "all" && selectedRootId === "all" && selectedParentId === "all"
              ? "bg-[#211B32] border-[#A78BFA]/40 ring-1 ring-[#A78BFA]/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Total Items</span>
            <Boxes className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">All taxonomy items</p>
        </button>

        {/* Root Categories */}
        <button
          type="button"
          onClick={() => onSelectFilter("root_only")}
          className={`p-3.5 rounded-md border text-left transition-all cursor-pointer ${
            typeFilter === "root_only"
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Root Departments</span>
            <Folder className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.rootCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Level 1 departments</p>
        </button>

        {/* Subcategories */}
        <button
          type="button"
          onClick={() => onSelectFilter("sub_only")}
          className={`p-3.5 rounded-md border text-left transition-all cursor-pointer ${
            typeFilter === "sub_only"
              ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Subcategories</span>
            <FolderTree className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-400 mt-1">{stats.subCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Nested subcategories</p>
        </button>

        {/* Deep Subcategories (L3+) */}
        <button
          type="button"
          onClick={() => onSelectFilter("level_3")}
          className={`p-3.5 rounded-md border text-left transition-all cursor-pointer ${
            typeFilter === "level_3"
              ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Deep Subcategories</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-indigo-400 mt-1">{stats.deepCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Level 3+ leaf items</p>
        </button>

        {/* Total Products Assigned */}
        <div className="p-3.5 rounded-md border border-white/10 bg-[#0e121e] text-left col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Total Products</span>
            <Package className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-xl font-black text-white mt-1">{stats.totalProducts}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Assigned to catalog</p>
        </div>
      </div>
    </div>
  );
}
