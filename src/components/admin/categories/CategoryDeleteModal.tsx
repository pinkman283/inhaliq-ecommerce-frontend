"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  X,
  Loader2,
  Package,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Category } from "@/types";

interface CategoryDeleteModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  deleting: boolean;
  categories: Category[];
}

export function CategoryDeleteModal({
  category,
  isOpen,
  onClose,
  onConfirmDelete,
  deleting,
  categories,
}: CategoryDeleteModalProps) {
  const childCategoriesCount = useMemo(() => {
    if (!category) return 0;
    if (typeof category.children_count === "number") return category.children_count;
    return categories.filter((c) => c.parent_id === category.id).length;
  }, [category, categories]);

  const directProductsCount = category?.products_count ?? 0;
  const subcategoryProductsCount = category?.subcategory_products_count ?? 0;

  const hasBlockingDependencies =
    directProductsCount > 0 ||
    subcategoryProductsCount > 0 ||
    childCategoriesCount > 0;

  if (!category) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[440px] sm:!max-w-[440px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-xs font-bold text-white tracking-wide">
                  Delete Category
                </SheetTitle>
                <p className="text-[10px] text-slate-400">Integrity & Safety Check</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Category to Delete
              </span>
              <p className="text-white font-bold text-sm mt-0.5">{category.name}</p>
              <p className="text-cyan-400 font-mono text-[11px] mt-0.5">/{category.slug}</p>
            </div>

            {hasBlockingDependencies ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Deletion Blocked by System</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    This category cannot be deleted because it is currently referenced by products or child categories. You must reassign or remove them first.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Conflicts:
                  </span>

                  {directProductsCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-slate-300">Directly Assigned Products</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                        {directProductsCount}
                      </span>
                    </div>
                  )}

                  {subcategoryProductsCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-300">Subcategory References</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px]">
                        {subcategoryProductsCount}
                      </span>
                    </div>
                  )}

                  {childCategoriesCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-slate-300">Child Subcategories</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px]">
                        {childCategoriesCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-white font-bold">{category.name}</strong>?
                </p>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  <p className="text-slate-300 font-medium mb-1">✓ No blocking dependencies detected:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    <li>0 products assigned directly</li>
                    <li>0 products assigned as subcategory</li>
                    <li>0 child subcategories</li>
                  </ul>
                </div>
                <p className="text-rose-400/90 text-[11px] font-medium">
                  This action cannot be undone. Once deleted, this category will be permanently removed.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="h-14 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting || hasBlockingDependencies}
              onClick={onConfirmDelete}
              className={`h-8 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                hasBlockingDependencies
                  ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600 text-white cursor-pointer disabled:opacity-50"
              }`}
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{hasBlockingDependencies ? "Cannot Delete (Conflicts)" : "Confirm Delete"}</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
