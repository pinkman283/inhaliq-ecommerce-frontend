"use client";

import React from "react";
import { Loader2, FolderTree } from "lucide-react";
import { Category } from "@/types";
import { CategoryTreeCard } from "./CategoryTreeCard";

interface TreeGroup {
  root: Category;
  items: Category[];
}

interface CategoriesTreeViewProps {
  treeData: TreeGroup[];
  loading: boolean;
  collapsedTreeIds: number[];
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

export function CategoriesTreeView({
  treeData,
  loading,
  collapsedTreeIds,
  onToggleCollapse,
  selectedIds,
  onToggleSelectRow,
  getCategoryLevel,
  getCategoryPath,
  onAddSubcategory,
  onView,
  onEdit,
  onDelete,
}: CategoriesTreeViewProps) {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-[#0e121e] rounded-2xl border border-white/10">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
        <p className="text-xs font-medium">Loading category hierarchy...</p>
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-[#0e121e] rounded-2xl border border-white/10 flex flex-col items-center justify-center">
        <FolderTree className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300">No categories found</p>
        <p className="text-xs text-slate-500 mt-1">
          No categories match the active filter criteria. Try adjusting or resetting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {treeData.map((group) => (
        <CategoryTreeCard
          key={group.root.id}
          root={group.root}
          items={group.items}
          isCollapsed={collapsedTreeIds.includes(group.root.id)}
          onToggleCollapse={onToggleCollapse}
          selectedIds={selectedIds}
          onToggleSelectRow={onToggleSelectRow}
          getCategoryLevel={getCategoryLevel}
          getCategoryPath={getCategoryPath}
          onAddSubcategory={onAddSubcategory}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
