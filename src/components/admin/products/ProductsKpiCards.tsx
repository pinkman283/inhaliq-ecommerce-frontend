import React from "react";
import { Package, Boxes, FolderTree, AlertTriangle } from "lucide-react";
import { ProductCatalogStats } from "@/types";

interface ProductsKpiCardsProps {
  stats: ProductCatalogStats | null;
  totalItems: number;
  categoriesCount: number;
}

export function ProductsKpiCards({
  stats,
  totalItems,
  categoriesCount,
}: ProductsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Total Catalog Products */}
      <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Catalog Products</span>
          <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">
            {(stats?.total_products ?? totalItems).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Unique catalog items</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* Card 2: Total Warehouse Stock Units */}
      <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Warehouse Stock</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">
            {(stats?.total_warehouse_units ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Total physical units on hand</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
          <Boxes className="w-5 h-5" />
        </div>
      </div>

      {/* Card 3: Categories */}
      <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Categories</span>
          <span className="text-lg sm:text-xl font-bold text-cyan-400 mt-0.5 block">
            {(stats?.total_categories ?? categoriesCount).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Taxonomy departments</span>
        </div>
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
          <FolderTree className="w-5 h-5" />
        </div>
      </div>

      {/* Card 4: Stock Attention Alerts */}
      <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Stock Attention</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-lg sm:text-xl font-bold text-rose-400">
              {stats?.out_of_stock_count ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">out</span>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-lg sm:text-xl font-bold text-amber-400">
              {stats?.low_stock_count ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">low</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Requires replenishment</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
