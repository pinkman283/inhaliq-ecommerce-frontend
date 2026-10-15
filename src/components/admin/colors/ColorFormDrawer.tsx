"use client";

import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Color } from "@/types";
import { toast } from "sonner";

export interface ColorFormData {
  name: string;
  hex_code: string;
  status: "active" | "inactive";
  sort_order?: number;
}

interface ColorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingColor: Color | null;
  onSave: (data: ColorFormData) => Promise<void>;
  saving: boolean;
}

const QUICK_PRESETS = [
  { name: "Obsidian", hex: "#0F172A" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Slate Grey", hex: "#64748B" },
  { name: "Crimson Red", hex: "#EF4444" },
  { name: "Royal Blue", hex: "#1D4ED8" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Cyber Cyan", hex: "#06B6D4" },
  { name: "Sunset Orange", hex: "#F97316" },
  { name: "Gold / Sand", hex: "#E0A96D" },
  { name: "Deep Violet", hex: "#8B5CF6" },
];

function ColorFormDrawerContent({
  onClose,
  editingColor,
  onSave,
  saving,
}: Omit<ColorFormDrawerProps, "isOpen">) {
  const [name, setName] = useState(() => editingColor?.name || "");
  const [hex, setHex] = useState(() => editingColor?.hex_code || "#3B82F6");
  const [status, setStatus] = useState<"active" | "inactive">(
    () => editingColor?.status || "active"
  );
  const [sortOrder, setSortOrder] = useState<string>(
    () => (editingColor?.sort_order ?? 0).toString()
  );

  const isEditDirty = Boolean(
    editingColor && (
      name.trim() !== (editingColor.name || "").trim() ||
      hex.toUpperCase() !== (editingColor.hex_code || "").toUpperCase() ||
      status !== editingColor.status ||
      sortOrder !== (editingColor.sort_order ?? 0).toString()
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Color name is required.");
      return;
    }
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
      toast.error("Please enter a valid HEX color code (e.g. #0F172A).");
      return;
    }

    if (editingColor && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }

    await onSave({
      name: name.trim(),
      hex_code: hex.toUpperCase(),
      status,
      sort_order: parseInt(sortOrder || "0", 10) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-3">
          <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
            {editingColor ? "Edit Color Swatch" : "New Color Swatch"}
          </SheetTitle>
          {editingColor && (
            <>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                #{editingColor.id}
              </span>
              <span className="text-slate-600 text-xs shrink-0">·</span>
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                {editingColor.name}
              </span>
            </>
          )}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Color Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Midnight Black, Cyber Cyan"
            className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 focus:outline-hidden transition"
          />
        </div>

        {/* HEX Input & Color Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            HEX Color Code <span className="text-rose-400">*</span>
          </label>
          <div className="flex items-center gap-2.5">
            {/* Color Swatch Picker */}
            <div className="relative w-9 h-9 rounded-md border border-white/20 overflow-hidden shrink-0 shadow-inner group cursor-pointer">
              <input
                type="color"
                value={hex.startsWith("#") ? hex : "#3B82F6"}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: hex }}
              />
            </div>
            <input
              type="text"
              required
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1 h-9 rounded-md border border-white/10 bg-[#131722] px-3 font-mono text-xs text-white uppercase placeholder:text-slate-500 focus:border-[#A78BFA]/50 focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* Quick Palette Presets */}
        <div className="space-y-2 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Quick Palette Presets
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => {
                  setHex(preset.hex);
                  if (!name.trim()) setName(preset.name);
                }}
                className="flex items-center gap-2 p-1.5 rounded-md border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.06] transition text-left cursor-pointer"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className="text-[11px] text-slate-300 truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Selection */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
          <label className="text-xs font-medium text-slate-300">Palette Visibility</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-hidden transition cursor-pointer"
          >
            <option value="active">Active (Available for variant selection)</option>
            <option value="inactive">Inactive (Hidden from catalog presets)</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Display Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
            className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[#A78BFA]/50 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="h-14 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-400 hover:text-white transition px-2 py-1 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || (editingColor ? !isEditDirty : false)}
          className={`h-8 px-4 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${
            editingColor && !isEditDirty
              ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold"
          }`}
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{saving ? "Saving..." : editingColor ? "Save Changes" : "Create Swatch"}</span>
        </button>
      </div>
    </form>
  );
}

export function ColorFormDrawer({
  isOpen,
  onClose,
  editingColor,
  onSave,
  saving,
}: ColorFormDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[440px] sm:!max-w-[440px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        {isOpen && (
          <ColorFormDrawerContent
            onClose={onClose}
            editingColor={editingColor}
            onSave={onSave}
            saving={saving}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
