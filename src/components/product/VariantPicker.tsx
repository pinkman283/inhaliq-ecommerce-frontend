"use client";

import { useMemo } from "react";
import { ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";

interface VariantPickerProps {
  variants?: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant | null) => void;
  selectedColor?: string | null;
  onSelectColor?: (color: string | null) => void;
  selectedSize?: string | null;
  onSelectSize?: (size: string | null) => void;
  availableStock?: number;
  hasError?: boolean;
}

export function VariantPicker({
  variants = [],
  selectedVariant,
  onSelectVariant,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  availableStock = 0,
  hasError = false,
}: VariantPickerProps) {
  // Extract distinct colors from variants
  const distinctColors = useMemo(() => {
    const map = new Map<string, { name: string; hex?: string | null; inStock: boolean; minPriceMod: number }>();
    (variants || []).forEach((v) => {
      const colorKey = v.color_name?.trim();
      if (colorKey) {
        const existing = map.get(colorKey);
        const inStock = v.stock_quantity > 0;
        if (!existing) {
          map.set(colorKey, {
            name: colorKey,
            hex: v.color_hex,
            inStock,
            minPriceMod: Number(v.price_modifier || 0),
          });
        } else if (inStock) {
          existing.inStock = true;
        }
      }
    });
    return Array.from(map.values());
  }, [variants]);

  // Extract distinct sizes from variants
  const distinctSizes = useMemo(() => {
    const map = new Map<string, { size: string; inStock: boolean }>();
    (variants || []).forEach((v) => {
      const sizeKey = v.size?.trim();
      if (sizeKey) {
        const inStock = v.stock_quantity > 0;
        const existing = map.get(sizeKey);
        if (!existing) {
          map.set(sizeKey, { size: sizeKey, inStock });
        } else if (inStock) {
          existing.inStock = true;
        }
      }
    });
    return Array.from(map.values());
  }, [variants]);

  // If no explicit color or size attributes were specified, treat each variant as a distinct option
  const isGenericVariantList = distinctColors.length === 0 && distinctSizes.length === 0;

  // Track active color & size
  const activeColor = selectedColor || selectedVariant?.color_name || (distinctColors[0]?.name ?? null);
  const activeSize = selectedSize || selectedVariant?.size || (distinctSizes[0]?.size ?? null);

  // If product has no variants configured, render nothing
  if (!variants || variants.length === 0) {
    return null;
  }

  // Check availability of a specific size given currently active color
  const getSizeAvailability = (sizeKey: string) => {
    const trimmedSize = sizeKey.trim().toLowerCase();

    // 1. If product is size-only (no colors configured)
    if (distinctColors.length === 0) {
      const v = variants.find((item) => (item.size || "").trim().toLowerCase() === trimmedSize);
      return {
        exists: !!v,
        inStock: !!v && v.stock_quantity > 0,
        variant: v || null,
      };
    }

    // 2. If product has colors, check combination with activeColor
    if (!activeColor) {
      return { exists: false, inStock: false, variant: null };
    }

    const trimmedColor = activeColor.trim().toLowerCase();
    const v = variants.find(
      (item) =>
        (item.color_name || "").trim().toLowerCase() === trimmedColor &&
        (item.size || "").trim().toLowerCase() === trimmedSize
    );

    return {
      exists: !!v,
      inStock: !!v && v.stock_quantity > 0,
      variant: v || null,
    };
  };

  // Select color with auto-selection of valid size
  const handleSelectColor = (colorName: string) => {
    onSelectColor?.(colorName);

    const colorVariants = variants.filter(
      (v) => (v.color_name || "").trim().toLowerCase() === colorName.trim().toLowerCase()
    );

    if (distinctSizes.length > 0) {
      // 1. Check if the currently active size is available and in stock for this new color
      const currentSizeMatch = colorVariants.find(
        (v) =>
          (v.size || "").trim().toLowerCase() === (activeSize || "").trim().toLowerCase() &&
          v.stock_quantity > 0
      );

      if (currentSizeMatch) {
        onSelectVariant(currentSizeMatch);
      } else {
        // 2. Auto-select first in-stock size for this color
        const firstInStock = colorVariants.find((v) => v.stock_quantity > 0);
        if (firstInStock && firstInStock.size) {
          onSelectSize?.(firstInStock.size);
          onSelectVariant(firstInStock);
        } else if (colorVariants.length > 0) {
          // Fall back to first configured size for this color (even if 0 stock) rather than cross-color
          const firstConfigured = colorVariants[0];
          onSelectSize?.(firstConfigured.size || null);
          onSelectVariant(firstConfigured);
        } else {
          onSelectSize?.(null);
          onSelectVariant(null);
        }
      }
    } else {
      // Color-only product
      const matched = colorVariants[0] || null;
      onSelectVariant(matched);
    }
  };

  // Select size
  const handleSelectSize = (sizeValue: string) => {
    onSelectSize?.(sizeValue);

    let matched: ProductVariant | null = null;
    const trimmedSize = sizeValue.trim().toLowerCase();

    if (distinctColors.length > 0 && activeColor) {
      const trimmedColor = activeColor.trim().toLowerCase();
      matched =
        variants.find(
          (v) =>
            (v.color_name || "").trim().toLowerCase() === trimmedColor &&
            (v.size || "").trim().toLowerCase() === trimmedSize
        ) || null;
    } else {
      matched =
        variants.find((v) => (v.size || "").trim().toLowerCase() === trimmedSize) || null;
    }

    if (matched) {
      onSelectVariant(matched);
    }
  };

  // Generic option selection
  const handleSelectGenericVariant = (v: ProductVariant) => {
    onSelectVariant(v);
    if (v.color_name) onSelectColor?.(v.color_name);
    if (v.size) onSelectSize?.(v.size);
  };

  return (
    <div className={`space-y-4 pt-1 ${hasError ? "animate-pulse" : ""}`}>
      {/* 1. SELECT COLOR (Only rendered if product has colors configured) */}
      {distinctColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              SELECT COLOR
            </label>
            {activeColor && (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {activeColor}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {distinctColors.map((color) => {
              const isSelected = activeColor?.toLowerCase() === color.name.toLowerCase();
              const isOutOfStock = !color.inStock;

              return (
                <button
                  key={color.name}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleSelectColor(color.name)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 shadow-xs font-semibold"
                      : isOutOfStock
                      ? "opacity-40 border-dashed border-gray-200 dark:border-white/10 bg-transparent text-slate-400 cursor-not-allowed"
                      : "border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  {color.hex && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/30 shadow-2xs shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  <span>{color.name}</span>
                  {color.minPriceMod > 0 && (
                    <span className="text-[10px] opacity-75">
                      (+{formatPrice(color.minPriceMod)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SELECT SIZE (Only rendered if product has sizes configured) */}
      {distinctSizes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              SELECT SIZE
            </label>
            {availableStock <= 8 && availableStock > 0 && (
              <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Only {availableStock} Stocks Left!
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {distinctSizes.map((s) => {
              const isSelected = activeSize?.toLowerCase() === s.size.toLowerCase();
              const availability = getSizeAvailability(s.size);
              const isDisabled = !availability.exists || !availability.inStock;
              const isLowStock = availableStock <= 8 && isSelected && availability.inStock;

              return (
                <button
                  key={s.size}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectSize(s.size)}
                  title={
                    !availability.exists
                      ? `Option '${s.size}' not available in ${activeColor || "selected color"}`
                      : !availability.inStock
                      ? `Option '${s.size}' is currently out of stock`
                      : undefined
                  }
                  className={`relative min-w-[42px] h-10 px-3.5 rounded-lg border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center ${
                    isSelected && !isDisabled
                      ? "border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 shadow-xs font-bold"
                      : isDisabled
                      ? "opacity-30 border-dashed border-gray-200 dark:border-white/10 bg-transparent text-slate-400 cursor-not-allowed line-through"
                      : "border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.03] font-medium"
                  }`}
                >
                  {s.size}
                  {isLowStock && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b0e17]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. GENERIC OPTIONS (Rendered when variants exist without explicit color/size keys) */}
      {isGenericVariantList && variants.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            SELECT OPTION
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isOutOfStock = v.stock_quantity <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleSelectGenericVariant(v)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 shadow-xs font-semibold"
                      : isOutOfStock
                      ? "opacity-40 border-dashed border-gray-200 dark:border-white/10 bg-transparent text-slate-400 cursor-not-allowed"
                      : "border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  {v.color_hex && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/30 shadow-2xs shrink-0"
                      style={{ backgroundColor: v.color_hex }}
                    />
                  )}
                  <span>{v.name}</span>
                  {v.price_modifier > 0 && (
                    <span className="text-[10px] opacity-75 font-mono">
                      (+{formatPrice(v.price_modifier)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
