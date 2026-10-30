"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart, Check, Sparkles, Zap, AlertCircle, Layers, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { getVariantEffectivePrice } from "@/lib/storefrontVariants";
import { ProductVariantDrawer } from "./ProductVariantDrawer";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem, closeCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { theme } = useThemeStore();
  const { t, toLocalDigits } = useLanguage();
  const [addedAnim, setAddedAnim] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const img =
    product.primary_image?.image_url ||
    product.images?.[0]?.image_url ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

  const inWishlist = isInWishlist(product.id);
  const hasOptionsOrVariants = Boolean(
    product.has_options || (product.variants && product.variants.length > 1)
  );

  const isOutOfStock = (() => {
    if (product.variants && product.variants.length > 0) {
      const active = product.variants.filter((v) => v.is_active !== false);
      if (active.length === 0) return true;
      return active.every((v) => Number(v.stock_quantity || 0) <= 0);
    }
    return product.stock_quantity !== undefined && product.stock_quantity <= 0;
  })();

  const variantPrices = product.variants && product.variants.length > 0
    ? product.variants
        .filter((v) => v.is_active !== false)
        .map((v) => getVariantEffectivePrice(product, v))
    : [];
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : product.price;
  const hasPriceRange = variantPrices.length > 0 && minPrice !== maxPrice;

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    setIsDrawerOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (hasOptionsOrVariants) {
      setIsDrawerOpen(true);
      return;
    }
    const result = addItem(product, product.variants?.[0] || null, 1);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    if (result.message && result.message.includes("maximum available stock")) {
      toast.warning(result.message);
    }
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (hasOptionsOrVariants) {
      setIsDrawerOpen(true);
      return;
    }
    const result = addItem(product, product.variants?.[0] || null, 1);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    closeCart();
    router.push("/checkout");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const hasDiscount = Boolean(
    product.compare_at_price && product.compare_at_price > product.price
  );
  const discountAmount = hasDiscount
    ? (product.compare_at_price as number) - product.price
    : 0;
  const discountPercent = hasDiscount
    ? Math.round(
        (((product.compare_at_price as number) - product.price) /
          (product.compare_at_price as number)) *
          100
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative w-full rounded-[var(--theme-card-radius,10px)] theme-card p-2 sm:p-2.5 lg:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-white/20"
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-square w-full rounded-[calc(var(--theme-card-radius,10px)-2px)] overflow-hidden theme-img-bg bg-gray-50 dark:bg-slate-950 mb-2 sm:mb-2.5 border border-gray-100 dark:border-white/5">
          <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
            <Image
              src={img}
              alt={product.name || "Product image"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
                isOutOfStock ? "grayscale opacity-60" : ""
              }`}
            />
          </Link>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-2 z-10 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-rose-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {t("common.outOfStock")}
              </span>
            </div>
          )}

          {/* Badges Top Left */}
          {!isOutOfStock && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
              {discountPercent > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-black bg-rose-600 text-white shadow-xs">
                  -{toLocalDigits(discountPercent)}%
                </span>
              )}
              {product.is_new_arrival && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-xs"
                  style={{
                    backgroundColor: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #0f172a)))",
                    color: "var(--theme-btn-primary-text, #ffffff)",
                  }}
                >
                  <Sparkles className="w-2 h-2" /> {t("common.new")}
                </span>
              )}
              {product.is_best_seller && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: "var(--theme-secondary, #d97706)" }}
                >
                  {t("common.bestSeller")}
                </span>
              )}
            </div>
          )}

          {/* Options Badge Bottom Left */}
          {hasOptionsOrVariants && !isOutOfStock && (
            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-xs">
                <Layers className="w-2.5 h-2.5 text-cyan-400" />
                {product.variants && product.variants.length > 1
                  ? `${product.variants.length} Options`
                  : "Options"}
              </span>
            </div>
          )}

          {/* Wishlist Heart Top Right */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md border transition-all z-10 cursor-pointer ${
              inWishlist
                ? "text-white shadow-xs shadow-[#fb2c5c]/25"
                : "bg-white/85 dark:bg-black/50 border-gray-200 dark:border-white/10 text-slate-600 dark:text-white/80 hover:text-[#fb2c5c] hover:border-[#fb2c5c] shadow-xs"
            }`}
            style={inWishlist ? {
              backgroundColor: "#fb2c5c",
              borderColor: "#fb2c5c"
            } : undefined}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3 h-3 ${inWishlist ? "fill-white text-white" : ""}`} />
          </button>
        </div>

        {/* Product Details */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider block truncate max-w-[120px] text-slate-500 dark:text-slate-400"
            >
              {product.category?.name || product.brand || "Inhaliq"}
            </span>
            {theme.reviews_enabled !== false && (
              <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                <span
                  className="text-[9.5px] font-bold"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  {Number(product.rating_average || 0).toFixed(1)}
                </span>
                <span
                  className="text-[8.5px]"
                  style={{ color: "var(--theme-text-body, #64748b)" }}
                >
                  ({toLocalDigits(product.review_count || 0)})
                </span>
              </div>
            )}
          </div>

          <Link href={`/products/${product.slug}`} className="block transition-colors">
            <h3
              className="font-bold text-xs line-clamp-1 leading-snug transition-colors hover:opacity-80"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-white/5 space-y-2">
        {/* Pricing and Savings - Consistent 2-row layout ensuring flawless card height and button alignment */}
        <div className="flex flex-col justify-center min-h-[38px]">
          <div className="flex items-baseline justify-between gap-1">
            <span
              className="font-black text-sm tracking-tight"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
            >
              {hasPriceRange ? `From ${formatPrice(minPrice)}` : formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-h-[16px] mt-0.5">
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through shrink-0">
                {formatPrice(product.compare_at_price as number)}
              </span>
            )}
            {discountAmount > 0 && (
              <span className="text-[8.5px] font-bold text-rose-500 dark:text-rose-400 shrink-0">
                {t("common.save")} {formatPrice(discountAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Choose Options (for products with variants) OR Add to Cart & Buy Now (for simple products) */}
        {hasOptionsOrVariants ? (
          <button
            ref={triggerRef}
            onClick={handleOpenDrawer}
            disabled={isOutOfStock}
            className={`w-full py-2 px-2.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-white/5"
                : "theme-btn-primary hover:scale-[1.01]"
            }`}
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
          >
            <span className="truncate">{isOutOfStock ? t("common.outOfStock") : t("product.selectVariant")}</span>
            {!isOutOfStock && <ArrowRight className="w-3 h-3 shrink-0" />}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`py-1.5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isOutOfStock
                  ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-white/5"
                  : addedAnim
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "theme-btn-secondary hover:scale-[1.02]"
              }`}
            >
              {addedAnim ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{t("common.addedToCart")}</span>
                </>
              ) : (
                <>
                  <ShoppingBag
                    className="w-2.5 h-2.5 shrink-0 text-slate-800 dark:text-slate-200"
                  />
                  <span className="truncate">{t("common.addToCart")}</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`py-1.5 px-1.5 rounded-md font-black text-[10px] flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                isOutOfStock
                  ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                  : "theme-btn-primary hover:scale-[1.02]"
              }`}
            >
              <Zap className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{t("common.buyNow")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Variant Quick-View Drawer */}
      {hasOptionsOrVariants && (
        <ProductVariantDrawer
          product={product}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          triggerRef={triggerRef}
        />
      )}
    </motion.div>
  );
}
