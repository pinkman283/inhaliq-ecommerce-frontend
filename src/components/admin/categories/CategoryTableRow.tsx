"use client";

import React from "react";
import { Folder, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Category } from "@/types";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";

interface CategoryTableRowProps {
  category: Category;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  path: Category[];
  level: number;
  isRoot: boolean;
  onAddSubcategory: (parent: Category) => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTableRow({
  category,
  isSelected,
  onToggleSelect,
  path,
  level,
  isRoot,
  onAddSubcategory,
  onView,
  onEdit,
  onDelete,
}: CategoryTableRowProps) {
  return (
    <tr
      className={`hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] ${
        isSelected ? "bg-amber-500/5" : ""
      }`}
    >
      {/* Checkbox */}
      <td className="py-3 pl-6 pr-3 text-left" onClick={(e) => e.stopPropagation()}>
        <AdminCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect(category.id)}
          title={`Select category ${category.name}`}
        />
      </td>

      {/* Category Info with Hierarchy Indentation */}
      <td className="p-3 text-left">
        <div
          className="flex items-center gap-2.5 min-w-0"
          style={{ paddingLeft: `${Math.max(0, (level - 1) * 20)}px` }}
        >
          {category.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={category.image}
              alt={category.image_alt || category.name}
              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Folder className="w-4 h-4 text-slate-500" />
            </div>
          )}

          <div className="min-w-0 max-w-[200px] sm:max-w-[280px]">
            <span
              className="font-bold text-white block truncate hover:text-amber-400 transition-colors"
              title={category.name}
            >
              {category.name}
            </span>
            {!isRoot ? (
              <span className="text-[10px] text-amber-400/90 font-medium truncate block">
                ↳ {path.slice(0, -1).map((p) => p.name).join(" › ")}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400/90 font-bold block">
                📁 Root Department
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Level Pill */}
      <td className="p-3 text-left whitespace-nowrap">
        {isRoot ? (
          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Root (L1)
          </span>
        ) : level === 2 ? (
          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Sub (L2)
          </span>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Deep (L{level})
          </span>
        )}
      </td>

      {/* Slug */}
      <td className="p-3 text-left font-mono text-cyan-400 text-[11px] whitespace-nowrap">
        {category.slug}
      </td>

      {/* Badge */}
      <td className="p-3 text-left whitespace-nowrap">
        {category.badge ? (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {category.badge}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Products Count */}
      <td className="p-3 text-left whitespace-nowrap">
        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white">
          {category.products_count ?? 0} items
        </span>
      </td>

      {/* Display Order */}
      <td className="p-3 text-left font-mono text-slate-400 whitespace-nowrap">
        {category.display_order ?? 0}
      </td>

      {/* Actions */}
      <td className="p-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1 flex-wrap mx-auto">
          <button
            type="button"
            onClick={() => onAddSubcategory(category)}
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
            title={`Add Subcategory under ${category.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onView(category)}
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
            title="View Category Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
            title="Edit Category"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
