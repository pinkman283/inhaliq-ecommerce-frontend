"use client";

import React from "react";
import { Trash2, Layers } from "lucide-react";
import { ProductFormVariant } from "@/types";

interface VariantMatrixTableProps {
  variants: ProductFormVariant[];
  onUpdateVariant: (index: number, updated: Partial<ProductFormVariant>) => void;
  onRemoveVariant: (index: number) => void;
}

export function VariantMatrixTable({
  variants,
  onUpdateVariant,
  onRemoveVariant,
}: VariantMatrixTableProps) {
  if (variants.length === 0) {
    return (
      <div className="py-12 px-4 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center space-y-2.5 bg-white/[0.01]">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
        <h4 className="text-xs font-semibold text-white">No Variants Configured</h4>
        <p className="text-[11px] text-slate-400 max-w-sm">
          Select colors and sizes above and click &quot;Generate Matrix&quot; or use the Manual Option form below.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3.5 font-medium">Color</th>
              <th className="py-3 px-3 font-medium">Size / Spec</th>
              <th className="py-3 px-3 font-medium">Variant Name</th>
              <th className="py-3 px-3 font-medium w-24">Stock</th>
              <th className="py-3 px-3 font-medium w-28">Price Mod (+/-)</th>
              <th className="py-3 px-3 font-medium w-24">Cost Price</th>
              <th className="py-3 px-3 font-medium w-28">Barcode</th>
              <th className="py-3 px-3 font-medium">SKU / ID</th>
              <th className="py-3 px-3 font-medium text-right w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {variants.map((v, idx) => {
              const isGeneric = !v.color_name && !v.size;
              return (
                <tr
                  key={v.id ? `id-${v.id}` : `idx-${idx}-${v.name}`}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* 1. Color */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {v.color_name ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: v.color_hex || "#333333" }}
                        />
                        <span className="text-white font-medium text-[11px]">{v.color_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">—</span>
                    )}
                  </td>

                  {/* 2. Size / Spec */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {v.size ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300 font-mono text-[11px]">
                        {v.size}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">—</span>
                    )}
                  </td>

                  {/* 3. Variant Name */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => onUpdateVariant(idx, { name: e.target.value })}
                      placeholder="Variant display name"
                      className="w-full min-w-[130px] bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-md px-2 py-1 text-xs text-white outline-none transition"
                    />
                    {isGeneric && (
                      <span className="inline-block mt-0.5 text-[9px] text-slate-500 uppercase tracking-wider">
                        Generic Option
                      </span>
                    )}
                  </td>

                  {/* 4. Stock */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={v.stock_quantity}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || "0", 10));
                        onUpdateVariant(idx, { stock_quantity: val });
                      }}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white text-center outline-none transition font-mono font-medium"
                    />
                  </td>

                  {/* 5. Price Modifier */}
                  <td className="py-2.5 px-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={v.price_modifier ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value || "0") || 0;
                          onUpdateVariant(idx, { price_modifier: val });
                        }}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-emerald-400/50 rounded-md px-2 py-1 text-xs text-white text-right outline-none transition font-mono"
                      />
                    </div>
                  </td>

                  {/* 6. Cost Price */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="—"
                      value={v.cost_price ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                        onUpdateVariant(idx, { cost_price: isNaN(val as number) ? null : val });
                      }}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-md px-2 py-1 text-xs text-white text-right outline-none transition font-mono"
                    />
                  </td>

                  {/* 7. Barcode */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="UPC / EAN"
                      value={v.barcode ?? ""}
                      onChange={(e) => onUpdateVariant(idx, { barcode: e.target.value.trim() || null })}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-md px-2 py-1 text-[11px] text-white outline-none transition font-mono"
                    />
                  </td>

                  {/* 8. SKU / ID */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {v.id && (
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold"
                          title={`Persisted Database Variant ID: ${v.id}`}
                        >
                          #{v.id}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">
                        {v.sku || (
                          <span className="text-slate-600 italic">Auto-generated</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* 9. Action */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveVariant(idx)}
                      title="Remove combination"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
