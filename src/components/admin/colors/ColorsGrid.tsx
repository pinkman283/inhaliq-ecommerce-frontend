"use client";

import React from "react";
import { Loader2, Palette, Plus } from "lucide-react";
import { Color } from "@/types";
import { AdminEmptyState } from "@/components/admin/ui";
import { ColorCard } from "./ColorCard";

interface ColorsGridProps {
  colors: Color[];
  loading: boolean;
  onEdit: (color: Color) => void;
  onDelete: (color: Color) => void;
  onToggleStatus: (color: Color) => void;
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
  onOpenCreate: () => void;
}

export function ColorsGrid({
  colors,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onCopyHex,
  copiedHex,
  onOpenCreate,
}: ColorsGridProps) {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-xs uppercase tracking-wider font-semibold">
          Loading color palette library...
        </span>
      </div>
    );
  }

  if (colors.length === 0) {
    return (
      <AdminEmptyState
        icon={Palette}
        title="No Color Swatches Found"
        description="No colors match your search criteria. Create a standardized color swatch or clear your active filters."
        action={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Swatch
          </button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {colors.map((color) => (
        <ColorCard
          key={color.id}
          color={color}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onCopyHex={onCopyHex}
          copiedHex={copiedHex}
        />
      ))}
    </div>
  );
}
