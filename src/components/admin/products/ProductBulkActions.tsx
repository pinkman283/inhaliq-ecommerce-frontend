"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  X,
  Trash2,
  CheckCircle,
  EyeOff,
  FolderTree,
  Award,
  DollarSign,
  AlertTriangle,
  Loader2,
  Percent,
} from "lucide-react";
import { Category, Brand } from "@/types";

export interface BulkUpdatePayload {
  operation: "activate" | "deactivate" | "category" | "brand" | "price";
  category_id?: number;
  brand_id?: number;
  adjustment_type?: "percentage" | "fixed";
  value?: number;
  rounding?: "none" | "round" | "ceil" | "floor" | "round_99";
}

interface ProductBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  categories: Category[];
  brands: Brand[];
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onConfirmDelete: () => Promise<void> | void;
  onBulkUpdate: (payload: BulkUpdatePayload) => Promise<void> | void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

type ActiveModal = "none" | "activate" | "deactivate" | "category" | "brand" | "price" | "delete";

export function ProductBulkActions({
  selectedCount,
  totalCount,
  categories,
  brands,
  onClearSelection,
  onSelectAll,
  onConfirmDelete,
  onBulkUpdate,
  isDeleting = false,
  isUpdating = false,
}: ProductBulkActionsProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");

  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Brand state
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  // Price adjustment state
  const [priceAdjustmentType, setPriceAdjustmentType] = useState<"percentage" | "fixed">("percentage");
  const [priceValueInput, setPriceValueInput] = useState<string>("10");
  const [priceRounding, setPriceRounding] = useState<"none" | "round" | "ceil" | "floor" | "round_99">("none");

  const isBusy = isDeleting || isUpdating;

  const handleExecuteStatus = async (operation: "activate" | "deactivate") => {
    await onBulkUpdate({ operation });
    setActiveModal("none");
  };

  const handleExecuteCategory = async () => {
    if (!selectedCategoryId) return;
    await onBulkUpdate({
      operation: "category",
      category_id: parseInt(selectedCategoryId, 10),
    });
    setActiveModal("none");
    setSelectedCategoryId("");
  };

  const handleExecuteBrand = async () => {
    if (!selectedBrandId) return;
    await onBulkUpdate({
      operation: "brand",
      brand_id: parseInt(selectedBrandId, 10),
    });
    setActiveModal("none");
    setSelectedBrandId("");
  };

  const handleExecutePrice = async () => {
    const val = parseFloat(priceValueInput);
    if (isNaN(val)) return;
    await onBulkUpdate({
      operation: "price",
      adjustment_type: priceAdjustmentType,
      value: val,
      rounding: priceRounding,
    });
    setActiveModal("none");
  };

  const handleDelete = async () => {
    await onConfirmDelete();
    setActiveModal("none");
  };

  return (
    <>
      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2.5 px-4 py-3 rounded-2xl bg-[#0d101a]/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.15)] text-xs text-white">
              {/* Badge & Count */}
              <div className="flex items-center gap-2 pr-2 border-r border-white/10 shrink-0">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black border border-amber-500/30 text-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{selectedCount}</span>
                  <span className="font-medium text-amber-200/80">
                    {selectedCount === 1 ? "product" : "products"}
                  </span>
                </span>

                {totalCount && onSelectAll && selectedCount < totalCount && (
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="hidden sm:inline-flex text-[11px] font-bold text-slate-400 hover:text-white underline underline-offset-2 transition-colors px-1 cursor-pointer"
                  >
                    All ({totalCount})
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {/* Activate */}
                <button
                  type="button"
                  onClick={() => setActiveModal("activate")}
                  disabled={isBusy}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Activate selected products"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Activate</span>
                </button>

                {/* Deactivate */}
                <button
                  type="button"
                  onClick={() => setActiveModal("deactivate")}
                  disabled={isBusy}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Deactivate selected products"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Deactivate</span>
                </button>

                {/* Category */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(categories[0]?.id?.toString() || "");
                    setActiveModal("category");
                  }}
                  disabled={isBusy || categories.length === 0}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Assign Category"
                >
                  <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                  <span>Category</span>
                </button>

                {/* Brand */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrandId(brands[0]?.id?.toString() || "");
                    setActiveModal("brand");
                  }}
                  disabled={isBusy || brands.length === 0}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Assign Brand"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Brand</span>
                </button>

                {/* Price */}
                <button
                  type="button"
                  onClick={() => {
                    setPriceAdjustmentType("percentage");
                    setPriceValueInput("10");
                    setPriceRounding("none");
                    setActiveModal("price");
                  }}
                  disabled={isBusy}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Adjust Prices"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Adjust Price</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setActiveModal("delete")}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50 cursor-pointer ml-1"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete</span>
                </button>

                {/* Clear */}
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
                  title="Clear Selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ACTIVATE CONFIRM */}
      <AnimatePresence>
        {activeModal === "activate" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0c101d] border border-emerald-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Activate {selectedCount} Product(s)?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will set <span className="font-semibold text-white">{selectedCount}</span> product(s) to <span className="text-emerald-400 font-semibold">Active</span> status, making them visible on the storefront.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteStatus("activate")}
                  disabled={isBusy}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Activation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DEACTIVATE CONFIRM */}
      <AnimatePresence>
        {activeModal === "deactivate" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0c101d] border border-amber-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-400">
                <EyeOff className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Deactivate {selectedCount} Product(s)?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will set <span className="font-semibold text-white">{selectedCount}</span> product(s) to <span className="text-amber-400 font-semibold">Inactive</span> status, hiding them from the customer storefront.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteStatus("deactivate")}
                  disabled={isBusy}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
                  <span>Confirm Deactivation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ASSIGN CATEGORY */}
      <AnimatePresence>
        {activeModal === "category" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0c101d] border border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-blue-400">
                <FolderTree className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Assign Category ({selectedCount} items)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Select the destination category for all <span className="font-semibold text-white">{selectedCount}</span> selected products.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCategory}
                  disabled={isBusy || !selectedCategoryId}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Assign Category</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ASSIGN BRAND */}
      <AnimatePresence>
        {activeModal === "brand" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0c101d] border border-purple-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Award className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Assign Brand ({selectedCount} items)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Select the brand for all <span className="font-semibold text-white">{selectedCount}</span> selected products.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Brand
                </label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBrand}
                  disabled={isBusy || !selectedBrandId}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Assign Brand</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: ADJUST PRICE */}
      <AnimatePresence>
        {activeModal === "price" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0c101d] border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <DollarSign className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Bulk Price Adjustment ({selectedCount} items)</h3>
              </div>
              
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200/90 leading-relaxed">
                Adjust retail pricing for all <span className="font-bold text-white">{selectedCount}</span> selected products. Negative prices are blocked automatically. Cost prices and variant price modifiers are preserved.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPriceAdjustmentType("percentage")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        priceAdjustmentType === "percentage"
                          ? "bg-cyan-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Percent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceAdjustmentType("fixed")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        priceAdjustmentType === "fixed"
                          ? "bg-cyan-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Fixed $</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Value {priceAdjustmentType === "percentage" ? "(%)" : "($ amount)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={priceValueInput}
                    onChange={(e) => setPriceValueInput(e.target.value)}
                    placeholder={priceAdjustmentType === "percentage" ? "e.g. 10 or -5" : "e.g. 5.00 or -2.50"}
                    className="w-full bg-[#161a26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Rounding Rule
                </label>
                <select
                  value={priceRounding}
                  onChange={(e) => setPriceRounding(e.target.value as "none" | "round" | "ceil" | "floor" | "round_99")}
                  className="w-full bg-[#161a26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="none">Standard 2 Decimals (e.g. $19.45)</option>
                  <option value="round">Nearest Whole Number (e.g. $19.00)</option>
                  <option value="round_99">Retail .99 Ending (e.g. $19.99)</option>
                  <option value="ceil">Round Up to Whole (Ceiling)</option>
                  <option value="floor">Round Down to Whole (Floor)</option>
                </select>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Effect Summary</div>
                <div className="text-white font-medium">
                  {parseFloat(priceValueInput) >= 0 ? "+" : ""}
                  {priceValueInput || "0"}
                  {priceAdjustmentType === "percentage" ? "%" : " flat"} on {selectedCount} product(s)
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrice}
                  disabled={isBusy || isNaN(parseFloat(priceValueInput))}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
                  <span>Apply Price Adjustment</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: DELETE CONFIRM */}
      <AnimatePresence>
        {activeModal === "delete" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0c101d] border border-rose-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Delete {selectedCount} Product(s)?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-white">{selectedCount}</span> product(s)? Products with orders or inventory history will be safely blocked from deletion.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isBusy}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
