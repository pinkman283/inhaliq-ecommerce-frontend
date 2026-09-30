"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { useCartStore, getAvailableStock } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    promotionEvaluation,
    setPromotionEvaluation,
    getSubtotal,
    getDiscount,
    getItemCount,
    validationNotices,
    dismissNotices,
    validateCartWithServer,
    hasInvalidItems,
    isValidating,
  } = useCartStore();

  // Validate cart against server on drawer open
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      validateCartWithServer();
    }
  }, [isCartOpen, items.length, validateCartWithServer]);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const itemCount = getItemCount();

  // Auto-evaluate promotions on cart change
  useEffect(() => {
    if (!isCartOpen || items.length === 0) return;

    let isMounted = true;
    const evaluate = async () => {
      try {
        const payload = {
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
            price: Number(i.product.price) + (i.variant ? Number(i.variant.price_modifier) : 0),
            category_id: (i.product as { category_id?: number }).category_id,
          })),
          code: appliedCoupon?.code || undefined,
        };
        const res = await api.evaluatePromotions(payload);
        if (isMounted && res.valid) {
          setPromotionEvaluation(res);
        }
      } catch {
        // silent fallback
      }
    };
    evaluate();
    return () => {
      isMounted = false;
    };
  }, [isCartOpen, items, appliedCoupon?.code, setPromotionEvaluation]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: Number(i.product.price) + (i.variant ? Number(i.variant.price_modifier) : 0),
          category_id: (i.product as { category_id?: number }).category_id,
        })),
        code: couponInput.trim(),
      };
      const result = await api.evaluatePromotions(payload);
      if (result.valid) {
        setPromotionEvaluation(result);
        applyCoupon({
          valid: true,
          code: couponInput.trim().toUpperCase(),
          discount_type: (result.applied_promotions?.[0]?.discount_type as "percentage" | "fixed") || "fixed",
          value: result.total_discount,
          discount_amount: result.total_discount,
          message: result.message || "Promotion applied!",
        });
        setCouponInput("");
      } else {
        setCouponError(result.error_message || "Invalid or ineligible promotion code.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to validate coupon.";
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (hasInvalidItems()) {
      toast.error("Please remove or adjust unavailable items before proceeding to checkout.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const valResult = await validateCartWithServer();
      if (valResult && (!valResult.is_valid || valResult.summary?.has_out_of_stock || valResult.summary?.has_inactive_items)) {
        toast.error("Some items in your cart need your attention before checking out.");
        return;
      }
      closeCart();
      router.push("/checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="w-screen max-w-md border-l shadow-2xl flex flex-col justify-between transition-colors"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--theme-text-body, #64748b)"
              }}
            >
              {/* Drawer Header */}
              <div 
                className="p-5 border-b flex items-center justify-between transition-colors"
                style={{ borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))" }}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
                    style={{ 
                      backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 12%, transparent)", 
                      borderColor: "color-mix(in srgb, var(--theme-primary, #006B45) 28%, transparent)" 
                    }}
                  >
                    <ShoppingBag 
                      className="w-4 h-4" 
                      style={{ color: "var(--theme-primary, #006B45)" }} 
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-sm font-bold leading-none mb-1 flex items-center gap-1.5"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Your Studio Cart
                      {isValidating && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </h3>
                    <span 
                      className="text-[11px]"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] hover:text-rose-500 transition-colors mr-2 cursor-pointer font-medium"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={closeCart}
                    className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                    style={{ color: "var(--theme-text-body, #64748b)" }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Server Validation Notices Banner */}
                {validationNotices.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Cart Updated
                      </span>
                      <button
                        onClick={dismissNotices}
                        className="text-[10px] underline hover:opacity-80 cursor-pointer font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                      {validationNotices.map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div 
                      className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 transition-colors"
                      style={{ 
                        backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 10%, transparent)", 
                        borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))" 
                      }}
                    >
                      <ShoppingBag 
                        className="w-8 h-8" 
                        style={{ color: "var(--theme-text-body, #64748b)" }} 
                      />
                    </div>
                    <h4 
                      className="text-base font-bold mb-1"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Your cart is empty
                    </h4>
                    <p 
                      className="text-xs max-w-xs mb-6"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Explore our precision acoustic headphones, mechanical keyboards, and modular daily essentials.
                    </p>
                    <button
                      onClick={closeCart}
                      className="px-6 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-lg hover:brightness-105 active:scale-95"
                      style={{ 
                        backgroundColor: "var(--theme-btn-primary-bg, var(--theme-primary, #006B45))", 
                        color: "var(--theme-btn-primary-text, #ffffff)",
                        boxShadow: "0 8px 24px -4px color-mix(in srgb, var(--theme-primary, #006B45) 35%, transparent)"
                      }}
                    >
                      Start Exploring
                    </button>
                  </div>
                ) : (
                  items.map((item) => {
                    const img = item.product.primary_image?.image_url || item.product.images?.[0]?.image_url;
                    const itemPrice = Number(item.product.price) + (item.variant ? Number(item.variant.price_modifier) : 0);
                    const availableStock = item.availableStock !== undefined
                      ? item.availableStock
                      : getAvailableStock(item.product, item.variant);
                    const isOutOfStock = availableStock <= 0 || item.validationStatus === "out_of_stock";
                    const isUnavailable =
                      item.validationStatus === "inactive" ||
                      item.validationStatus === "product_not_found" ||
                      item.validationStatus === "variant_not_found" ||
                      item.validationStatus === "variant_mismatch";
                    const isExceeded = !isUnavailable && !isOutOfStock && item.quantity > availableStock;
                    const isPriceChanged = item.validationStatus === "price_changed" || (item.validationMessage && item.validationMessage.includes("Price updated"));
                    const isQuantityAdjusted = item.validationStatus === "quantity_adjusted";

                    return (
                      <motion.div
                        key={`${item.product.id}-${item.variant?.id ?? "none"}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex gap-3.5 p-3 rounded-2xl border transition-all ${
                          isOutOfStock || isUnavailable
                            ? "opacity-75 bg-rose-500/5 border-rose-500/20"
                            : ""
                        }`}
                        style={{
                          backgroundColor: isOutOfStock || isUnavailable
                            ? undefined
                            : "color-mix(in srgb, var(--theme-card-bg, #ffffff) 92%, var(--theme-bg, #f8fafc))",
                          borderColor: isOutOfStock || isUnavailable
                            ? undefined
                            : "var(--theme-card-border, rgba(255, 255, 255, 0.08))"
                        }}
                      >
                        {/* Thumbnail */}
                        {img && (
                          <div 
                            className="w-18 h-18 rounded-xl overflow-hidden border shrink-0 p-1 flex items-center justify-center transition-colors relative"
                            style={{
                              backgroundColor: "var(--theme-card-bg, #ffffff)",
                              borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                            }}
                          >
                            <img
                              src={img}
                              alt={item.product.name}
                              className={`w-full h-full object-cover rounded-lg ${isOutOfStock || isUnavailable ? "grayscale" : ""}`}
                            />
                            {(isOutOfStock || isUnavailable) && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider px-1 py-0.5 bg-rose-500 rounded">
                                  {isOutOfStock ? "Sold Out" : "Unavailable"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 
                                className="text-xs font-bold truncate"
                                style={{ color: "var(--theme-text-heading, #0f172a)" }}
                              >
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeItem(item.product.id, item.variant?.id)}
                                className="hover:text-rose-500 transition-colors p-1 cursor-pointer shrink-0"
                                style={{ color: "var(--theme-text-body, #64748b)" }}
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {item.variant && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {item.variant.color_hex && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/40 inline-block"
                                    style={{ backgroundColor: item.variant.color_hex }}
                                  />
                                )}
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors"
                                  style={{
                                    backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 12%, transparent)",
                                    color: "var(--theme-primary, #006B45)",
                                    borderColor: "color-mix(in srgb, var(--theme-primary, #006B45) 25%, transparent)"
                                  }}
                                >
                                  {item.variant.name}
                                </span>
                              </div>
                            )}

                            {/* Status Badges & Notices */}
                            {isOutOfStock ? (
                              <span className="inline-block mt-1 text-[10px] font-bold text-rose-500">
                                Out of stock
                              </span>
                            ) : isUnavailable ? (
                              <span className="inline-block mt-1 text-[10px] font-bold text-amber-500">
                                Product unavailable
                              </span>
                            ) : isExceeded ? (
                              <span className="inline-block mt-1 text-[10px] font-bold text-rose-500">
                                Only {availableStock} available in stock
                              </span>
                            ) : null}

                            {isQuantityAdjusted && item.validationMessage && (
                              <p className="text-[10px] text-amber-500 mt-1 font-medium">
                                {item.validationMessage}
                              </p>
                            )}

                            {isPriceChanged && item.validationMessage && (
                              <p className="text-[10px] text-cyan-500 mt-1 font-medium">
                                {item.validationMessage}
                              </p>
                            )}
                          </div>

                          {/* Price & Quantity Controls */}
                          <div 
                            className="flex items-center justify-between mt-2 pt-1 border-t"
                            style={{ borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.08))" }}
                          >
                            <span 
                              className="text-xs font-black"
                              style={{ color: "var(--theme-primary, #006B45)" }}
                            >
                              {formatPrice(itemPrice * item.quantity)}
                            </span>

                            <div 
                              className="flex items-center gap-2 rounded-md p-1 border transition-colors"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--theme-card-bg, #ffffff) 70%, var(--theme-bg, #f8fafc))",
                                borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                              }}
                            >
                              <button
                                type="button"
                                disabled={item.quantity <= 1 || isOutOfStock || isUnavailable}
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(item.product.id, item.variant?.id, item.quantity - 1);
                                  }
                                }}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ color: "var(--theme-text-body, #64748b)" }}
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span 
                                className="text-xs font-bold w-4 text-center"
                                style={{ color: "var(--theme-text-heading, #0f172a)" }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= availableStock || isOutOfStock || isUnavailable}
                                onClick={() => {
                                  const res = updateQuantity(item.product.id, item.variant?.id, item.quantity + 1);
                                  if (!res.success && res.message) {
                                    toast.warning(res.message);
                                  }
                                }}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ color: "var(--theme-text-body, #64748b)" }}
                                title={item.quantity >= availableStock ? "Maximum available stock reached" : "Increase quantity"}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer & Checkout Action */}
              {items.length > 0 && (
                <div 
                  className="p-5 border-t space-y-4 transition-colors"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                  }}
                >
                  {/* Promo Code Input */}
                  {appliedCoupon ? (
                    <div 
                      className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                      style={{
                        backgroundColor: "color-mix(in srgb, #10b981 12%, transparent)",
                        borderColor: "color-mix(in srgb, #10b981 25%, transparent)"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">(-{formatPrice(discount)})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-[11px] hover:text-rose-500 font-semibold cursor-pointer transition-colors"
                        style={{ color: "var(--theme-text-body, #64748b)" }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag 
                            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" 
                            style={{ color: "var(--theme-text-body, #64748b)" }}
                          />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Promo Code (e.g. WELCOME20)"
                            className="w-full rounded-md pl-8.5 pr-3 py-2 text-xs uppercase tracking-wider focus:outline-none transition-colors border"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--theme-bg, #f8fafc) 85%, var(--theme-card-bg, #ffffff))",
                              borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.12))",
                              color: "var(--theme-text-heading, #0f172a)"
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={couponLoading || !couponInput.trim()}
                          className="px-4 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                          style={{
                            backgroundColor: "var(--theme-primary, #006B45)",
                            color: "var(--theme-btn-primary-text, #ffffff)",
                            boxShadow: "0 4px 14px -2px color-mix(in srgb, var(--theme-primary, #006B45) 35%, transparent)"
                          }}
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 pt-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {couponError}
                        </p>
                      )}
                    </form>
                  )}

                  {/* Pricing Breakdown */}
                  <div 
                    className="space-y-2 text-xs pt-3 border-t"
                    style={{ 
                      color: "var(--theme-text-body, #64748b)",
                      borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.08))"
                    }}
                  >
                    {discount > 0 ? (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span 
                            className="font-medium"
                            style={{ color: "var(--theme-text-heading, #0f172a)" }}
                          >
                            {formatPrice(subtotal)}
                          </span>
                        </div>

                        {/* Promotion Breakdown List */}
                        {promotionEvaluation?.valid && promotionEvaluation.applied_promotions.length > 0 ? (
                          <div 
                            className="space-y-1.5 p-2 rounded-lg border my-1"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 5%, transparent)",
                              borderColor: "color-mix(in srgb, var(--theme-primary, #006B45) 15%, transparent)"
                            }}
                          >
                            {promotionEvaluation.applied_promotions.map((p, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-amber-500 dark:text-amber-300">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  {p.promotion_name} {p.code ? `(${p.code})` : ""}
                                </span>
                                <span className="font-mono font-bold">
                                  {p.discount_amount > 0 ? `-${formatPrice(p.discount_amount)}` : "Applied"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Discount</span>
                            <span>-{formatPrice(discount)}</span>
                          </div>
                        )}

                        <div 
                          className="flex justify-between text-sm font-black pt-2 border-t"
                          style={{ borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))" }}
                        >
                          <span style={{ color: "var(--theme-text-heading, #0f172a)" }}>Total</span>
                          <span className="text-base font-black" style={{ color: "var(--theme-primary, #006B45)" }}>
                            {formatPrice(Math.max(0, subtotal - discount))}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div 
                        className="flex justify-between text-sm font-black py-1"
                      >
                        <span style={{ color: "var(--theme-text-heading, #0f172a)" }}>Subtotal</span>
                        <span className="text-base font-black" style={{ color: "var(--theme-primary, #006B45)" }}>
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Invalid Cart Notice */}
                  {hasInvalidItems() && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] flex items-center gap-2 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Please remove or adjust unavailable items to proceed.</span>
                    </div>
                  )}

                  {/* Checkout CTA */}
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || hasInvalidItems()}
                    className="w-full py-3.5 rounded-md text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, var(--theme-btn-primary-bg, var(--theme-primary, #006B45)), var(--theme-secondary, #C6A15B))",
                      color: "var(--theme-btn-primary-text, #ffffff)",
                      boxShadow: "0 10px 28px -4px color-mix(in srgb, var(--theme-primary, #006B45) 40%, transparent)"
                    }}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating Cart...</span>
                      </>
                    ) : (
                      <>
                        Proceed to Checkout <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Cart Trust Reassurance Strip */}
                  <div 
                    className="pt-2 flex items-center justify-between text-[10px] border-t"
                    style={{ 
                      color: "var(--theme-text-body, #64748b)",
                      borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.08))"
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <span 
                        className="w-1.5 h-1.5 rounded-full inline-block" 
                        style={{ backgroundColor: "var(--theme-primary, #006B45)" }}
                      /> Cash on Delivery
                    </span>
                    <span className="flex items-center gap-1">
                      <span 
                        className="w-1.5 h-1.5 rounded-full inline-block" 
                        style={{ backgroundColor: "var(--theme-secondary, #C6A15B)" }}
                      /> Express Dispatch
                    </span>
                    <span className="flex items-center gap-1">
                      <span 
                        className="w-1.5 h-1.5 rounded-full inline-block" 
                        style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary, #006B45) 65%, #10b981)" }}
                      /> 100% Authentic
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
