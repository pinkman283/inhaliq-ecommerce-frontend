import React from "react";
import { Loader2 } from "lucide-react";
import { Product } from "@/types";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminEmptyState } from "@/components/admin/ui";
import { ProductTableRow } from "./ProductTableRow";
import { TableSkeletonRows } from "@/components/admin/ui/TableSkeletonRows";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: number) => void;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onOpenMedia?: (product: Product) => void;
  onResetFilters: () => void;
}

export function ProductsTable({
  products,
  loading,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenMedia,
  onResetFilters,
}: ProductsTableProps) {
  const isAllSelected = products.length > 0 && selectedIds.length === products.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < products.length;

  return (
    <ScrollableTableCard className="bg-[#0f121b] border-white/[0.08]">
      <table className="w-full text-left text-xs text-slate-300 min-w-[960px]">
        <thead className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
          <tr>
            <th className="py-3.5 pl-6 pr-3 w-14 text-left">
              <AdminCheckbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={onToggleSelectAll}
                title="Select all products"
              />
            </th>
            <th className="p-3 text-left w-[30%] min-w-[220px]">Product</th>
            <th className="p-3 text-left w-[18%] min-w-[150px]">Category</th>
            <th className="p-3 text-left w-[14%] min-w-[110px]">Price</th>
            <th className="p-3 text-left w-[12%] min-w-[100px]">Stock</th>
            <th className="p-3 text-left w-[12%] min-w-[110px]">Flags</th>
            <th className="p-3 text-center min-w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {loading ? (
            <TableSkeletonRows rows={8} colSpan={7} hasCheckbox={true} hasThumbnail={true} />
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-0">
                <AdminEmptyState
                  title="No products found"
                  description="No catalog items matched your current filters. Try resetting search."
                  action={
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  }
                />
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                isSelected={selectedIds.includes(product.id)}
                onToggleSelect={onToggleSelectRow}
                onView={onViewProduct}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onOpenMedia={onOpenMedia}
              />
            ))
          )}
        </tbody>
      </table>
    </ScrollableTableCard>
  );
}
