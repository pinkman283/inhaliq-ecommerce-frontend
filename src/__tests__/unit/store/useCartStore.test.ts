import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, getAvailableStock } from "@/store/useCartStore";
import { Product, ProductVariant } from "@/types";

describe("useCartStore (Unit Tests)", () => {
  const mockProduct: Product = {
    id: 101,
    name: "Wireless Mechanical Keyboard",
    slug: "wireless-mech-kb",
    price: 3500,
    stock_quantity: 10,
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
    is_best_seller: false,
    rating_average: 5,
    review_count: 0,
    created_at: new Date().toISOString(),
  };

  const mockVariant: ProductVariant = {
    id: 501,
    product_id: 101,
    name: "Red Switch",
    sku: "VAR-RED-501",
    price_modifier: 200,
    cost_price: 150,
    stock_quantity: 4,
    is_active: true,
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe("getAvailableStock helper", () => {
    it("returns variant stock when variant is provided", () => {
      expect(getAvailableStock(mockProduct, mockVariant)).toBe(4);
    });

    it("falls back to product stock when variant is null", () => {
      expect(getAvailableStock(mockProduct, null)).toBe(10);
    });

    it("returns 0 if product stock is negative or null", () => {
      const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
      expect(getAvailableStock(outOfStockProduct, null)).toBe(0);
    });
  });

  describe("Cart state operations", () => {
    it("adds item to cart and calculates subtotal and item count", () => {
      const result = useCartStore.getState().addItem(mockProduct, null, 2);
      expect(result.success).toBe(true);

      const state = useCartStore.getState();
      expect(state.items.length).toBe(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].product.id).toBe(101);
      expect(state.getItemCount()).toBe(2);
      expect(state.getTotal()).toBe(7000); // 3500 * 2
    });

    it("applies variant price modifier when variant is added", () => {
      const result = useCartStore.getState().addItem(mockProduct, mockVariant, 1);
      expect(result.success).toBe(true);

      const state = useCartStore.getState();
      expect(state.items.length).toBe(1);
      expect(state.items[0].variant?.id).toBe(501);
      // Effective price should be 3500 + 200 = 3700
      expect(state.getTotal()).toBe(3700);
    });

    it("clamps quantity to available stock when adding more than stock", () => {
      // mockVariant stock is 4, adding 10 should clamp to 4
      const result = useCartStore.getState().addItem(mockProduct, mockVariant, 10);
      expect(result.success).toBe(true);
      expect(result.addedQuantity).toBe(4);

      // Now with 4 in cart (at max stock), next add must be blocked
      const blocked = useCartStore.getState().addItem(mockProduct, mockVariant, 1);
      expect(blocked.success).toBe(false);
      expect(blocked.reason).toBe("stock_exceeded");
    });

    it("updates quantity of existing item and recalculates total", () => {
      useCartStore.getState().addItem(mockProduct, null, 1);
      useCartStore.getState().updateQuantity(101, null, 3);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
      expect(state.getTotal()).toBe(10500); // 3500 * 3
    });

    it("removes item from cart completely", () => {
      useCartStore.getState().addItem(mockProduct, null, 1);
      useCartStore.getState().removeItem(101, null);

      const state = useCartStore.getState();
      expect(state.items.length).toBe(0);
      expect(state.getItemCount()).toBe(0);
      expect(state.getTotal()).toBe(0);
    });
  });
});
