"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Zap,
  Check,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  Layers,
  Star,
  Loader2,
  ShieldCheck,
  CopyPlus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Product, ProductVariant, ProductOption } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  getVariantEffectivePrice,
  resolveMatchingVariant,
} from "@/lib/storefrontVariants";
import { VariantPicker } from "./VariantPicker";
import { useCartStore, getAvailableStock } from "@/store/useCartStore";
import { useThemeStore } from "@/store/useThemeStore";
import { inferOptionsFromLegacyVariants } from "@/components/admin/products/variants/VariantCombinationUtils";
import { toast } from "sonner";

export interface ProductVariantDrawerProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  initialMode?: "add_to_cart" | "buy_now";
}

export function ProductVariantDrawer({
  product,
  isOpen,
  onClose,
  triggerRef,
  initialMode = "add_to_cart",
}: ProductVariantDrawerProps) {
  const router = useRouter();
  const { addItem, addMultipleItems, closeCart } = useCartStore();
  const { theme } = useThemeStore();

  // Mode state: Single-variant (default) vs. Multi-variant
  const [isMultiVariantMode, setIsMultiVariantMode] = useState(false);

  // Single-variant selection state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [hasError, setHasError] = useState(false);

  // Multi-variant quantities map: { [variantId]: quantity }
  const [variantQuantities, setVariantQuantities] = useState<Record<number, number>>({});

  // Submitting and animation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Derive active option groups for this product
  const activeOptionGroups = useMemo<ProductOption[]>(() => {
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      return product.options.filter(
        (o) => o.name && o.name.trim() && Array.isArray(o.values) && o.values.length > 0
      );
    }
    return inferOptionsFromLegacyVariants(product.variants || []);
  }, [product.options, product.variants]);

  // Derive all active purchasable variants for this product
  const activeVariants = useMemo<ProductVariant[]>(() => {
    return (product.variants || []).filter((v) => v.is_active !== false);
  }, [product.variants]);

  const isSingleAttribute = activeOptionGroups.length <= 1;

  // Check if selection is complete across all declared option groups (Single Mode)
  const isSelectionComplete = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return true;
    if (activeOptionGroups.length === 0) {
      // Single/generic variant list - requires a selected variant
      return selectedVariant !== null;
    }
    for (const group of activeOptionGroups) {
      const gName = group.name.trim().toLowerCase();
      const userChoice = Object.entries(selectedOptions).find(
        ([k, v]) => k.trim().toLowerCase() === gName && Boolean(v && v.trim())
      );
      if (!userChoice) return false;
    }
    return selectedVariant !== null;
  }, [product.variants, activeOptionGroups, selectedOptions, selectedVariant]);

  // Multi-variant summary calculation
  const multiSelectionSummary = useMemo(() => {
    let totalUnits = 0;
    let totalPrice = 0;
    const selectedList: Array<{
      variant: ProductVariant;
      quantity: number;
      price: number;
      subtotal: number;
      stock: number;
    }> = [];

    for (const v of activeVariants) {
      const qty = variantQuantities[v.id] || 0;
      if (qty > 0) {
        const price = getVariantEffectivePrice(product, v);
        const stock = getAvailableStock(product, v);
        totalUnits += qty;
        totalPrice += price * qty;
        selectedList.push({
          variant: v,
          quantity: qty,
          price,
          subtotal: price * qty,
          stock,
        });
      }
    }

    return { totalUnits, totalPrice, selectedList };
  }, [activeVariants, variantQuantities, product]);

  // Reset or initialize state when drawer opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setHasError(false);
      setIsSubmitting(false);
      setAddedSuccess(false);
      setIsMultiVariantMode(false);
      setVariantQuantities({});

      // Business Rule:
      // If the product has only 1 variant or 0 option groups, it doesn't require customer choice.
      // Otherwise: DO NOT auto-select the first variant; customer must make an explicit choice.
      const active = (product.variants || []).filter((v) => v.is_active !== false);

      if (active.length === 1 && activeOptionGroups.length === 0) {
        // Single SKU variant without customer choice needed
        setSelectedVariant(active[0]);
        setSelectedOptions({});
      } else {
        // Customer choice required: start with clean unselected state
        setSelectedVariant(null);
        setSelectedOptions({});
      }
    }
  }, [isOpen, product, activeOptionGroups.length]);

  // Available stock for currently resolved variant or base product (Single Mode)
  const availableStock = useMemo(() => {
    return getAvailableStock(product, selectedVariant);
  }, [product, selectedVariant]);

  const isOutOfStock = useMemo(() => {
    if (selectedVariant) {
      return availableStock <= 0;
    }
    if (product.variants && product.variants.length > 0) {
      const active = product.variants.filter((v) => v.is_active !== false);
      if (active.length === 0) return true;
      return active.every((v) => Number(v.stock_quantity || 0) <= 0);
    }
    return product.stock_quantity !== undefined && product.stock_quantity <= 0;
  }, [product, selectedVariant, availableStock]);

  // Price calculations (Single Mode)
  const effectivePrice = useMemo(() => {
    return getVariantEffectivePrice(product, selectedVariant);
  }, [product, selectedVariant]);

  const variantPrices = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return [];
    return product.variants
      .filter((v) => v.is_active !== false)
      .map((v) => getVariantEffectivePrice(product, v));
  }, [product]);

  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : product.price;
  const hasPriceRange = variantPrices.length > 0 && minPrice !== maxPrice && !selectedVariant;

  const compareAtPrice = useMemo(() => {
    if (selectedVariant?.compare_at_price && selectedVariant.compare_at_price > effectivePrice) {
      return Number(selectedVariant.compare_at_price);
    }
    if (product.compare_at_price && product.compare_at_price > effectivePrice) {
      return Number(product.compare_at_price);
    }
    return null;
  }, [selectedVariant, effectivePrice, product.compare_at_price]);

  const discountAmount = compareAtPrice && compareAtPrice > effectivePrice
    ? compareAtPrice - effectivePrice
    : 0;

  const discountPercent = compareAtPrice && compareAtPrice > effectivePrice
    ? Math.round(((compareAtPrice - effectivePrice) / compareAtPrice) * 100)
    : 0;

  // Active Image switching: reflects variant image or falls back to product image
  const displayImage = useMemo(() => {
    if (selectedVariant?.image_url) return selectedVariant.image_url;
    if ((selectedVariant as any)?.image) return (selectedVariant as any).image;

    // Check if selected color matches an image in product.images
    const colorChoice = selectedOptions["Color"] || selectedOptions["color"] || selectedVariant?.color_name;
    if (colorChoice && Array.isArray(product.images)) {
      const matchedImg = product.images.find(
        (img) => (img as any).color_name?.toLowerCase() === colorChoice.toLowerCase()
      );
      if (matchedImg?.image_url) return matchedImg.image_url;
    }

    return (
      product.primary_image?.image_url ||
      product.images?.[0]?.image_url ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"
    );
  }, [selectedVariant, selectedOptions, product]);

  // Option change handler (Single Mode)
  const handleOptionSelect = (groupName: string, value: string) => {
    setHasError(false);
    const nextSelection = {
      ...selectedOptions,
      [groupName]: value,
    };
    setSelectedOptions(nextSelection);

    // Resolve matching variant
    const matched = resolveMatchingVariant(product.variants || [], nextSelection, activeOptionGroups);
    setSelectedVariant(matched);

    // Reset quantity if it exceeds the newly selected variant's available stock
    if (matched) {
      const stock = Number(matched.stock_quantity ?? 0);
      if (stock > 0 && quantity > stock) {
        setQuantity(stock);
      }
    }
  };

  // Quantity controls (Single Mode)
  const handleIncreaseQty = () => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Switch between Single and Multi-variant modes
  const handleEnableMultiVariantMode = () => {
    setIsMultiVariantMode(true);
    // If a variant was already selected in single mode and is in stock, carry it over with its quantity
    if (selectedVariant && quantity > 0) {
      const stock = getAvailableStock(product, selectedVariant);
      if (stock > 0) {
        setVariantQuantities((prev) => ({
          ...prev,
          [selectedVariant.id]: Math.min(quantity, stock),
        }));
      }
    }
  };

  const handleDisableMultiVariantMode = () => {
    setIsMultiVariantMode(false);
  };

  // Multi-variant per-item quantity steppers
  const handleIncrementVariantQty = (v: ProductVariant) => {
    const stock = getAvailableStock(product, v);
    if (stock <= 0) return;
    const current = variantQuantities[v.id] || 0;
    if (current < stock) {
      setVariantQuantities((prev) => ({
        ...prev,
        [v.id]: current + 1,
      }));
    } else {
      toast.warning(`Maximum available stock (${stock}) reached for ${v.color_name || v.name}.`);
    }
  };

  const handleDecrementVariantQty = (v: ProductVariant) => {
    const current = variantQuantities[v.id] || 0;
    if (current > 0) {
      setVariantQuantities((prev) => ({
        ...prev,
        [v.id]: current - 1,
      }));
    }
  };

  const handleRemoveVariant = (variantId: number) => {
    setVariantQuantities((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  };

  const handleResetMulti = () => {
    setVariantQuantities({});
  };

  // Single Add to Cart handler
  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isSelectionComplete) {
      setHasError(true);
      toast.error("Please select all required options before adding to cart.");
      return;
    }

    if (isOutOfStock) {
      toast.error("The selected option is currently out of stock.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = addItem(product, selectedVariant, quantity);

      if (!result.success) {
        toast.error(result.message);
        setIsSubmitting(false);
        return;
      }

      setAddedSuccess(true);
      toast.success(
        `Added ${quantity}x ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ""} to cart`
      );

      // Brief animation feedback then close drawer
      setTimeout(() => {
        setIsSubmitting(false);
        setAddedSuccess(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Failed to add item to cart.");
    }
  };

  // Single Buy Now handler
  const handleBuyNow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isSelectionComplete) {
      setHasError(true);
      toast.error("Please select all required options before proceeding.");
      return;
    }

    if (isOutOfStock) {
      toast.error("The selected option is currently out of stock.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = addItem(product, selectedVariant, quantity);

      if (!result.success) {
        toast.error(result.message);
        setIsSubmitting(false);
        return;
      }

      closeCart();
      onClose();
      router.push("/checkout");
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Could not proceed to checkout.");
    }
  };

  // Multi-variant Add to Cart handler
  const handleMultiAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (multiSelectionSummary.totalUnits <= 0) {
      toast.error("Please select at least one variant quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      const entries = multiSelectionSummary.selectedList.map((item) => ({
        product,
        variant: item.variant,
        quantity: item.quantity,
      }));

      const res = addMultipleItems(entries);

      if (!res.success) {
        toast.error(res.message);
        setIsSubmitting(false);
        return;
      }

      if (res.partial) {
        toast.warning(res.message);
      } else {
        toast.success(res.message);
      }

      setAddedSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setAddedSuccess(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Failed to add items to cart.");
    }
  };

  // Multi-variant Buy Now handler
  const handleMultiBuyNow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (multiSelectionSummary.totalUnits <= 0) {
      toast.error("Please select at least one variant quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      const entries = multiSelectionSummary.selectedList.map((item) => ({
        product,
        variant: item.variant,
        quantity: item.quantity,
      }));

      const res = addMultipleItems(entries);

      if (!res.success) {
        toast.error(res.message);
        setIsSubmitting(false);
        return;
      }

      closeCart();
      onClose();
      router.push("/checkout");
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Could not proceed to checkout.");
    }
  };

  // Return focus to trigger button when closed
  const handleClose = () => {
    onClose();
    if (triggerRef?.current) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop Overlay */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        />

        {/* Responsive Content Drawer - Always exactly matches 100% of viewport height */}
        <DialogPrimitive.Content
          aria-describedby="drawer-product-description"
          className="fixed z-[75] flex flex-col bg-white dark:bg-[#0c101d] text-slate-900 dark:text-slate-100 shadow-2xl transition-all duration-300 ease-out focus:outline-none border-slate-200 dark:border-white/10
            top-0 bottom-0 inset-y-0 h-screen h-[100dvh] min-h-screen min-h-[100dvh] max-h-screen max-h-[100dvh]
            /* Mobile presentation: full screen height */
            inset-x-0 w-full rounded-none border-t sm:border-t-0 animate-in slide-in-from-bottom duration-300
            /* Desktop presentation: full screen height right-side drawer */
            sm:inset-y-0 sm:top-0 sm:bottom-0 sm:right-0 sm:left-auto sm:h-screen sm:h-[100dvh] sm:w-[450px] sm:max-w-md sm:rounded-none sm:border-l sm:slide-in-from-right"
          style={{ height: "100dvh", maxHeight: "100dvh" }}
        >

          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                {product.category?.name || product.brand || "Inhaliq"}
              </span>
              <DialogPrimitive.Title
                id="drawer-product-title"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-1 mt-0.5"
                title={product.name}
              >
                {product.name}
              </DialogPrimitive.Title>
            </div>

            <DialogPrimitive.Close
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors focus:outline-none cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* 1. Compact Product & Price Preview Card */}
            <div className="flex gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5">
              {/* Product Thumbnail with Variant Image Switch */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-lg overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950 shrink-0">
                <Image
                  src={displayImage}
                  alt={product.name || "Product preview"}
                  fill
                  sizes="88px"
                  className="object-cover object-center transition-all duration-300"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-black bg-rose-600 text-white shadow-2xs">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {/* Price, Stock Status, and SKU */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {isMultiVariantMode && multiSelectionSummary.totalUnits > 0
                        ? formatPrice(multiSelectionSummary.totalPrice)
                        : hasPriceRange
                        ? `From ${formatPrice(minPrice)}`
                        : formatPrice(effectivePrice)}
                    </span>
                    {compareAtPrice && !isMultiVariantMode && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(compareAtPrice)}
                      </span>
                    )}
                  </div>

                  {discountAmount > 0 && !isMultiVariantMode && (
                    <div className="text-[10px] font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                      Save {formatPrice(discountAmount)}
                    </div>
                  )}

                  {isMultiVariantMode && (
                    <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {multiSelectionSummary.totalUnits > 0
                        ? `${multiSelectionSummary.totalUnits} items selected (${multiSelectionSummary.selectedList.length} variants)`
                        : "Select variant quantities below"}
                    </div>
                  )}
                </div>

                {/* Availability State */}
                {!isMultiVariantMode && (
                  <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                    {!isSelectionComplete ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-cyan-600 dark:text-cyan-400">
                        <Layers className="w-3 h-3 shrink-0" />
                        <span>Select options to check stock</span>
                      </span>
                    ) : isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Out of stock</span>
                      </span>
                    ) : availableStock <= 3 ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Only {availableStock} left in stock!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>In Stock ({availableStock} units)</span>
                      </span>
                    )}

                    {selectedVariant?.sku && (
                      <span className="text-[9.5px] font-mono text-slate-400 truncate max-w-[120px]">
                        {selectedVariant.sku}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hidden description for accessibility */}
            <DialogPrimitive.Description
              id="drawer-product-description"
              className="sr-only"
            >
              Select required options, flavor, or color variant and quantity for {product.name}.
            </DialogPrimitive.Description>

            {/* Mode Switcher Pill (for products with multiple variants) */}
            {activeVariants.length > 1 && (
              <div className="flex items-center justify-between p-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={handleDisableMultiVariantMode}
                  className={`flex-1 py-1.5 px-3 rounded-md font-bold text-center transition-all cursor-pointer ${
                    !isMultiVariantMode
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Single Variant
                </button>
                <button
                  type="button"
                  onClick={handleEnableMultiVariantMode}
                  className={`flex-1 py-1.5 px-3 rounded-md font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isMultiVariantMode
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Select Multiple</span>
                  {multiSelectionSummary.totalUnits > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {multiSelectionSummary.totalUnits}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 2. Variant Selector Body: Single Mode vs Multi-Variant Mode */}
            {isMultiVariantMode ? (
              /* MULTI-VARIANT MODE */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {isSingleAttribute ? "Variant Quantities" : "Valid Combinations"}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Specify separate quantities for each variant you wish to buy.
                    </p>
                  </div>
                  {multiSelectionSummary.totalUnits > 0 && (
                    <button
                      type="button"
                      onClick={handleResetMulti}
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset all</span>
                    </button>
                  )}
                </div>

                {/* Compact Variant Rows */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                  {activeVariants.map((v) => {
                    const vStock = getAvailableStock(product, v);
                    const vPrice = getVariantEffectivePrice(product, v);
                    const vQty = variantQuantities[v.id] || 0;
                    const isOOS = vStock <= 0;
                    const vImg = v.image_url || displayImage;

                    return (
                      <div
                        key={v.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          vQty > 0
                            ? "border-emerald-500/60 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08] shadow-2xs"
                            : isOOS
                            ? "border-slate-200/60 dark:border-white/5 opacity-50 bg-slate-100/40 dark:bg-white/[0.01]"
                            : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                        }`}
                      >
                        {/* Variant Details */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {v.color_hex ? (
                            <div
                              className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-2xs"
                              style={{ backgroundColor: v.color_hex }}
                            />
                          ) : (
                            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shrink-0">
                              <Image src={vImg} alt={v.name} fill sizes="28px" className="object-cover" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {v.color_name || v.name}
                              </span>
                              {v.sku && (
                                <span className="text-[9px] font-mono text-slate-400 truncate">
                                  {v.sku}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {formatPrice(vPrice)}
                              </span>

                              {isOOS ? (
                                <span className="text-[9.5px] font-bold text-rose-500">
                                  Out of stock
                                </span>
                              ) : vStock <= 3 ? (
                                <span className="text-[9.5px] font-bold text-amber-500">
                                  Only {vStock} left
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {vStock} available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Stepper & Quick Remove */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="inline-flex items-center border border-slate-200 dark:border-white/10 rounded-lg p-0.5 bg-white dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleDecrementVariantQty(v)}
                              disabled={vQty <= 0 || isSubmitting}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label={`Decrease ${v.color_name || v.name} quantity`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span
                              className={`w-7 text-center font-bold text-xs tabular-nums select-none ${
                                vQty > 0
                                  ? "text-emerald-600 dark:text-emerald-400 font-black"
                                  : "text-slate-400"
                              }`}
                            >
                              {vQty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleIncrementVariantQty(v)}
                              disabled={vQty >= vStock || isOOS || isSubmitting}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label={`Increase ${v.color_name || v.name} quantity`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {vQty > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              disabled={isSubmitting}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Reset variant"
                              aria-label={`Remove ${v.color_name || v.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-Selection Summary Card */}
                {multiSelectionSummary.totalUnits > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>Order Summary</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {multiSelectionSummary.selectedList.length} variant{multiSelectionSummary.selectedList.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/10">
                      <span className="text-slate-500 dark:text-slate-400">Total Units</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {multiSelectionSummary.totalUnits} {multiSelectionSummary.totalUnits === 1 ? "unit" : "units"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Total Price</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatPrice(multiSelectionSummary.totalPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SINGLE-VARIANT MODE (DEFAULT) */
              <>
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3">
                    <VariantPicker
                      options={product.options}
                      variants={product.variants}
                      selectedVariant={selectedVariant}
                      selectedOptions={selectedOptions}
                      onSelectOption={handleOptionSelect}
                      onSelectVariant={setSelectedVariant}
                      basePrice={product.price}
                      availableStock={availableStock}
                      hasError={hasError}
                    />

                    {/* Subtle Action to Order Multiple Variants */}
                    {activeVariants.length > 1 && (
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleEnableMultiVariantMode}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <CopyPlus className="w-3.5 h-3.5" />
                          <span>Need multiple options? Select multiple variants</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Single-Variant Quantity Stepper */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Quantity
                    </label>
                    {selectedVariant && availableStock > 0 && (
                      <span className="text-[10px] text-slate-400">
                        Max: {availableStock} {availableStock === 1 ? "unit" : "units"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center border border-slate-200 dark:border-white/10 rounded-lg p-0.5 bg-slate-50 dark:bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={handleDecreaseQty}
                        disabled={quantity <= 1 || isOutOfStock || isSubmitting}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-10 text-center font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums select-none">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncreaseQty}
                        disabled={quantity >= availableStock || isOutOfStock || isSubmitting || !isSelectionComplete}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal calculation */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Subtotal
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        {formatPrice(effectivePrice * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Subtle Link to Full Product Page */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group/link"
              >
                <span>View full product specifications & reviews</span>
                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Drawer Footer Actions (Sticky Bottom) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/90 dark:bg-[#0c101d]/95 backdrop-blur-md space-y-2 mt-auto shrink-0">
            {isMultiVariantMode ? (
              /* MULTI-VARIANT FOOTER ACTIONS */
              <>
                {/* Primary Action: Add Selected to Cart */}
                <button
                  type="button"
                  onClick={handleMultiAddToCart}
                  disabled={multiSelectionSummary.totalUnits === 0 || isSubmitting}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    multiSelectionSummary.totalUnits === 0
                      ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-white/5"
                      : addedSuccess
                      ? "bg-emerald-600 text-white"
                      : "theme-btn-primary hover:scale-[1.01] active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Adding selected items...</span>
                    </>
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Added to cart!</span>
                    </>
                  ) : multiSelectionSummary.totalUnits === 0 ? (
                    <>
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>Select variants above</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>
                        Add {multiSelectionSummary.totalUnits} {multiSelectionSummary.totalUnits === 1 ? "item" : "items"} to Cart • {formatPrice(multiSelectionSummary.totalPrice)}
                      </span>
                    </>
                  )}
                </button>

                {/* Secondary Action: Buy Selected Now */}
                <button
                  type="button"
                  onClick={handleMultiBuyNow}
                  disabled={multiSelectionSummary.totalUnits === 0 || isSubmitting}
                  className={`w-full py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    multiSelectionSummary.totalUnits === 0 || isSubmitting
                      ? "opacity-40 cursor-not-allowed border-transparent text-slate-500"
                      : "border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Buy {multiSelectionSummary.totalUnits > 0 ? `${multiSelectionSummary.totalUnits} Selected` : "Now"} (Instant Checkout)
                  </span>
                </button>
              </>
            ) : (
              /* SINGLE-VARIANT FOOTER ACTIONS */
              <>
                {/* Primary Action: Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isSubmitting}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    isOutOfStock
                      ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-white/5"
                      : addedSuccess
                      ? "bg-emerald-600 text-white"
                      : !isSelectionComplete
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                      : "theme-btn-primary hover:scale-[1.01] active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Adding to cart...</span>
                    </>
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Added to cart!</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Out of Stock</span>
                  ) : !isSelectionComplete ? (
                    <>
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>Select options to add</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>Add to Cart • {formatPrice(effectivePrice * quantity)}</span>
                    </>
                  )}
                </button>

                {/* Secondary Action: Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isSubmitting}
                  className={`w-full py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isOutOfStock || isSubmitting
                      ? "opacity-40 cursor-not-allowed border-transparent text-slate-500"
                      : "border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Buy Now (Instant Checkout)</span>
                </button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
