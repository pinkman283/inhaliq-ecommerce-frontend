import React from "react";
import { Eye, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";

interface ProductTableRowProps {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onOpenMedia?: (product: Product) => void;
}

export function ProductTableRow({
  product,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onOpenMedia,
}: ProductTableRowProps) {
  const img = product.primary_image?.image_url || product.images?.[0]?.image_url;
  const hasVariants = product.variants && product.variants.length > 0;
  const imageCount = product.images_count ?? product.images?.length ?? 0;

  return (
    <tr
      className={`hover:bg-white/[0.02] transition-colors ${
        isSelected ? "bg-amber-500/5" : ""
      }`}
    >
      {/* Selection Checkbox */}
      <td className="py-3.5 pl-6 pr-3 text-left" onClick={(e) => e.stopPropagation()}>
        <AdminCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          title={`Select ${product.name}`}
        />
      </td>

      {/* Product Information */}
      <td className="p-3 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={img}
                alt={product.name}
                className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-white/10"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMedia?.(product);
                }}
                className="w-9 h-9 rounded-lg bg-rose-500/10 border border-dashed border-rose-500/30 hover:border-amber-400/60 hover:bg-amber-500/10 flex items-center justify-center transition-colors group cursor-pointer"
                title="No media uploaded — Click to add images"
              >
                <ImageIcon className="w-4 h-4 text-rose-400 group-hover:text-amber-400" />
              </button>
            )}
            <span
              className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8.5px] font-mono font-bold leading-none border ${
                imageCount === 0
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : "bg-black/80 text-slate-300 border-white/20"
              }`}
              title={`${imageCount} images`}
            >
              {imageCount}
            </span>
          </div>

          <div className="min-w-0 max-w-[200px] sm:max-w-[240px]">
            <span
              className="font-bold text-white block truncate hover:text-amber-400 transition-colors cursor-pointer"
              title={product.name}
              onClick={() => onEdit(product)}
            >
              {product.name}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
              <span>{product.brandRelation?.name || product.brand || "AETHER"}</span>
              {product.sku && <span>• SKU: {product.sku}</span>}
              {imageCount === 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMedia?.(product);
                  }}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  + Add photo
                </button>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="p-3 text-left whitespace-nowrap">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-medium text-slate-200 whitespace-nowrap"
          title={product.category?.name || "Hardware"}
        >
          {product.category?.name || "Hardware"}
        </span>
      </td>

      {/* Price */}
      <td className="p-3 text-left whitespace-nowrap">
        <div className="font-mono">
          <span className="font-bold text-white block">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-[10px] text-slate-500 line-through block">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </td>

      {/* Stock Quantity */}
      <td className="p-3 text-left whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              product.stock_quantity > 10
                ? "bg-emerald-400"
                : product.stock_quantity > 0
                ? "bg-amber-400"
                : "bg-rose-400"
            }`}
          />
          <span className="font-mono font-bold text-white">{product.stock_quantity}</span>
          {hasVariants && (
            <span className="text-[9.5px] text-cyan-400 font-medium">
              ({product.variants?.length || 0} vars)
            </span>
          )}
        </div>
      </td>

      {/* Flags & Badges */}
      <td className="p-3 text-left whitespace-nowrap">
        <div className="flex items-center gap-1">
          {product.is_featured && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9.5px] font-bold border border-amber-500/20">
              Featured
            </span>
          )}
          {product.is_new_arrival && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[9.5px] font-bold border border-cyan-500/20">
              New
            </span>
          )}
          {product.is_best_seller && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9.5px] font-bold border border-emerald-500/20">
              Best Seller
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="p-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onOpenMedia?.(product)}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Manage media & colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onView(product)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="View product preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Edit product"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
