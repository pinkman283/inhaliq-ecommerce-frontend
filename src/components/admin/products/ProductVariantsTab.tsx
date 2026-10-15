"use client";

import React, { useState } from "react";
import { Plus, Layers, Edit3 } from "lucide-react";
import { ProductFormVariant } from "@/types";
import { toast } from "sonner";
import {
  VariantMatrixGenerator,
  VariantBulkToolbar,
  VariantMatrixTable,
  generateCartesianCombinations,
  checkDuplicateVariants,
  buildVariantDisplayName,
  SelectedColorOption,
} from "./variants";

interface ProductVariantsTabProps {
  variants: ProductFormVariant[];
  onVariantsChange: (variants: ProductFormVariant[]) => void;
  onStockSync: (newTotalStock: number) => void;
}

export function ProductVariantsTab({
  variants,
  onVariantsChange,
  onStockSync,
}: ProductVariantsTabProps) {
  // Mode selection: Matrix Generator vs Manual Option Form
  const [activeMode, setActiveMode] = useState<"matrix" | "manual">("matrix");

  // Manual Form States
  const [manualName, setManualName] = useState("");
  const [manualSize, setManualSize] = useState("");
  const [manualColorName, setManualColorName] = useState("");
  const [manualColorHex, setManualColorHex] = useState("");
  const [manualStock, setManualStock] = useState("20");
  const [manualPriceMod, setManualPriceMod] = useState("0");
  const [manualCostPrice, setManualCostPrice] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");

  const updateAndSync = (next: ProductFormVariant[]) => {
    onVariantsChange(next);
    const sum = next.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);
    onStockSync(sum);
  };

  // 1. Matrix Generation Handler
  const handleGenerateMatrix = (
    selectedColors: SelectedColorOption[],
    selectedSizes: string[],
    defaultStock: number,
    defaultPriceMod: number
  ) => {
    const nextVariants = generateCartesianCombinations({
      selectedColors,
      selectedSizes,
      existingVariants: variants,
      defaultStock,
      defaultPriceModifier: defaultPriceMod,
    });

    const dupError = checkDuplicateVariants(nextVariants);
    if (dupError) {
      toast.error(dupError);
      return;
    }

    updateAndSync(nextVariants);
    toast.success(`Generated matrix with ${nextVariants.length} total options.`);
  };

  // 2. Bulk Operations Handlers
  const handleBulkSetStock = (stock: number) => {
    const next = variants.map((v) => ({ ...v, stock_quantity: stock }));
    updateAndSync(next);
  };

  const handleBulkSetPriceModifier = (mod: number) => {
    const next = variants.map((v) => ({ ...v, price_modifier: mod }));
    updateAndSync(next);
  };

  const handleBulkSetCostPrice = (cost: number | null) => {
    const next = variants.map((v) => ({ ...v, cost_price: cost }));
    updateAndSync(next);
  };

  const handleClearMatrix = () => {
    updateAndSync([]);
  };

  // 3. Inline Matrix Table Editing Handlers
  const handleUpdateVariant = (index: number, updated: Partial<ProductFormVariant>) => {
    const next = variants.map((v, idx) => (idx === index ? { ...v, ...updated } : v));
    updateAndSync(next);
  };

  const handleRemoveVariant = (index: number) => {
    const removed = variants[index];
    const next = variants.filter((_, idx) => idx !== index);
    updateAndSync(next);
    toast.info(`Removed option '${removed?.name || "variant"}'.`);
  };

  // 4. Manual Variant Addition Handler
  const handleAddManualVariant = () => {
    const trimmedName = manualName.trim();
    const trimmedSize = manualSize.trim();
    const trimmedColor = manualColorName.trim();

    if (!trimmedName && !trimmedSize && !trimmedColor) {
      toast.error("Please enter a variant name, size, or color.");
      return;
    }

    const displayName = trimmedName || buildVariantDisplayName(trimmedColor, trimmedSize);
    const stockQty = Math.max(0, parseInt(manualStock || "0", 10));
    const priceMod = parseFloat(manualPriceMod || "0") || 0;
    const costPrice = manualCostPrice ? parseFloat(manualCostPrice) : null;
    const barcode = manualBarcode.trim() || null;

    const newVar: ProductFormVariant = {
      name: displayName,
      size: trimmedSize || null,
      color_name: trimmedColor || null,
      color_hex: manualColorHex || null,
      stock_quantity: stockQty,
      price_modifier: priceMod,
      cost_price: costPrice,
      barcode,
      sku: null,
    };

    const next = [...variants, newVar];
    const dupError = checkDuplicateVariants(next);
    if (dupError) {
      toast.error(dupError);
      return;
    }

    updateAndSync(next);

    // Reset manual form
    setManualName("");
    setManualSize("");
    setManualColorName("");
    setManualColorHex("");
    setManualStock("20");
    setManualPriceMod("0");
    setManualCostPrice("");
    setManualBarcode("");
    toast.success(`Option '${displayName}' added.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white tracking-wide">
              Product Options & Variants
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400 font-bold">
              {variants.length} Configured
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Configure combination matrices (Colors × Sizes) or add standalone generic options. Leave empty for single standard products.
          </p>
        </div>

        {/* Workflow Switcher Tabs */}
        <div className="flex items-center p-0.5 rounded-md bg-white/[0.04] border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode("matrix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeMode === "matrix"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-2xs font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Combination Matrix
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeMode === "manual"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-2xs font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Manual / Generic Option
          </button>
        </div>
      </div>

      {/* Mode A: Combination Matrix Generator */}
      {activeMode === "matrix" && (
        <div className="space-y-4">
          <VariantMatrixGenerator onGenerateMatrix={handleGenerateMatrix} />

          {variants.length > 0 && (
            <VariantBulkToolbar
              onBulkSetStock={handleBulkSetStock}
              onBulkSetPriceModifier={handleBulkSetPriceModifier}
              onBulkSetCostPrice={handleBulkSetCostPrice}
              onClearMatrix={handleClearMatrix}
              totalVariantsCount={variants.length}
            />
          )}

          <VariantMatrixTable
            variants={variants}
            onUpdateVariant={handleUpdateVariant}
            onRemoveVariant={handleRemoveVariant}
          />
        </div>
      )}

      {/* Mode B: Manual / Generic Variant Addition */}
      {activeMode === "manual" && (
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                Add Standalone or Generic Option
              </h5>
              <span className="text-[10px] text-slate-500">
                Ideal for switch types, editions, or options without rigid color/size keys.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[11px] text-slate-400">Option Name *</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Red Linear Switch or CyberDeck 65%"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Size / Spec (optional)</label>
                <input
                  type="text"
                  value={manualSize}
                  onChange={(e) => setManualSize(e.target.value)}
                  placeholder="e.g. 49mm, TKL, 2TB"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Color Name (optional)</label>
                <input
                  type="text"
                  value={manualColorName}
                  onChange={(e) => setManualColorName(e.target.value)}
                  placeholder="e.g. Obsidian Black"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Color Hex (optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={manualColorHex || "#000000"}
                    onChange={(e) => setManualColorHex(e.target.value)}
                    className="w-8 h-8 rounded-md border border-white/10 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={manualColorHex}
                    onChange={(e) => setManualColorHex(e.target.value)}
                    placeholder="#111111"
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={manualStock}
                  onChange={(e) => setManualStock(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white outline-none transition"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Price Modifier (+$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualPriceMod}
                  onChange={(e) => setManualPriceMod(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white outline-none transition"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] text-slate-400">Barcode (optional)</label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="UPC / EAN"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddManualVariant}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Standalone Option
              </button>
            </div>
          </div>

          {/* Configured Variants Table in Manual View */}
          <VariantMatrixTable
            variants={variants}
            onUpdateVariant={handleUpdateVariant}
            onRemoveVariant={handleRemoveVariant}
          />
        </div>
      )}
    </div>
  );
}
