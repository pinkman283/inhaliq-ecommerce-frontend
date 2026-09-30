"use client";

import React from "react";
import { FolderTree } from "lucide-react";
import { Category } from "@/types";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { CategoryTableRow } from "./CategoryTableRow";

interface CategoriesTableProps {
  categories: Category[];
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: number) => void;
  getCategoryPath: (cat: Category) => Category[];
  getCategoryLevel: (cat: Category) => number;
  onAddSubcategory: (parent: Category) => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  loading: boolean;
}

export function CategoriesTable({
  categories,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  getCategoryPath,
  getCategoryLevel,
  onAddSubcategory,
  onView,
  onEdit,
  onDelete,
  loading,
}: CategoriesTableProps) {
  const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;

  return (
    <ScrollableTableCard>
      <table className="w-full text-left border-collapse text-xs">
        <thead className="border-b border-white/[0.08] text-slate-400 bg-white/[0.01]">
          <tr>
            <th className="py-3 pl-6 pr-3 w-10 text-left">
              <AdminCheckbox
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                title="Select all categories"
              />
            </th>
            <th className="p-3 text-left font-semibold">Category Hierarchy</th>
            <th className="p-3 text-left font-semibold">Level</th>
            <th className="p-3 text-left font-semibold">Slug</th>
            <th className="p-3 text-left font-semibold">Badge</th>
            <th className="p-3 text-left font-semibold">Catalog Items</th>
            <th className="p-3 text-left font-semibold">Order</th>
            <th className="p-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {loading ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500">
                Loading categories...
              </td>
            </tr>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500">
                <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No categories found matching your filter criteria.</p>
              </td>
            </tr>
          ) : (
            categories.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              const path = getCategoryPath(c);
              const level = getCategoryLevel(c);
              const isRoot = !c.parent_id;

              return (
                <CategoryTableRow
                  key={c.id}
                  category={c}
                  isSelected={isSelected}
                  onToggleSelect={onToggleSelectRow}
                  path={path}
                  level={level}
                  isRoot={isRoot}
                  onAddSubcategory={onAddSubcategory}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })
          )}
        </tbody>
      </table>
    </ScrollableTableCard>
  );
}
