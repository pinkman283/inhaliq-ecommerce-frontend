"use client";

import React from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AdminSaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  saveLabel?: string;
  discardLabel?: string;
  message?: string;
}

export const AdminSaveBar: React.FC<AdminSaveBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  saveLabel = "Save Changes",
  discardLabel = "Discard",
  message = "Unsaved changes",
}) => {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          key="admin-save-bar"
          role="region"
          aria-label="Unsaved changes bar"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-[#11141D]/95 border border-[#272B35] backdrop-blur-xl shadow-2xl shadow-black/80 ring-1 ring-[#272B35] pointer-events-auto"
        >
          {/* Unsaved Indicator */}
          <div className="flex items-center gap-2 pl-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A78BFA] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A78BFA]"></span>
            </span>
            <span className="text-xs font-semibold text-white whitespace-nowrap tracking-tight">
              {message}
            </span>
          </div>

          <div className="h-4 w-px bg-[#272B35]" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isDirty && !isSaving) {
                  onDiscard();
                }
              }}
              disabled={isSaving || !isDirty}
              className="px-3 py-1 rounded-md text-xs font-semibold text-[#929BAD] hover:text-[#E5E7EB] hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#929BAD]" />
              <span>{discardLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isDirty && !isSaving) {
                  onSave();
                }
              }}
              disabled={isSaving || !isDirty}
              className="px-4 py-1.5 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-md shadow-[#A78BFA]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveLabel}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
