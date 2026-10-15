"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CheckSquare, X, AlertTriangle, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  itemName?: string;
  isDeleting?: boolean;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onConfirmDelete: () => Promise<void> | void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  itemName = "item",
  isDeleting = false,
  onClearSelection,
  onSelectAll,
  onConfirmDelete,
}: BulkActionBarProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDelete = async () => {
    await onConfirmDelete();
    setShowConfirmModal(false);
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-md bg-[#11141D]/95 backdrop-blur-xl border border-[#272B35] shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(167,139,250,0.15)] text-xs text-[#E5E7EB]">
              {/* Badge & Count */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#211B32] text-[#A78BFA] font-black border border-[#A78BFA]/30 text-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{selectedCount}</span>
                  <span className="font-medium text-[#B9A3FF]/80">
                    {selectedCount === 1 ? itemName : `${itemName}s`} selected
                  </span>
                </span>

                {totalCount && onSelectAll && selectedCount < totalCount && (
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="hidden sm:inline-flex text-[11px] font-bold text-[#929BAD] hover:text-[#E5E7EB] underline underline-offset-2 transition-colors px-1"
                  >
                    Select All ({totalCount})
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-3 py-1.5 rounded-md bg-[#171B26] hover:bg-[#272B35] text-[#929BAD] hover:text-[#E5E7EB] text-xs font-bold transition-all flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowConfirmModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-lg bg-[#11141D] border border-rose-500/30 p-6 shadow-2xl space-y-5 z-10 text-left"
            >
              {/* Header Icon */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Bulk Delete {selectedCount} {selectedCount === 1 ? itemName : `${itemName}s`}?
                  </h3>
                  <p className="text-xs text-[#929BAD]">
                    This action will permanently remove all selected records.
                  </p>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <span className="font-bold block mb-0.5">⚠️ Caution</span>
                Are you sure you want to proceed? This deletion is permanent and will be logged in the administrative audit trail.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-md bg-[#171B26] hover:bg-[#272B35] text-[#E5E7EB] text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Delete {selectedCount} {selectedCount === 1 ? itemName : `${itemName}s`}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
