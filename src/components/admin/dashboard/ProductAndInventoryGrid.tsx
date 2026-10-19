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
      <div className="lg:col-span-7 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Top Performing Catalog Items
              </h2>
              <p className="text-xs text-[#929BAD]">
                Highest customer velocity and verified rating density
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#272B35]">
            {isLoading ? (
              <div className="py-8 text-center text-[#929BAD]">
                <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs">Loading catalog performance...</span>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-[#929BAD]">
                <Package className="w-6 h-6 text-[#6B7280] mx-auto mb-1" />
                <p className="text-xs font-medium text-white">No top selling products logged yet</p>
              </div>
            ) : (
              topProducts.slice(0, 5).map((p, idx) => {
                const img = p.primary_image?.image_url || p.images?.[0]?.image_url;
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-[#6B7280] w-4 shrink-0">
                        0{idx + 1}
                      </span>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#171B26] border border-[#272B35] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-center shrink-0 text-[#6B7280]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                          className="text-xs font-semibold text-white hover:text-[#A78BFA] transition-colors truncate block"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-[#929BAD] mt-0.5">
                          <span>{p.brand || "Inhaliq"}</span>
                          {typeof p.stock_quantity === "number" && (
                            <>
                              <span>•</span>
                              <span className={p.stock_quantity <= 10 ? "text-amber-400 font-medium" : "text-emerald-400"}>
                                {p.stock_quantity} in stock
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-white block">
                        {formatPrice(p.price)}
                      </span>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-amber-400 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{p.rating_average?.toFixed(1) ?? "5.0"}</span>
                        <span className="text-[#929BAD]">({p.review_count ?? 0})</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#272B35]">
          <Link
            href="/admin/products"
            className="text-xs font-medium text-[#929BAD] hover:text-white flex items-center justify-between transition-colors"
          >
            <span>Manage product variations, SKUs, and retail pricing</span>
            <ExternalLink className="w-3 h-3 text-[#6B7280]" />
          </Link>
        </div>
      </div>

      {/* Inventory & Stock Intelligence (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Inventory & Stock Health
              </h2>
              <p className="text-xs text-[#929BAD]">
                Critical stock monitoring and replenishment alerts
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-[#171B26] border border-[#272B35]">
              <span className="text-[10px] font-semibold text-[#929BAD] uppercase tracking-wider block">
                Catalog Items
              </span>
              <span className="text-lg font-bold font-mono text-white block mt-0.5">
                {totalProducts} SKUs
              </span>
              <span className="text-[11px] text-[#A78BFA] font-medium block mt-0.5">
                Active in Store
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${
              lowStockCount > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-[#171B26] border-[#272B35] text-white"
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
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-200">
                    {lowStockCount} Product{lowStockCount > 1 ? "s" : ""} Below Safety Stock
                  </h4>
                  <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                    Inventory count is at or below 10 units. Run a supplier purchase order to prevent checkout friction.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-end">
                <Link
                  href="/admin/products?stock_status=low_stock"
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-xs"
                >
                  Inspect Low Stock SKUs →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-200">All Stock Healthy</h4>
                <p className="text-[11px] text-emerald-300/90">
                  No products have fallen below the 10-unit minimum buffer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Link Footer */}
        <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs">
          <Link
            href="/admin/inventory"
            className="font-medium text-[#929BAD] hover:text-white flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Audit FIFO Cost Layers</span>
          </Link>
          <Link
            href="/admin/products"
            className="font-semibold text-[#A78BFA] hover:text-[#B9A3FF] transition-colors"
          >
            Stock Overview →
          </Link>
        </div>
      </div>
    </div>
  );
};
