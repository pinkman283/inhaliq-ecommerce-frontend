"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { 
  Package, 
  AlertTriangle, 
  ChevronRight, 
  ExternalLink, 
  TrendingUp, 
  SlidersHorizontal,
  Star
} from "lucide-react";

interface ProductAndInventoryGridProps {
  topProducts: Product[];
  lowStockCount: number;
  totalProducts: number;
  isLoading?: boolean;
}

export const ProductAndInventoryGrid: React.FC<ProductAndInventoryGridProps> = ({
  topProducts = [],
  lowStockCount = 0,
  totalProducts = 0,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Top Performing Items (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                Top Performing Catalog Items
              </h2>
              <p className="text-xs text-[#6B7280]">
                Highest customer velocity and verified rating density
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <div className="py-8 text-center text-[#6B7280]">
                <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs">Loading catalog performance...</span>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-[#6B7280]">
                <Package className="w-6 h-6 text-[#9CA3AF] mx-auto mb-1" />
                <p className="text-xs font-medium text-[#111827]">No top selling products logged yet</p>
              </div>
            ) : (
              topProducts.slice(0, 5).map((p, idx) => {
                const img = p.primary_image?.image_url || p.images?.[0]?.image_url;
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-[#9CA3AF] w-4 shrink-0">
                        0{idx + 1}
                      </span>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-[#E5E7EB] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-[#E5E7EB] flex items-center justify-center shrink-0 text-[#9CA3AF]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                          className="text-xs font-semibold text-[#111827] hover:text-[#009B55] transition-colors truncate block"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                          <span>{p.brand || "Inhaliq"}</span>
                          {typeof p.stock_quantity === "number" && (
                            <>
                              <span>•</span>
                              <span className={p.stock_quantity <= 10 ? "text-amber-600 font-medium" : "text-[#009B55]"}>
                                {p.stock_quantity} in stock
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-[#111827] block">
                        {formatPrice(p.price)}
                      </span>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-amber-600 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{p.rating_average?.toFixed(1) ?? "5.0"}</span>
                        <span className="text-[#9CA3AF]">({p.review_count ?? 0})</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <Link
            href="/admin/products"
            className="text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center justify-between"
          >
            <span>Manage product variations, SKUs, and retail pricing</span>
            <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
          </Link>
        </div>
      </div>

      {/* Inventory & Stock Intelligence (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">
                Inventory & Stock Health
              </h2>
              <p className="text-xs text-[#6B7280]">
                Critical stock monitoring and replenishment alerts
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Catalog Items
              </span>
              <span className="text-lg font-bold font-mono text-[#111827] block mt-0.5">
                {totalProducts} SKUs
              </span>
              <span className="text-[11px] text-[#009B55] font-medium block mt-0.5">
                Active in Store
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${
              lowStockCount > 0
                ? "bg-amber-50/50 border-amber-200 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-80">
                Low Stock Threshold
              </span>
              <span className="text-lg font-bold font-mono block mt-0.5">
                {lowStockCount} Units
              </span>
              <span className="text-[11px] font-medium block mt-0.5">
                {lowStockCount > 0 ? "Replenish immediately" : "Stock levels optimal"}
              </span>
            </div>
          </div>

          {/* Alert Status Banner */}
          {lowStockCount > 0 ? (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {lowStockCount} Product{lowStockCount > 1 ? "s" : ""} Below Safety Stock
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Inventory count is at or below 10 units. Run a supplier purchase order to prevent checkout friction.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-end">
                <Link
                  href="/admin/products?stock_status=low_stock"
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs"
                >
                  Inspect Low Stock SKUs →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[#009B55] shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">All Stock Healthy</h4>
                <p className="text-[11px] text-emerald-700">
                  No products have fallen below the 10-unit minimum buffer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Link Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            href="/admin/inventory"
            className="font-medium text-[#4B5563] hover:text-[#111827] flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Audit FIFO Cost Layers</span>
          </Link>
          <Link
            href="/admin/products"
            className="font-semibold text-[#009B55] hover:text-[#008247] transition-colors"
          >
            Stock Overview →
          </Link>
        </div>
      </div>
    </div>
  );
};
