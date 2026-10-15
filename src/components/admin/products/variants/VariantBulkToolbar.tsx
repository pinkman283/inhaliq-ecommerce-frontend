"use client";

import React, { useState } from "react";
import { Wrench, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface VariantBulkToolbarProps {
  onBulkSetStock: (stock: number) => void;
  onBulkSetPriceModifier: (priceModifier: number) => void;
  onBulkSetCostPrice: (costPrice: number | null) => void;
  onClearMatrix: () => void;
  totalVariantsCount: number;
}

export function VariantBulkToolbar({
  onBulkSetStock,
  onBulkSetPriceModifier,
  onBulkSetCostPrice,
  onClearMatrix,
  totalVariantsCount,
}: VariantBulkToolbarProps) {
  const [stockInput, setStockInput] = useState("");
  const [priceModInput, setPriceModInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleApplyStock = () => {
    const qty = parseInt(stockInput, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid non-negative stock quantity.");
      return;
    }
    onBulkSetStock(qty);
    setStockInput("");
    toast.success(`Updated stock to ${qty} across all ${totalVariantsCount} variants.`);
  };

  const handleApplyPriceModifier = () => {
    const mod = parseFloat(priceModInput);
    if (isNaN(mod)) {
      toast.error("Please enter a valid price modifier number.");
      return;
    }
    onBulkSetPriceModifier(mod);
    setPriceModInput("");
    toast.success(`Updated price modifier to ${mod >= 0 ? `+${mod}` : mod} across all variants.`);
  };

  const handleApplyCostPrice = () => {
    if (costInput.trim() === "") {
      onBulkSetCostPrice(null);
      toast.info("Cleared cost price across all variants.");
      return;
    }
    const cost = parseFloat(costInput);
    if (isNaN(cost) || cost < 0) {
      toast.error("Please enter a valid cost price.");
      return;
    }
    onBulkSetCostPrice(cost);
    setCostInput("");
    toast.success(`Updated cost price to $${cost.toFixed(2)} across all variants.`);
  };

  const handleConfirmClear = () => {
    onClearMatrix();
    setShowClearConfirm(false);
    toast.info("Cleared matrix combinations in editor. Persisted variants will only be updated upon saving.");
  };

  return (
    <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] uppercase tracking-wider text-slate-300">Bulk Apply:</span>
        </div>

        {/* Bulk Stock */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            placeholder="Stock"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            className="w-16 bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={handleApplyStock}
            disabled={stockInput === ""}
            className="px-2 py-1 rounded-md bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>

        {/* Bulk Price Mod */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            placeholder="+$ Mod"
            value={priceModInput}
            onChange={(e) => setPriceModInput(e.target.value)}
            className="w-20 bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={handleApplyPriceModifier}
            disabled={priceModInput === ""}
            className="px-2 py-1 rounded-md bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>

        {/* Bulk Cost */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            placeholder="Cost"
            value={costInput}
            onChange={(e) => setCostInput(e.target.value)}
            className="w-18 bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={handleApplyCostPrice}
            disabled={costInput === ""}
            className="px-2 py-1 rounded-md bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Clear Matrix Action with Confirmation */}
      <div className="flex items-center gap-2">
        {showClearConfirm ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Clear all {totalVariantsCount} variants in editor?</span>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="px-2 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold transition cursor-pointer"
            >
              Yes, Clear
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Matrix
          </button>
        )}
      </div>
    </div>
  );
}
