"use client";

import React from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

interface ModeSwitchConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variantsCount: number;
}

export function ModeSwitchConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  variantsCount,
}: ModeSwitchConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0c101d] border border-amber-500/30 rounded-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Switch to Simple Product?
              </h3>
              <p className="text-[11px] text-amber-400/80 font-mono mt-0.5">
                Existing variant combinations will be deactivated
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-xl space-y-2">
          <p>
            This product currently has <strong className="text-white">{variantsCount} variant combination(s)</strong> configured.
          </p>
          <p className="text-slate-400 text-[11px]">
            Switching to <strong>Simple Product</strong> mode will remove these combinations from the active catalog upon saving.
            In accordance with inventory safety rules, existing variant records will be <strong>soft-deactivated</strong> rather than deleted, preserving historical sales orders and inventory ledgers.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
          >
            Keep Variable Mode
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            Switch to Simple Product
          </button>
        </div>
      </div>
    </div>
  );
}
