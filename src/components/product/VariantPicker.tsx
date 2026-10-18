"use client";

import React, { useMemo } from "react";
import { ProductVariant, ProductOption } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  resolveMatchingVariant,
  isOptionValueAvailable,
  getVariantHexColor,
  getVariantEffectivePrice,
} from "@/lib/storefrontVariants";
import { inferOptionsFromLegacyVariants } from "@/components/admin/products/variants/VariantCombinationUtils";

interface VariantPickerProps {
  options?: ProductOption[] | null;
  variants?: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  selectedOptions?: Record<string, string>;
  onSelectOption?: (groupName: string, value: string) => void;
  onSelectVariant: (variant: ProductVariant | null) => void;

  // Backward-compatible props for legacy components
  selectedColor?: string | null;
  onSelectColor?: (color: string | null) => void;
  selectedSize?: string | null;
  onSelectSize?: (size: string | null) => void;

  basePrice?: number;
  availableStock?: number;
  hasError?: boolean;
}

export function VariantPicker({
  options,
  variants = [],
  selectedVariant,
  selectedOptions = {},
  onSelectOption,
  onSelectVariant,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  basePrice = 0,
  availableStock = 0,
  hasError = false,
}: VariantPickerProps) {
  // If product has no variants configured, render nothing
  if (!variants || variants.length === 0) {
    return null;
  }

  // 1. Resolve active option groups: from declared options or infer from variants
  const activeOptionGroups = useMemo<ProductOption[]>(() => {
    if (options && Array.isArray(options) && options.length > 0) {
      return options.filter((o) => o.name && o.name.trim() && Array.isArray(o.values) && o.values.length > 0);
    }
    return inferOptionsFromLegacyVariants(variants);
  }, [options, variants]);

  // If no option groups can be identified, treat as generic single-selection list
  const isGenericList = activeOptionGroups.length === 0;

  // Build unified current selection dictionary combining selectedOptions with legacy selectedColor/Size
  const currentSelection = useMemo<Record<string, string>>(() => {
    const sel: Record<string, string> = { ...selectedOptions };

    if (selectedColor && !sel["Color"] && !sel["color"]) {
      sel["Color"] = selectedColor;
    }
    if (selectedSize && !sel["Size"] && !sel["size"]) {
      sel["Size"] = selectedSize;
    }

    // If selectedVariant is present, backfill any missing keys from its attributes or legacy fields
    if (selectedVariant) {
      if (selectedVariant.attributes) {
        for (const [k, v] of Object.entries(selectedVariant.attributes)) {
          if (!sel[k] && v) sel[k] = v;
        }
      }
      if (selectedVariant.color_name && !sel["Color"] && !sel["color"]) {
        sel["Color"] = selectedVariant.color_name;
      }
      if (selectedVariant.size && !sel["Size"] && !sel["size"]) {
        sel["Size"] = selectedVariant.size;
      }
    }

    return sel;
  }, [selectedOptions, selectedColor, selectedSize, selectedVariant]);

  // Handler for option value selection
  const handleSelectOptionValue = (groupName: string, value: string) => {
    const nextSelection = {
      ...currentSelection,
      [groupName]: value,
    };

    // Notify parent of individual group update
    onSelectOption?.(groupName, value);

    // Call legacy callbacks if applicable
    const lowerGroup = groupName.trim().toLowerCase();
    if (lowerGroup === "color" || lowerGroup === "colour") {
      onSelectColor?.(value);
    } else if (lowerGroup === "size") {
      onSelectSize?.(value);
    }

    // Deterministically resolve matching variant with full selection
    const matched = resolveMatchingVariant(variants, nextSelection, activeOptionGroups);
    onSelectVariant(matched);
  };

  // Generic option selection handler
  const handleSelectGenericVariant = (v: ProductVariant) => {
    onSelectVariant(v);
    if (v.color_name) onSelectColor?.(v.color_name);
    if (v.size) onSelectSize?.(v.size);
  };

  // Render Generic Variant List if no structured option groups exist
  if (isGenericList) {
    return (
      <div className={`space-y-3 pt-1 ${hasError ? "animate-pulse" : ""}`}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            SELECT OPTION
          </label>
          {hasError && !selectedVariant && (
            <span className="text-[11px] font-bold text-rose-500">
              Please choose an option
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {variants.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            const isOutOfStock = v.stock_quantity <= 0;
            const effective = getVariantEffectivePrice({ price: basePrice }, v);
            const priceDiff = basePrice > 0 ? effective - basePrice : 0;

            return (
              <button
                key={v.id}
                type="button"
                disabled={isOutOfStock || v.is_active === false}
                onClick={() => handleSelectGenericVariant(v)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border-2 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-500/10 shadow-xs font-semibold"
                    : isOutOfStock || v.is_active === false
                    ? "opacity-40 border-dashed border-gray-200 dark:border-white/10 bg-transparent text-slate-400 cursor-not-allowed line-through"
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
                {priceDiff !== 0 && (
                  <span className="text-[10px] opacity-75 font-mono">
                    ({priceDiff > 0 ? `+${formatPrice(priceDiff)}` : `-${formatPrice(Math.abs(priceDiff))}`})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Dynamic Option Selectors (Arbitrary Option Groups)
  return (
    <div className={`space-y-4 pt-1 ${hasError ? "animate-pulse" : ""}`}>
      {activeOptionGroups.map((group) => {
        const groupName = group.name.trim();
        const lowerName = groupName.toLowerCase();
        const isColorGroup = lowerName === "color" || lowerName === "colour";

        // Find active selection for this group case-insensitively
        const activeKey = Object.keys(currentSelection).find(
          (k) => k.trim().toLowerCase() === lowerName
        );
        const selectedValue = activeKey ? currentSelection[activeKey] : null;
        const isGroupMissing = hasError && !selectedValue;

        return (
          <div key={groupName} className="space-y-2">
            {/* Group Header: Label & Selected Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  SELECT {groupName}
                </label>
                {selectedValue && (
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    — {selectedValue}
                  </span>
                )}
              </div>

              {/* Low stock warning for resolved variant */}
              {selectedVariant && availableStock > 0 && availableStock <= 8 && (
                <span className="text-[10.5px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Only {availableStock} Left!
                </span>
              )}

              {isGroupMissing && (
                <span className="text-[10.5px] font-bold text-rose-500">
                  Required
                </span>
              )}
            </div>

            {/* Option Values Grid */}
            <div className="flex flex-wrap gap-2 items-center">
              {group.values.map((value) => {
                const isSelected = selectedValue?.trim().toLowerCase() === value.trim().toLowerCase();
                const availability = isOptionValueAvailable(variants, currentSelection, groupName, value);
                const isDisabled = !availability.available || !availability.inStock;
                const hex = isColorGroup ? getVariantHexColor(variants, value) : null;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectOptionValue(groupName, value)}
                    title={
                      !availability.available
                        ? `Combination not available with your current selection`
                        : !availability.inStock
                        ? `'${value}' is currently out of stock`
                        : undefined
                    }
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-all cursor-pointer select-none ${
                      isSelected && !isDisabled
                        ? "border-2 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-500/10 shadow-xs font-bold"
                        : isDisabled
                        ? "opacity-35 border-dashed border-gray-200 dark:border-white/10 bg-transparent text-slate-400 cursor-not-allowed line-through"
                        : isGroupMissing
                        ? "border-rose-400/60 text-slate-700 dark:text-slate-300 hover:border-rose-400 bg-white dark:bg-white/[0.03] font-medium"
                        : "border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.03] font-medium"
                    }`}
                  >
                    {/* Visual Color Circle for Color Groups */}
                    {isColorGroup && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/30 shadow-2xs shrink-0"
                        style={{ backgroundColor: hex || "#64748b" }}
                      />
                    )}

                    <span>{value}</span>

                    {/* Stock indicator badge if low stock */}
                    {isSelected && availableStock > 0 && availableStock <= 8 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
