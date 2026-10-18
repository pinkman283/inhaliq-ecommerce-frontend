"use client";

import React, { useState } from "react";
import { Wrench, Trash2, AlertTriangle, DollarSign, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface VariantBulkToolbarProps {
  onBulkSetStock: (stock: number) => void;
  onBulkSetDirectPrice?: (price: number) => void;
  onBulkSetPriceModifier: (priceModifier: number) => void;
  onBulkSetCostPrice: (costPrice: number | null) => void;
  onBulkSetActive?: (active: boolean) => void;
  onClearMatrix: () => void;
  totalVariantsCount: number;
  disabled?: boolean;
}

export function VariantBulkToolbar({
  onBulkSetStock,
  onBulkSetDirectPrice,
  onBulkSetPriceModifier,
  onBulkSetCostPrice,
  onBulkSetActive,
  onClearMatrix,
  totalVariantsCount,
  disabled = false,
}: VariantBulkToolbarProps) {
  const [stockInput, setStockInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
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

  const handleApplyDirectPrice = () => {
    if (!onBulkSetDirectPrice) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid non-negative direct price.");
      return;
    }
    onBulkSetDirectPrice(price);
    setPriceInput("");
    toast.success(`Updated direct price to $${price.toFixed(2)} across all ${totalVariantsCount} variants.`);
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
    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Wrench className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span className="text-[11px] uppercase tracking-wider text-slate-300">Bulk Apply:</span>
        </div>

        {/* Bulk Stock */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            disabled={disabled}
            placeholder="Stock"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            className="w-16 bg-white/[0.04] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            disabled={disabled || stockInput === ""}
            onClick={handleApplyStock}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>

        {/* Bulk Direct Price */}
        {onBulkSetDirectPrice && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={disabled}
              placeholder="$ Price"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-20 bg-white/[0.04] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
            />
            <button
              type="button"
              disabled={disabled || priceInput === ""}
              onClick={handleApplyDirectPrice}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        )}

        {/* Bulk Cost */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            disabled={disabled}
            placeholder="Cost"
            value={costInput}
            onChange={(e) => setCostInput(e.target.value)}
            className="w-18 bg-white/[0.04] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            disabled={disabled || costInput === ""}
            onClick={handleApplyCostPrice}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>

        {/* Bulk Activate / Deactivate */}
        {onBulkSetActive && (
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onBulkSetActive(true);
                toast.success("Activated all variants.");
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium transition cursor-pointer disabled:opacity-30"
              title="Activate all variants"
            >
              <Eye className="w-3 h-3" />
              All Active
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onBulkSetActive(false);
                toast.info("Deactivated all variants.");
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border border-white/10 text-[11px] font-medium transition cursor-pointer disabled:opacity-30"
              title="Deactivate all variants"
            >
              <EyeOff className="w-3 h-3" />
              All Inactive
            </button>
          </div>
        )}
      </div>

      {/* Clear Matrix Action with Confirmation */}
      <div className="flex items-center gap-2">
        {showClearConfirm ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
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
            disabled={disabled}
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Matrix
          </button>
        )}
      </div>
    </div>
  );
}
