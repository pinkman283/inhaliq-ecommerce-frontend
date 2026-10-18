"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, Trash2, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";

export function WishlistDrawer() {
  const { items, isWishlistOpen, closeWishlist, toggleWishlist, clearWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const handleMoveToCart = (product: any) => {
    addItem(product);
    toggleWishlist(product);
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => addItem(item));
    clearWishlist();
    closeWishlist();
    openCart();
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWishlist}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="w-full sm:w-[420px] max-w-full sm:max-w-md border-l shadow-2xl flex flex-col justify-between transition-colors"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--theme-text-body, #64748b)"
              }}
            >
              {/* Header */}
              <div 
                className="p-5 border-b flex items-center justify-between transition-colors"
                style={{ borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))" }}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: "color-mix(in srgb, #f43f5e 12%, transparent)",
                      borderColor: "color-mix(in srgb, #f43f5e 28%, transparent)"
                    }}
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </div>
                  <div>
                    <h3 
                      className="text-sm font-bold leading-none mb-1"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Saved Gear
                    </h3>
                    <span 
                      className="text-[11px]"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={clearWishlist}
                      className="text-[11px] hover:text-rose-500 transition-colors mr-2 font-medium cursor-pointer"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={closeWishlist}
                    className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                    style={{ color: "var(--theme-text-body, #64748b)" }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div 
                      className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 transition-colors"
                      style={{
                        backgroundColor: "color-mix(in srgb, #f43f5e 10%, transparent)",
                        borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                      }}
                    >
                      <Heart className="w-8 h-8 text-rose-400/60" />
                    </div>
                    <h4 
                      className="text-base font-bold mb-1"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Your wishlist is empty
                    </h4>
                    <p 
                      className="text-xs max-w-xs mb-6"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Save items you are interested in and return anytime to move them directly to your cart.
                    </p>
                  </div>
                ) : (
                  items.map((product) => {
                    const img = product.primary_image?.image_url || product.images?.[0]?.image_url;
                    const hasVariants = Boolean(product.has_options || (product.variants && product.variants.length > 1));
                    const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;

                    return (
                      <div
                        key={product.id}
                        className="flex gap-3.5 p-3 rounded-2xl border transition-all"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--theme-card-bg, #ffffff) 92%, var(--theme-bg, #f8fafc))",
                          borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.08))"
                        }}
                      >
                        {img && (
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={closeWishlist}
                            className="w-18 h-18 rounded-xl overflow-hidden border shrink-0 p-1 flex items-center justify-center transition-colors group relative"
                            style={{
                              backgroundColor: "var(--theme-card-bg, #ffffff)",
                              borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                            }}
                          >
                            <img
                              src={img}
                              alt={product.name}
                              className={`w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform ${isOutOfStock ? "grayscale" : ""}`}
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider px-1 py-0.5 bg-rose-500 rounded">
                                  Sold Out
                                </span>
                              </div>
                            )}
                          </Link>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <Link
                                href={`/products/${product.slug}`}
                                onClick={closeWishlist}
                                className="text-xs font-bold truncate hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                                style={{ color: "var(--theme-text-heading, #0f172a)" }}
                              >
                                {product.name}
                              </Link>
                              <button
                                onClick={() => toggleWishlist(product)}
                                className="hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                style={{ color: "var(--theme-text-body, #64748b)" }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span 
                              className="text-[11px]"
                              style={{ color: "var(--theme-text-body, #64748b)" }}
                            >
                              {product.brand}
                            </span>
                          </div>

                          <div 
                            className="flex items-center justify-between mt-2 pt-1 border-t"
                            style={{ borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.08))" }}
                          >
                            <span 
                              className="text-xs font-black"
                              style={{ color: "var(--theme-primary, #006B45)" }}
                            >
                              {formatPrice(product.price)}
                            </span>
                            {isOutOfStock ? (
                              <span className="text-[10px] font-bold text-rose-500 py-1 px-2.5 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
                                Sold Out
                              </span>
                            ) : hasVariants ? (
                              <Link
                                href={`/products/${product.slug}`}
                                onClick={closeWishlist}
                                className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                                style={{
                                  backgroundColor: "var(--theme-primary, #006B45)",
                                  color: "var(--theme-btn-primary-text, #ffffff)"
                                }}
                              >
                                <SlidersHorizontal className="w-3 h-3" /> Select Options
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMoveToCart(product)}
                                className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                                style={{
                                  backgroundColor: "var(--theme-primary, #006B45)",
                                  color: "var(--theme-btn-primary-text, #ffffff)"
                                }}
                              >
                                <ShoppingBag className="w-3 h-3" /> Move to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div 
                  className="p-5 border-t transition-colors"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, rgba(255, 255, 255, 0.1))"
                  }}
                >
                  <button
                    onClick={handleMoveAllToCart}
                    className="w-full py-3 rounded-md text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer shadow-xl"
                    style={{
                      background: "var(--theme-btn-primary-bg, var(--theme-primary, #292947))",
                      color: "var(--theme-btn-primary-text, #ffffff)",
                      boxShadow: "0 10px 24px -4px rgba(41, 41, 71, 0.25)"
                    }}
                  >
                    Move All to Cart <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
