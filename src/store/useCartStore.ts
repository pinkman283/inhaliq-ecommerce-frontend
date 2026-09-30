import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, CartValidationItem, CartValidationResponse, CouponValidation, Product, ProductVariant, PromotionEvaluationResult } from "@/types";
import { api } from "@/lib/api";

/**
 * Authoritatively resolve available stock for a product or variant from available data.
 */
export function getAvailableStock(product: Product, variant?: ProductVariant | null): number {
  if (variant && variant.stock_quantity !== undefined && variant.stock_quantity !== null) {
    return Math.max(0, Number(variant.stock_quantity));
  }
  if (product && product.stock_quantity !== undefined && product.stock_quantity !== null) {
    return Math.max(0, Number(product.stock_quantity));
  }
  return 0;
}

export interface AddItemResult {
  success: boolean;
  message: string;
  reason?: "out_of_stock" | "stock_exceeded" | "invalid_product";
  availableStock?: number;
  addedQuantity?: number;
  currentQuantity?: number;
}

export interface UpdateQuantityResult {
  success: boolean;
  message?: string;
  adjusted?: boolean;
  availableStock?: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  appliedCoupon: CouponValidation | null;
  promotionEvaluation: PromotionEvaluationResult | null;
  useStoreCredit: boolean;
  validationNotices: string[];
  isValidating: boolean;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => AddItemResult;
  removeItem: (productId: number, variantId?: number | null) => void;
  updateQuantity: (productId: number, variantId: number | null | undefined, quantity: number) => UpdateQuantityResult;
  clearCart: () => void;
  applyCoupon: (coupon: CouponValidation) => void;
  removeCoupon: () => void;
  setPromotionEvaluation: (evalResult: PromotionEvaluationResult | null) => void;
  setUseStoreCredit: (val: boolean) => void;
  dismissNotices: () => void;
  validateCartWithServer: () => Promise<CartValidationResponse | null>;
  mergeWithServerCart: () => Promise<void>;
  fetchServerCart: () => Promise<void>;

  // Computed getters
  getSubtotal: () => number;
  getDiscount: () => number;
  getShipping: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  hasInvalidItems: () => boolean;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function syncServerCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(async () => {
    try {
      const payload = items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          quantity: item.quantity,
        }));
      await api.syncCustomerCart(payload);
    } catch (e) {
      console.warn("Server cart sync error:", e);
    }
  }, 400);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      appliedCoupon: null,
      promotionEvaluation: null,
      useStoreCredit: false,
      validationNotices: [],
      isValidating: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addItem: (product: Product, variant: ProductVariant | null = null, quantity = 1): AddItemResult => {
        if (!product || typeof product.id !== "number") {
          return { success: false, message: "Invalid product information.", reason: "invalid_product" };
        }

        const requestedQty = Math.max(1, Math.floor(quantity));
        const availableStock = getAvailableStock(product, variant);

        if (availableStock <= 0) {
          return {
            success: false,
            message: `${product.name} is currently out of stock.`,
            reason: "out_of_stock",
            availableStock: 0,
            currentQuantity: 0,
          };
        }

        const { items } = get();
        const existingIndex = items.findIndex(
          (item) => item.product?.id === product.id && (item.variant?.id ?? null) === (variant?.id ?? null)
        );
        const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;

        if (currentQty >= availableStock) {
          return {
            success: false,
            message: `You already have the maximum available stock (${availableStock}) in your cart.`,
            reason: "stock_exceeded",
            availableStock,
            currentQuantity: currentQty,
          };
        }

        const maxCanAdd = availableStock - currentQty;
        const actualToAdd = Math.min(requestedQty, maxCanAdd);
        const newTotalQty = currentQty + actualToAdd;

        if (existingIndex > -1) {
          const updated = [...items];
          updated[existingIndex] = {
            ...updated[existingIndex],
            product,
            variant: variant ?? null,
            quantity: newTotalQty,
            availableStock,
            validationStatus: "valid",
            validationMessage: null,
          };
          set({ items: updated, isCartOpen: true });
          syncServerCart(updated);
        } else {
          const newItems = [
            ...items,
            {
              product,
              variant: variant ?? null,
              quantity: actualToAdd,
              selectedColor: variant?.color_name,
              selectedSize: variant?.size,
              availableStock,
              validationStatus: "valid" as const,
              validationMessage: null,
            },
          ];
          set({ items: newItems, isCartOpen: true });
          syncServerCart(newItems);
        }

        if (actualToAdd < requestedQty) {
          return {
            success: true,
            message: `Added ${actualToAdd} item(s). Reached maximum available stock (${availableStock}).`,
            availableStock,
            addedQuantity: actualToAdd,
            currentQuantity: newTotalQty,
          };
        }

        return {
          success: true,
          message: `Added ${actualToAdd} item(s) to cart.`,
          availableStock,
          addedQuantity: actualToAdd,
          currentQuantity: newTotalQty,
        };
      },

      removeItem: (productId: number, variantId: number | null = null) => {
        set((state) => {
          const filtered = state.items.filter(
            (item) => !(item.product?.id === productId && (item.variant?.id ?? null) === (variantId ?? null))
          );
          syncServerCart(filtered);
          return { items: filtered };
        });
      },

      updateQuantity: (productId: number, variantId: number | null = null, quantity: number): UpdateQuantityResult => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return { success: true, quantity: 0 };
        }

        const { items } = get();
        const existingItem = items.find(
          (item) => item.product?.id === productId && (item.variant?.id ?? null) === (variantId ?? null)
        );

        if (!existingItem) {
          return { success: false, quantity: 0 };
        }

        const availableStock = getAvailableStock(existingItem.product, existingItem.variant);
        const targetQty = Math.floor(quantity);

        if (targetQty > availableStock) {
          const cappedQty = Math.max(0, availableStock);
          set((state) => ({
            items: state.items.map((item) => {
              if (item.product?.id === productId && (item.variant?.id ?? null) === (variantId ?? null)) {
                return {
                  ...item,
                  quantity: cappedQty,
                  availableStock,
                  validationStatus: cappedQty === 0 ? "out_of_stock" : "quantity_adjusted",
                  validationMessage: `Adjusted to maximum available stock (${cappedQty}).`,
                };
              }
              return item;
            }),
          }));

          return {
            success: false,
            adjusted: true,
            availableStock,
            quantity: cappedQty,
            message: `Only ${availableStock} unit(s) available in stock. Quantity adjusted to ${cappedQty}.`,
          };
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.product?.id === productId && (item.variant?.id ?? null) === (variantId ?? null)) {
              return {
                ...item,
                quantity: targetQty,
                availableStock,
                validationStatus: "valid",
                validationMessage: null,
              };
            }
            return item;
          }),
        }));

        const finalItems = get().items;
        syncServerCart(finalItems);
        return { success: true, quantity: targetQty, availableStock };
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, promotionEvaluation: null, validationNotices: [] });
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token) {
            api.clearCustomerCart().catch(() => {});
          }
        }
      },

      applyCoupon: (coupon: CouponValidation) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null, promotionEvaluation: null }),
      setPromotionEvaluation: (evalResult: PromotionEvaluationResult | null) => set({ promotionEvaluation: evalResult }),
      setUseStoreCredit: (val: boolean) => set({ useStoreCredit: val }),
      dismissNotices: () => set({ validationNotices: [] }),

      validateCartWithServer: async (): Promise<CartValidationResponse | null> => {
        const { items, isValidating, appliedCoupon } = get();
        if (isValidating || items.length === 0) return null;

        set({ isValidating: true });
        try {
          const payload = items.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant?.id ?? null,
            quantity: item.quantity,
            price: Number(item.product.price) + (item.variant ? Number(item.variant.price_modifier) : 0),
          }));

          const response = await api.validateCart(payload, appliedCoupon?.code);

          const evaluatedMap = new Map<string, CartValidationItem>();
          response.items.forEach((ei) => {
            const key = `${ei.product_id}-${ei.variant_id ?? "none"}`;
            evaluatedMap.set(key, ei);
          });

          const updatedItems: CartItem[] = [];
          for (const item of items) {
            const key = `${item.product.id}-${item.variant?.id ?? "none"}`;
            const evalItem = evaluatedMap.get(key);

            if (!evalItem) {
              updatedItems.push(item);
              continue;
            }

            // Product or variant missing / mismatch
            if (
              evalItem.status === "product_not_found" ||
              evalItem.status === "variant_not_found" ||
              evalItem.status === "variant_mismatch"
            ) {
              updatedItems.push({
                ...item,
                quantity: 0,
                availableStock: 0,
                validationStatus: evalItem.status,
                validationMessage: evalItem.message,
              });
              continue;
            }

            // Inactive product
            if (evalItem.status === "inactive") {
              updatedItems.push({
                ...item,
                product: evalItem.product || item.product,
                availableStock: 0,
                validationStatus: "inactive",
                validationMessage: evalItem.message,
              });
              continue;
            }

            // Out of stock
            if (evalItem.status === "out_of_stock") {
              updatedItems.push({
                ...item,
                product: evalItem.product || item.product,
                variant: evalItem.variant || item.variant,
                availableStock: 0,
                validationStatus: "out_of_stock",
                validationMessage: evalItem.message,
              });
              continue;
            }

            // Valid / Quantity adjusted / Price changed
            const freshProduct = evalItem.product ? { ...item.product, ...evalItem.product } : item.product;
            const freshVariant = evalItem.variant && item.variant ? { ...item.variant, ...evalItem.variant } : item.variant;

            updatedItems.push({
              ...item,
              product: freshProduct,
              variant: freshVariant,
              quantity: evalItem.normalized_quantity,
              availableStock: evalItem.available_stock,
              validationStatus: evalItem.status,
              validationMessage: evalItem.price_changed
                ? `Price updated from $${evalItem.original_client_price?.toFixed(2)} to $${evalItem.unit_price.toFixed(2)}`
                : (evalItem.status === "quantity_adjusted" ? evalItem.message : null),
            });
          }

          let nextAppliedCoupon = appliedCoupon;
          if (response.coupon !== undefined) {
            if (response.coupon && response.coupon.valid) {
              nextAppliedCoupon = {
                valid: true,
                code: response.coupon.code || appliedCoupon?.code || "",
                discount_type: response.coupon.type || appliedCoupon?.discount_type || "percentage",
                value: response.coupon.discount_amount,
                discount_amount: response.coupon.discount_amount,
                message: response.coupon.message || "Promo applied",
              };
            } else {
              nextAppliedCoupon = null;
            }
          }

          set({
            items: updatedItems,
            appliedCoupon: nextAppliedCoupon,
            validationNotices: response.summary?.notices || [],
            isValidating: false,
          });

          return response;
        } catch (error) {
          console.warn("Cart validation notice:", error);
          set({ isValidating: false });
          return null;
        }
      },

      mergeWithServerCart: async () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        set({ isValidating: true });
        try {
          const guestPayload = get().items.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant?.id ?? null,
            quantity: item.quantity,
          }));

          const res = await api.mergeCustomerCart(guestPayload);
          if (res?.items) {
            const mergedItems: CartItem[] = res.items.map((item) => ({
              product: item.product,
              variant: item.variant ?? null,
              quantity: item.quantity,
              selectedColor: item.variant?.color_name,
              selectedSize: item.variant?.size,
              availableStock: item.available_stock,
              validationStatus: "valid" as const,
              validationMessage: null,
            }));

            set({
              items: mergedItems,
              validationNotices: res.summary?.notices || [],
              isValidating: false,
            });
          }
        } catch (error) {
          console.warn("Failed to merge cart with server:", error);
          set({ isValidating: false });
        }
      },

      fetchServerCart: async () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        set({ isValidating: true });
        try {
          const res = await api.getCustomerCart();
          if (res?.items) {
            const serverItems: CartItem[] = res.items.map((item) => ({
              product: item.product,
              variant: item.variant ?? null,
              quantity: item.quantity,
              selectedColor: item.variant?.color_name,
              selectedSize: item.variant?.size,
              availableStock: item.available_stock,
              validationStatus: "valid" as const,
              validationMessage: null,
            }));

            set({
              items: serverItems,
              validationNotices: res.summary?.notices || [],
              isValidating: false,
            });
          }
        } catch (error) {
          console.warn("Failed to fetch server cart:", error);
          set({ isValidating: false });
        }
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((acc, item) => {
          // Do not count invalid or 0-quantity items in subtotal
          if (item.quantity <= 0 || item.validationStatus === "product_not_found" || item.validationStatus === "inactive") {
            return acc;
          }
          const price = Number(item.product.price) + (item.variant ? Number(item.variant.price_modifier) : 0);
          return acc + price * item.quantity;
        }, 0);
      },

      getDiscount: () => {
        const { promotionEvaluation, appliedCoupon } = get();
        if (promotionEvaluation?.valid) {
          return Number(promotionEvaluation.total_discount || 0);
        }
        if (!appliedCoupon || !appliedCoupon.valid) return 0;
        return appliedCoupon.discount_amount ?? 0;
      },

      getShipping: () => {
        const { promotionEvaluation } = get();
        if (promotionEvaluation?.valid && typeof promotionEvaluation.shipping_amount === "number") {
          return Number(promotionEvaluation.shipping_amount);
        }
        return 0;
      },

      getTax: () => {
        const { promotionEvaluation } = get();
        if (promotionEvaluation?.valid && typeof promotionEvaluation.tax_amount === "number") {
          return Number(promotionEvaluation.tax_amount);
        }
        return 0;
      },

      getTotal: () => {
        const { promotionEvaluation } = get();
        if (promotionEvaluation?.valid && typeof promotionEvaluation.grand_total === "number") {
          return Number(promotionEvaluation.grand_total);
        }
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().getShipping();
        const tax = get().getTax();
        return Math.max(0, subtotal - discount) + shipping + tax;
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((acc, item) => {
          if (item.quantity <= 0 || item.validationStatus === "product_not_found" || item.validationStatus === "inactive") {
            return acc;
          }
          return acc + item.quantity;
        }, 0);
      },

      hasInvalidItems: () => {
        const { items } = get();
        return items.some((item) =>
          item.quantity <= 0 ||
          (item.availableStock !== undefined && item.quantity > item.availableStock) ||
          item.validationStatus === "inactive" ||
          item.validationStatus === "out_of_stock" ||
          item.validationStatus === "product_not_found" ||
          item.validationStatus === "variant_not_found" ||
          item.validationStatus === "variant_mismatch"
        );
      },
    }),
    {
      name: "ecom_cart_storage_v1",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        const g = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : null;
        if (g && typeof g.localStorage === "object" && g.localStorage !== null) {
          return g.localStorage as Storage;
        }
        const memoryStore = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStore.get(key) ?? null,
          setItem: (key: string, val: string) => {
            memoryStore.set(key, String(val));
          },
          removeItem: (key: string) => {
            memoryStore.delete(key);
          },
          clear: () => {
            memoryStore.clear();
          },
          key: () => null,
          length: 0,
        } as Storage;
      }),
      partialize: (state) => ({ items: state.items, appliedCoupon: state.appliedCoupon }),
      onRehydrateStorage: () => (state) => {
        if (!state || !Array.isArray(state.items)) return;
        // Defensive sanitization: purge corrupted or malformed localStorage records
        state.items = state.items
          .filter((item) => {
            if (!item || typeof item !== "object") return false;
            if (!item.product || typeof item.product !== "object") return false;
            if (typeof item.product.id !== "number" || isNaN(item.product.id)) return false;
            if (typeof item.quantity !== "number" || isNaN(item.quantity) || item.quantity <= 0) return false;
            return true;
          })
          .map((item) => ({
            ...item,
            quantity: Math.floor(item.quantity),
            availableStock: getAvailableStock(item.product, item.variant),
          }));
      },
    }
  )
);
