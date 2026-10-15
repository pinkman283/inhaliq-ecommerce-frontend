"use client";

import React from "react";
import { DollarSign, Info, TrendingUp, PackageCheck } from "lucide-react";
import { ProductFormData } from "@/types";

interface ProductPricingTabProps {
  formData: ProductFormData;
  onChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function ProductPricingTab({ formData, onChange }: ProductPricingTabProps) {
  const priceNum = parseFloat(formData.price || "0");
  const costNum = parseFloat(formData.cost_price || "0");
  const compareNum = parseFloat(formData.compare_at_price || "0");

  const hasVariants = formData.variants && formData.variants.length > 0;
  const variantStockSum = hasVariants
    ? formData.variants.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0)
    : 0;

  // Potential profit margin estimate if cost_price is entered
  const margin = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Informative banner if variants exist */}
      {hasVariants && (
        <div className="p-3.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-white">Stock Synchronized from Variants</p>
            <p className="text-amber-300/80 leading-relaxed text-[11px]">
              This product has {formData.variants.length} option variant(s). The total inventory level ({variantStockSum} units) is automatically synchronized from the variants sum in the Variants tab.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#A78BFA]" />
            Pricing Strategy
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">Currency: USD / BDT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Selling Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              Selling Price <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => onChange("price", e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none"
              />
            </div>
            <p className="text-[10.5px] text-slate-500">Retail price charged to customers</p>
          </div>

          {/* Compare-At Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 block">Compare-At Price</label>
              <span className="text-[10px] text-slate-500 font-mono">Optional</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.compare_at_price}
                onChange={(e) => onChange("compare_at_price", e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none"
              />
            </div>
            <p className="text-[10.5px] text-slate-500">
              {compareNum > priceNum && priceNum > 0 ? (
                <span className="text-emerald-400 font-medium">
                  {Math.round(((compareNum - priceNum) / compareNum) * 100)}% discount badge
                </span>
              ) : (
                "Original price to show strikethrough"
              )}
            </p>
          </div>

          {/* Cost Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 block">Cost Price (COGS)</label>
              <span className="text-[10px] text-slate-500 font-mono">Internal only</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => onChange("cost_price", e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-8 pr-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none"
              />
            </div>
            <p className="text-[10.5px] text-slate-500">
              {margin !== null ? (
                <span className={margin > 0 ? "text-emerald-400" : "text-rose-400"}>
                  Estimated Margin: {margin.toFixed(1)}%
                </span>
              ) : (
                "Item cost for accounting and profit analytics"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Inventory & Stock Management */}
      <div className="pt-5 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            Inventory & Warehouse Quantity
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              Stock Quantity <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              disabled={hasVariants}
              value={hasVariants ? variantStockSum.toString() : formData.stock_quantity}
              onChange={(e) => onChange("stock_quantity", e.target.value)}
              placeholder="0"
              className={`w-full border rounded-md px-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none ${
                hasVariants
                  ? "bg-white/[0.01] border-white/5 opacity-70 cursor-not-allowed text-slate-400"
                  : "bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50"
              }`}
            />
            <p className="text-[10.5px] text-slate-500">
              {hasVariants
                ? "Locked: calculated dynamically as the sum of variant stock."
                : "Available physical warehouse inventory."}
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                Stock Attention Thresholds
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                System marks stock between 1 and 10 units as <span className="text-amber-400 font-semibold">Low Stock</span>, and 0 units as <span className="text-rose-400 font-semibold">Out of Stock</span>.
              </p>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 font-mono">
              Current Status:{" "}
              {Number(formData.stock_quantity) <= 0 ? (
                <span className="text-rose-400 font-bold">Out of Stock</span>
              ) : Number(formData.stock_quantity) <= 10 ? (
                <span className="text-amber-400 font-bold">Low Stock Warning</span>
              ) : (
                <span className="text-emerald-400 font-bold">Healthy Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
