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

  const mockVariantRed: ProductVariant = {
    id: 501,
    product_id: 101,
    name: "Red Switch",
    sku: "VAR-RED-501",
    price_modifier: 200,
    cost_price: 150,
    stock_quantity: 4,
    is_active: true,
  };

  const mockVariantBlue: ProductVariant = {
    id: 502,
    product_id: 101,
    name: "Blue Switch",
    sku: "VAR-BLUE-502",
    price_modifier: 300,
    cost_price: 160,
    stock_quantity: 5,
    is_active: true,
  };

  const mockVariantOOS: ProductVariant = {
    id: 503,
    product_id: 101,
    name: "Brown Switch",
    sku: "VAR-BROWN-503",
    price_modifier: 250,
    cost_price: 155,
    stock_quantity: 0,
    is_active: true,
  };

  const mockVariantInactive: ProductVariant = {
    id: 504,
    product_id: 101,
    name: "Silver Switch",
    sku: "VAR-SILVER-504",
    price_modifier: 500,
    cost_price: 200,
    stock_quantity: 10,
    is_active: false,
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe("getAvailableStock helper", () => {
    it("returns variant stock when variant is provided", () => {
      expect(getAvailableStock(mockProduct, mockVariantRed)).toBe(4);
    });

    it("falls back to product stock when variant is null", () => {
      expect(getAvailableStock(mockProduct, null)).toBe(10);
    });

    it("returns 0 if product stock is negative or null", () => {
      const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
      expect(getAvailableStock(outOfStockProduct, null)).toBe(0);
    });

    it("returns 0 if variant is inactive, even if stock_quantity is positive", () => {
      expect(getAvailableStock(mockProduct, mockVariantInactive)).toBe(0);
    });

    it("returns 0 if product is inactive, even if stock_quantity is positive", () => {
      const inactiveProduct = { ...mockProduct, is_active: false };
      expect(getAvailableStock(inactiveProduct, mockVariantRed)).toBe(0);
      expect(getAvailableStock(inactiveProduct, null)).toBe(0);
    });
  });

  describe("Cart state operations (Single Item)", () => {
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
      const result = useCartStore.getState().addItem(mockProduct, mockVariantRed, 1);
      expect(result.success).toBe(true);

      const state = useCartStore.getState();
      expect(state.items.length).toBe(1);
      expect(state.items[0].variant?.id).toBe(501);
      // Effective price should be 3500 + 200 = 3700
      expect(state.getTotal()).toBe(3700);
    });

    it("blocks adding inactive variants or out-of-stock items", () => {
      const inactiveResult = useCartStore.getState().addItem(mockProduct, mockVariantInactive, 1);
      expect(inactiveResult.success).toBe(false);
      expect(inactiveResult.reason).toBe("out_of_stock");

      const oosResult = useCartStore.getState().addItem(mockProduct, mockVariantOOS, 1);
      expect(oosResult.success).toBe(false);
      expect(oosResult.reason).toBe("out_of_stock");
    });

    it("clamps quantity to available stock when adding more than stock", () => {
      // mockVariantRed stock is 4, adding 10 should clamp to 4
      const result = useCartStore.getState().addItem(mockProduct, mockVariantRed, 10);
      expect(result.success).toBe(true);
      expect(result.addedQuantity).toBe(4);

      // Now with 4 in cart (at max stock), next add must be blocked
      const blocked = useCartStore.getState().addItem(mockProduct, mockVariantRed, 1);
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

  describe("Cart state operations (Multiple Variants - addMultipleItems)", () => {
    it("handles empty entries array safely", () => {
      const res = useCartStore.getState().addMultipleItems([]);
      expect(res.success).toBe(false);
      expect(res.totalAdded).toBe(0);
      expect(res.results.length).toBe(0);
      expect(useCartStore.getState().items.length).toBe(0);
    });

    it("safely skips entries with 0 or negative quantities", () => {
      const res = useCartStore.getState().addMultipleItems([
        { product: mockProduct, variant: mockVariantRed, quantity: 0 },
        { product: mockProduct, variant: mockVariantBlue, quantity: -2 },
      ]);
      expect(res.success).toBe(false);
      expect(res.totalAdded).toBe(0);
      expect(useCartStore.getState().items.length).toBe(0);
    });

    it("adds multiple valid variants atomically in a single interaction", () => {
      const entries = [
        { product: mockProduct, variant: mockVariantRed, quantity: 2 },
        { product: mockProduct, variant: mockVariantBlue, quantity: 3 },
      ];

      const res = useCartStore.getState().addMultipleItems(entries);
      expect(res.success).toBe(true);
      expect(res.totalAdded).toBe(5);
      expect(res.totalRequested).toBe(5);
      expect(res.partial).toBe(false);

      const state = useCartStore.getState();
      expect(state.items.length).toBe(2);
      expect(state.getItemCount()).toBe(5);

      // Verify Red switch line: 2 * (3500 + 200) = 7400
      const redLine = state.items.find((i) => i.variant?.id === 501);
      expect(redLine?.quantity).toBe(2);

      // Verify Blue switch line: 3 * (3500 + 300) = 11400
      const blueLine = state.items.find((i) => i.variant?.id === 502);
      expect(blueLine?.quantity).toBe(3);

      // Total: 7400 + 11400 = 18800
      expect(state.getTotal()).toBe(18800);
    });

    it("handles mixed in-stock and out-of-stock variants with partial success", () => {
      const entries = [
        { product: mockProduct, variant: mockVariantRed, quantity: 1 },
        { product: mockProduct, variant: mockVariantOOS, quantity: 2 },
      ];

      const res = useCartStore.getState().addMultipleItems(entries);
      expect(res.success).toBe(true);
      expect(res.partial).toBe(true);
      expect(res.totalAdded).toBe(1);

      const oosEntry = res.results.find((r) => r.variant?.id === 503);
      expect(oosEntry?.success).toBe(false);
      expect(oosEntry?.reason).toBe("out_of_stock");

      const redEntry = res.results.find((r) => r.variant?.id === 501);
      expect(redEntry?.success).toBe(true);
      expect(redEntry?.addedQuantity).toBe(1);

      expect(useCartStore.getState().items.length).toBe(1);
    });

    it("clamps individual variant quantities to remaining available stock", () => {
      // mockVariantRed has 4 total stock.
      // Already add 2 to cart
      useCartStore.getState().addItem(mockProduct, mockVariantRed, 2);

      // Attempt to add 5 more in multi-add
      const res = useCartStore.getState().addMultipleItems([
        { product: mockProduct, variant: mockVariantRed, quantity: 5 },
      ]);

      expect(res.success).toBe(true);
      expect(res.totalAdded).toBe(2); // Only 2 remaining stock

      const state = useCartStore.getState();
      const item = state.items.find((i) => i.variant?.id === 501);
      expect(item?.quantity).toBe(4); // Capped at max stock 4
    });

    it("rejects multi-add when variant is already at maximum stock in cart", () => {
      // Put all 4 in cart
      useCartStore.getState().addItem(mockProduct, mockVariantRed, 4);

      const res = useCartStore.getState().addMultipleItems([
        { product: mockProduct, variant: mockVariantRed, quantity: 1 },
      ]);

      expect(res.success).toBe(false);
      expect(res.totalAdded).toBe(0);
      expect(res.results[0].reason).toBe("stock_exceeded");
    });
  });
});
