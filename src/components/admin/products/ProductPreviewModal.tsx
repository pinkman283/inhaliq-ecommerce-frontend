"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ExternalLink,
  Edit,
  Trash2,
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  Tag,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Globe,
  Info,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Product, ProductImage } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";

export interface ProductPreviewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

interface ProductPreviewModalInnerProps {
  product: Product;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

function ProductPreviewModalInner({
  product,
  onClose,
  onEdit,
  onDelete,
}: ProductPreviewModalInnerProps) {
  // Collect distinct product images
  const galleryImages: ProductImage[] = useMemo(() => {
    const list: ProductImage[] = [];
    const seenUrls = new Set<string>();

    if (product.primary_image?.image_url) {
      list.push(product.primary_image);
      seenUrls.add(product.primary_image.image_url);
    }

    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img?.image_url && !seenUrls.has(img.image_url)) {
          list.push(img);
          seenUrls.add(img.image_url);
        }
      });
    }

    return list;
  }, [product]);

  // Selected image override; defaults to primary image or first available
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const activeImageUrl =
    selectedImageUrl ||
    product.primary_image?.image_url ||
    galleryImages[0]?.image_url ||
    product.thumbnail ||
    "";

  // Pricing calculations
  const price = Number(product.price) || 0;
  const compareAtPrice = product.compare_at_price ? Number(product.compare_at_price) : 0;
  const hasDiscount = compareAtPrice > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  // Cost & Profit Margin (Admin-only informational calculation)
  const costPrice =
    product.cost_price !== null && product.cost_price !== undefined
      ? Number(product.cost_price)
      : null;
  const hasCostPrice = costPrice !== null && costPrice > 0;
  const estimatedGrossMargin =
    hasCostPrice && price > 0
      ? (((price - costPrice) / price) * 100).toFixed(1)
      : null;

  // Stock status evaluation
  const stock = product.stock_quantity ?? 0;
  const stockStatus =
    stock > 10
      ? { label: "In Stock / Healthy", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" }
      : stock > 0
      ? { label: "Low Stock Alert", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" }
      : { label: "Out of Stock", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-400" };

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Active image alt text
  const currentImageObj = galleryImages.find((img) => img.image_url === activeImageUrl);
  const activeImageAlt = currentImageObj?.alt_text || product.name;

  return (
    <>
      {/* Screen Reader Accessible Title & Description */}
      <div className="sr-only">
        <SheetTitle>{product.name} - Product Preview</SheetTitle>
        <SheetDescription>
          Admin overview and read-only inspection for product {product.name} (SKU: {product.sku || "N/A"}).
        </SheetDescription>
      </div>

      {/* 1. PREVIEW HEADER */}
      <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0c101d] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
            <Package className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[280px] sm:max-w-[380px]">
                {product.name}
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                #{product.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  product.is_active
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>SKU: <strong className="text-slate-300 font-mono">{product.sku || "N/A"}</strong></span>
              <span>•</span>
              <span>Created {formatDate(product.created_at)}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer shrink-0"
          aria-label="Close preview"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. ACTION BAR */}
      <div className="px-6 py-2.5 bg-[#0e1220] border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0 flex-wrap">
        {/* View on Storefront (External link) */}
        <div>
          {product.slug ? (
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
              title="View product on storefront (opens in new tab)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>View on Storefront</span>
            </a>
          ) : (
            <span className="text-xs text-slate-500 italic">No storefront slug available</span>
          )}
        </div>

        {/* Edit & Delete Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-xs font-semibold transition cursor-pointer"
              title="Edit this product in ProductEditor"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(product);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
              title="Delete this product"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TOP SECTION: Gallery & Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Gallery Column (md: 6 cols) */}
          <div className="md:col-span-6 space-y-3">
            {/* Main Image Container */}
            <div className="relative aspect-square w-full rounded-md overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center group shadow-inner">
              {activeImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeImageUrl}
                  alt={activeImageAlt}
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
                  <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                  <span className="text-xs font-medium">No image available</span>
                </div>
              )}

              {/* Primary Badge on image if active image is primary */}
              {currentImageObj?.is_primary && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#A78BFA] text-[#090B10] text-[10px] font-bold shadow-md">
                  Primary Image
                </span>
              )}
            </div>

            {/* Thumbnails row */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => {
                  const isSelected = activeImageUrl === img.image_url;
                  return (
                    <button
                      key={img.id || `thumb-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageUrl(img.image_url)}
                      className={`relative w-14 h-14 rounded-md overflow-hidden border transition-all shrink-0 cursor-pointer bg-black/40 ${
                        isSelected
                          ? "border-[#A78BFA] ring-2 ring-[#A78BFA]/40 scale-105"
                          : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                      }`}
                      title={img.alt_text || `View image ${idx + 1}`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={img.alt_text || product.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Highlights & Status Flags (md: 6 cols) */}
          <div className="md:col-span-6 space-y-4">
            {/* Product Badges / Status Chips */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Merchandising & Badges</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    product.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? "bg-emerald-400" : "bg-rose-400"}`} />
                  {product.is_active ? "Catalog Active" : "Draft / Inactive"}
                </span>

                {product.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 text-xs font-semibold">
                    ★ Featured Product
                  </span>
                )}
                {product.is_new_arrival && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                    ✦ New Arrival
                  </span>
                )}
                {product.is_best_seller && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    🔥 Best Seller
                  </span>
                )}
                {!product.is_featured && !product.is_new_arrival && !product.is_best_seller && (
                  <span className="text-xs text-slate-500 italic">No promotional flags applied</span>
                )}
              </div>
            </div>

            {/* Taxonomy / Relationships */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Category & Brand</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="text-white font-medium block truncate mt-0.5">
                    {product.category?.name || "Uncategorized"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subcategory</span>
                  <span className="text-white font-medium block truncate mt-0.5">
                    {product.subcategory?.name || "None"}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand / Manufacturer</span>
                  <span className="text-white font-medium block truncate mt-0.5">
                    {product.brandRelation?.name || product.brand || "AETHER Studio"}
                  </span>
                </div>
              </div>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {product.short_description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PRICING & INVENTORY TELEMETRY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Selling & Compare-at Price */}
          <div className="p-4 rounded-md bg-[#0e1322] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Selling Price</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-2xl font-bold text-emerald-400">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="font-mono text-xs text-slate-500 line-through">
                  {formatPrice(compareAtPrice)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {discountPercent}% OFF List Price
              </div>
            )}
          </div>

          {/* Inventory Stock & Status */}
          <div className="p-4 rounded-md bg-[#0e1322] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Inventory Stock</span>
              <Package className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-white">
                {stock}
              </span>
              <span className="text-xs text-slate-400">units available</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold border ${stockStatus.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`} />
              <span>{stockStatus.label}</span>
            </div>
          </div>

          {/* Admin Cost & Profit Margin (Admin Internal Only) */}
          <div className="p-4 rounded-md bg-[#0e1322] border border-white/[0.08] space-y-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1 text-amber-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Cost Price (Internal)</span>
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-[#A78BFA]" />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="font-mono text-lg font-bold text-white">
                  {hasCostPrice ? formatPrice(costPrice) : "—"}
                </span>
                <span className="text-[10px] text-slate-400 block">Unit Cost</span>
              </div>

              {estimatedGrossMargin !== null && (
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-cyan-400">
                    {estimatedGrossMargin}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Est. Gross Margin</span>
                </div>
              )}
            </div>
            <p className="text-[9.5px] text-slate-500 leading-tight">
              {hasCostPrice
                ? "Admin-only telemetry. Not visible to storefront customers."
                : "Cost price not configured for unit margin telemetry."}
            </p>
          </div>
        </div>

        {/* READ-ONLY VARIANTS INSPECTION */}
        <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Product Variants
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </span>
          </div>

          {!hasVariants ? (
            <div className="p-4 rounded-md bg-white/[0.01] border border-white/[0.06] text-center text-xs text-slate-400">
              No variants configured. Product is sold as a single standalone item.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1220] border-b border-white/[0.08] text-slate-400 text-[10.5px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Variant Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3">Price Modifier</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {variants.map((v) => {
                    const modifier = Number(v.price_modifier) || 0;
                    return (
                      <tr key={v.id || v.name} className="hover:bg-white/[0.02] transition">
                        <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                          {v.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {v.sku || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {v.size || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {v.color_name || v.color_hex ? (
                            <div className="flex items-center gap-1.5">
                              {v.color_hex && (
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-sm"
                                  style={{ backgroundColor: v.color_hex }}
                                />
                              )}
                              <span>{v.color_name || v.color_hex}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          {modifier > 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              +{formatPrice(modifier)}
                            </span>
                          ) : modifier < 0 ? (
                            <span className="text-rose-400 font-semibold">
                              -{formatPrice(Math.abs(modifier))}
                            </span>
                          ) : (
                            <span className="text-slate-400">+৳0.00</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              v.stock_quantity > 0
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {v.stock_quantity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {v.barcode || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FULL PRODUCT DESCRIPTION */}
        <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Product Description
          </h3>
          {product.description ? (
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-white/[0.01] border border-white/[0.04] rounded-md p-4 max-h-60 overflow-y-auto font-sans">
              {product.description}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No description provided for this product.</p>
          )}
        </div>

        {/* SEO & METADATA */}
        <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Search Engine Optimization (SEO)
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-md bg-[#090d18] border border-white/[0.04]">
              <span className="text-slate-400 font-semibold text-[11px]">URL Slug:</span>
              <span className="font-mono text-cyan-400 truncate max-w-[400px]">
                /products/{product.slug}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-md bg-[#090d18] border border-white/[0.04]">
              <span className="text-slate-400 font-semibold text-[11px]">Meta Title:</span>
              <span className="text-slate-200 truncate max-w-[400px]">
                {product.meta_title || product.name || "Default (Inherits Product Name)"}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-[#090d18] border border-white/[0.04] space-y-1">
              <span className="text-slate-400 font-semibold text-[11px] block">Meta Description:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {product.meta_description || "No custom meta description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PREVIEW FOOTER */}
      <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0c101d] flex items-center justify-between shrink-0 text-xs">
        <span className="text-slate-500">
          Admin Product Preview • ID #{product.id}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-medium transition cursor-pointer"
        >
          Close Preview
        </button>
      </div>
    </>
  );
}

export function ProductPreviewModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductPreviewModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[680px] md:w-[760px] lg:w-[840px] sm:!max-w-[840px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col h-full shadow-2xl text-slate-100 overflow-hidden"
      >
        {open && product ? (
          <ProductPreviewModalInner
            key={`preview-${product.id}`}
            product={product}
            onClose={() => onOpenChange(false)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <div className="sr-only">
            <SheetTitle>Product Preview</SheetTitle>
            <SheetDescription>No product selected.</SheetDescription>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
