"use client";

import React from "react";
import { AlertTriangle, X, Loader2, Boxes, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Color } from "@/types";

export interface ColorDeleteConflicts {
  product_variants?: number;
}

interface ColorDeleteModalProps {
  color: Color | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  deleting: boolean;
  serverConflicts?: ColorDeleteConflicts | null;
  serverErrorMessage?: string | null;
}

export function ColorDeleteModal({
  color,
  isOpen,
  onClose,
  onConfirmDelete,
  deleting,
  serverConflicts,
  serverErrorMessage,
}: ColorDeleteModalProps) {
  if (!color) return null;

  const variantsCount =
    serverConflicts?.product_variants ?? color.variants_count ?? 0;
  const hasBlockingDependencies = variantsCount > 0 || Boolean(serverConflicts);

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
              <div className="w-8 h-8 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-xs font-bold text-white tracking-wide">
                  Delete Color Swatch
                </SheetTitle>
                <p className="text-[10px] text-slate-400">Registry & Variant Protection</p>
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
            {/* Color Swatch Card */}
            <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border border-black/20 shadow-inner shrink-0 ring-2 ring-white/10"
                style={{ backgroundColor: color.hex_code }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Swatch to Delete
                </span>
                <p className="text-white font-bold text-sm mt-0.5">{color.name}</p>
                <p className="text-cyan-400 font-mono text-[11px] mt-0.5">{color.hex_code}</p>
              </div>
            </div>

            {hasBlockingDependencies ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Deletion Blocked by System</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    {serverErrorMessage ||
                      `Color '${color.name}' cannot be deleted because it is currently assigned to active product variants in the catalog. Reassign or remove these variants before deleting.`}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Catalog Conflicts:
                  </span>
                  <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-slate-300 font-medium block">
                          Assigned Product Variants
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Active inventory items using {color.name} ({color.hex_code})
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px]">
                      {variantsCount}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete the color swatch{" "}
                  <strong className="text-white font-bold">{color.name}</strong> ({color.hex_code})?
                </p>
                <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  <p className="text-slate-300 font-medium mb-1">
                    ✓ No active catalog dependencies detected:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    <li>0 product variants currently reference this swatch name or hex code</li>
                    <li>Safe to remove from the global color palette registry</li>
                  </ul>
                </div>
                <p className="text-rose-400/90 text-[11px] font-medium">
                  This action cannot be undone. Once deleted, this swatch will no longer appear in variant pickers.
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
              className={`h-8 px-4 rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                hasBlockingDependencies
                  ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600 text-white cursor-pointer disabled:opacity-50"
              }`}
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{hasBlockingDependencies ? "Cannot Delete (In Use)" : "Confirm Delete"}</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
