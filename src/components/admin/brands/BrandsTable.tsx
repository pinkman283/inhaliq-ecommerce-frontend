"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Brand } from "@/types";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BrandTableRow } from "./BrandTableRow";

interface BrandsTableProps {
  brands: Brand[];
  loading: boolean;
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: number) => void;
  onInspect: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export function BrandsTable({
  brands,
  loading,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onInspect,
  onEdit,
  onDelete,
}: BrandsTableProps) {
  const isAllSelected = brands.length > 0 && selectedIds.length === brands.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < brands.length;

  return (
    <ScrollableTableCard>
      <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
        <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
          <tr>
            <th className="p-3.5 w-10 text-center">
              <AdminCheckbox
                checked={isAllSelected}
                indeterminate={isPartiallySelected}
                onChange={onToggleSelectAll}
                title="Select all brands"
              />
            </th>
            <th className="p-3.5">Brand / Manufacturer</th>
            <th className="p-3.5">Website</th>
            <th className="p-3.5">Hardware Products</th>
            <th className="p-3.5">Tier</th>
            <th className="p-3.5">Order</th>
            <th className="p-3.5 text-center min-w-[140px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading manufacturer brands...</span>
                </div>
              </td>
            </tr>
          ) : brands.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                No brands match the current filter.
              </td>
            </tr>
          ) : (
            brands.map((b) => (
              <BrandTableRow
                key={b.id}
                brand={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={onToggleSelectRow}
                onInspect={onInspect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </ScrollableTableCard>
  );
}
