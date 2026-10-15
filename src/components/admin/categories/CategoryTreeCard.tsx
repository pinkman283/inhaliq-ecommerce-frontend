"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Category } from "@/types";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";

interface CategoryTreeCardProps {
  root: Category;
  items: Category[];
  isCollapsed: boolean;
  onToggleCollapse: (rootId: number) => void;
  selectedIds: number[];
  onToggleSelectRow: (id: number) => void;
  getCategoryLevel: (cat: Category) => number;
  getCategoryPath: (cat: Category) => Category[];
  onAddSubcategory: (parent: Category) => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTreeCard({
  root,
  items,
  isCollapsed,
  onToggleCollapse,
  selectedIds,
  onToggleSelectRow,
  getCategoryLevel,
  getCategoryPath,
  onAddSubcategory,
  onView,
  onEdit,
  onDelete,
}: CategoryTreeCardProps) {
  return (
    <div className="rounded-md bg-[#0e121e] border border-white/10 overflow-hidden shadow-lg">
      {/* Root Category Header Card */}
      <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onToggleCollapse(root.id)}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            title={isCollapsed ? "Expand Branch" : "Collapse Branch"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {root.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={root.image}
              alt={root.image_alt || root.name}
              className="w-10 h-10 rounded-md object-cover bg-slate-900 border border-white/10 shrink-0"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-black text-sm truncate">{root.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Root Branch
              </span>
              {root.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {root.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
              <span className="font-mono text-cyan-400">{root.slug}</span>
              <span>·</span>
              <span>{items.length} subcategories</span>
              <span>·</span>
              <span>{root.products_count ?? 0} direct products</span>
            </div>
          </div>
        </div>

        {/* Actions for Root Category */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAddSubcategory(root)}
            className="h-8 px-2.5 rounded-md flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition shadow-sm cursor-pointer"
            title={`Add subcategory under ${root.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Subcategory</span>
          </button>
          <button
            type="button"
            onClick={() => onView(root)}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition shadow-sm cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(root)}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] transition shadow-sm cursor-pointer"
            title="Edit Root Category"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(root)}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition shadow-sm cursor-pointer"
            title="Delete Root Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subcategories List Under This Root */}
      {!isCollapsed && (
        <div className="p-3 bg-black/20 space-y-1.5">
          {items.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">
              No subcategories under this root department yet.
            </p>
          ) : (
            items.map((sub) => {
              const level = getCategoryLevel(sub);
              const path = getCategoryPath(sub);
              const isSelected = selectedIds.includes(sub.id);

              return (
                <div
                  key={sub.id}
                  className={`p-2.5 rounded-md border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[#211B32] border-[#A78BFA]/40"
                      : "bg-[#0b0e17] border-white/5 hover:border-white/10"
                  }`}
                  style={{ marginLeft: `${Math.max(0, level - 2) * 20}px` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AdminCheckbox
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(sub.id)}
                      title={`Select ${sub.name}`}
                    />

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <CornerDownRight className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                    </div>

                    {sub.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={sub.image}
                        alt={sub.image_alt || sub.name}
                        className="w-7 h-7 rounded-md object-cover bg-slate-900 border border-white/10 shrink-0"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs truncate">{sub.name}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-white/5 border border-white/10 text-slate-400">
                          L{level}
                        </span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        <span className="text-[#A78BFA]/80">
                          {path.slice(0, -1).map((p) => p.name).join(" › ")}
                        </span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span className="font-mono text-cyan-400">{sub.slug}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>{sub.products_count ?? 0} products</span>
                      </p>
                    </div>
                  </div>

                  {/* Row Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAddSubcategory(sub)}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition cursor-pointer"
                      title={`Add nested subcategory under ${sub.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onView(sub)}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(sub)}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] transition cursor-pointer"
                      title="Edit Subcategory"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(sub)}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                      title="Delete Subcategory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
