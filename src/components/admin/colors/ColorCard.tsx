"use client";

import React from "react";
import { Edit, Trash2, Copy, Check, Boxes } from "lucide-react";
import { Color } from "@/types";
import { AdminStatusBadge } from "@/components/admin/ui";

interface ColorCardProps {
  color: Color;
  onEdit: (color: Color) => void;
  onDelete: (color: Color) => void;
  onToggleStatus: (color: Color) => void;
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
}

export function ColorCard({
  color,
  onEdit,
  onDelete,
  onToggleStatus,
  onCopyHex,
  copiedHex,
}: ColorCardProps) {
  const isCopied = copiedHex === color.hex_code;
  const variantsCount = color.variants_count ?? 0;

  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-md bg-[#0f121b] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#131722] transition-all shadow-sm">
      {/* Top Details & Swatch */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Color Swatch Circle */}
            <div
              className="w-10 h-10 rounded-full border border-black/20 shadow-md shrink-0 ring-2 ring-white/10"
              style={{ backgroundColor: color.hex_code }}
              title={color.hex_code}
            />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-[#A78BFA] transition-colors">
                {color.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs text-slate-400 font-medium">
                  {color.hex_code}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyHex(color.hex_code)}
                  className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy HEX Code"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Badge (Clickable to toggle) */}
          <button
            type="button"
            onClick={() => onToggleStatus(color)}
            className="cursor-pointer transition-transform active:scale-95 shrink-0"
            title="Click to toggle status"
          >
            <AdminStatusBadge
              status={color.status}
            />
          </button>
        </div>

        {/* Usage & Telemetry Information */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-cyan-400" />
            Catalog Usage
          </span>
          <span
            className={`font-mono px-2 py-0.5 rounded font-semibold text-[10.5px] ${
              variantsCount > 0
                ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                : "bg-white/5 text-slate-500 border border-white/5"
            }`}
          >
            {variantsCount} {variantsCount === 1 ? "variant" : "variants"}
          </span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(color)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-colors cursor-pointer"
          title="Edit Swatch"
        >
          <Edit className="w-3 h-3 text-[#A78BFA]" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(color)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/20 transition-colors cursor-pointer"
          title="Delete Swatch"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
