"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirmDiscard: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesModal({
  isOpen,
  onConfirmDiscard,
  onCancel,
  title = "Discard Unsaved Changes?",
  description = "You have modified product details that have not been saved yet. Leaving or discarding now will permanently lose these modifications.",
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0c101d] border border-amber-500/30 rounded-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Unsaved draft modifications detected</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-md">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={onConfirmDiscard}
            className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
