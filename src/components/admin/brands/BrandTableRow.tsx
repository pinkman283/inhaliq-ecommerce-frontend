/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Eye, Edit, Trash2, Globe, Star, Layers } from "lucide-react";
import { Brand } from "@/types";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";

interface BrandTableRowProps {
  brand: Brand;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onInspect: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export function BrandTableRow({
  brand,
  isSelected,
  onToggleSelect,
  onInspect,
  onEdit,
  onDelete,
}: BrandTableRowProps) {
  const websiteUrl = brand.website
    ? brand.website.startsWith("http")
      ? brand.website
      : `https://${brand.website}`
    : null;

  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? "bg-cyan-500/10 border-l-2 border-cyan-500"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
        <AdminCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect(brand.id)}
          title={`Select ${brand.name}`}
        />
      </td>

      <td className="p-3.5 font-bold text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 shrink-0 font-black text-xs overflow-hidden">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span>{brand.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="truncate block text-white font-bold">{brand.name}</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              slug: {brand.slug}
            </span>
          </div>
        </div>
      </td>

      <td className="p-3.5">
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px] truncate max-w-[180px]"
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span className="truncate">{brand.website?.replace(/^https?:\/\//, "")}</span>
          </a>
        ) : (
          <span className="text-slate-500 text-[11px] italic">Not configured</span>
        )}
      </td>

      <td className="p-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
              (brand.products_count ?? 0) > 0
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {brand.products_count ?? 0} products
          </span>

          {(brand.categories_count ?? 0) > 0 && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1"
              title={`${brand.categories_count} linked navigation categories`}
            >
              <Layers className="w-2.5 h-2.5 text-slate-400" />
              {brand.categories_count}
            </span>
          )}
        </div>
      </td>

      <td className="p-3.5 whitespace-nowrap">
        {brand.is_featured ? (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 flex items-center gap-1 w-fit">
            <Star className="w-2.5 h-2.5 fill-amber-300" />
            Featured
          </span>
        ) : (
          <span className="text-slate-500 text-[10px]">Standard</span>
        )}
      </td>

      <td className="p-3.5 font-mono text-slate-400 text-xs">
        {brand.display_order ?? 0}
      </td>

      <td className="p-3.5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onInspect(brand)}
            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all cursor-pointer shadow-sm"
            title="Inspect Brand"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(brand)}
            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] hover:scale-105 transition-all cursor-pointer shadow-sm"
            title="Edit Brand"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(brand)}
            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all cursor-pointer shadow-sm"
            title="Delete Brand"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
