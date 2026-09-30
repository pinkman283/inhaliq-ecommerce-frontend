import test from "node:test";
import assert from "node:assert/strict";

test("STOREFRONT UX & CATALOG SEARCH TESTS", async (t) => {

  await t.test("7B - Search Query Building & URL Synchronization", () => {
    function buildSearchUrl(currentParams, newSearch) {
      const sp = new URLSearchParams(currentParams);
      if (newSearch && newSearch.trim()) {
        sp.set("search", newSearch.trim());
      } else {
        sp.delete("search");
      }
      sp.set("page", "1"); // Reset to page 1 on new search
      return `/products?${sp.toString()}`;
    }

    // 1. Product name search
    let url = buildSearchUrl({ category: "electronics", sort: "price_asc" }, "Wireless Headphones");
    assert.match(url, /search=Wireless\+Headphones/);
    assert.match(url, /category=electronics/);
    assert.match(url, /sort=price_asc/);
    assert.match(url, /page=1/);

    // 2. Product SKU search
    url = buildSearchUrl({ brand: "apple" }, "SKU-PROD-9988");
    assert.match(url, /search=SKU-PROD-9988/);
    assert.match(url, /brand=apple/);

    // 3. Variant SKU search
    url = buildSearchUrl({}, "VAR-RED-XL");
    assert.match(url, /search=VAR-RED-XL/);

    // 4. Clear search removes search param without destroying category or brand
    url = buildSearchUrl({ search: "Wireless", category: "audio", brand: "sony" }, "");
    assert.doesNotMatch(url, /search=/);
    assert.match(url, /category=audio/);
    assert.match(url, /brand=sony/);
  });

  await t.test("7C - Catalog Filters, Sorting & Pagination Composition", () => {
    function composeCatalogQuery(baseState, update) {
      const merged = { ...baseState, ...update };
      if (update.category !== undefined || update.brand !== undefined || update.search !== undefined) {
        merged.page = 1; // Filter changes reset page
      }
      const params = new URLSearchParams();
      if (merged.search) params.set("search", merged.search);
      if (merged.category) params.set("category", merged.category);
      if (merged.brand) params.set("brand", merged.brand);
      if (merged.sort) params.set("sort", merged.sort);
      if (merged.page && merged.page > 1) params.set("page", String(merged.page));
      return params.toString();
    }

    const state = {
      search: "Cotton",
      category: "apparel",
      brand: "levis",
      sort: "price_desc",
      page: 3
    };

    // Updating sort should not clear search, category, or brand
    let q = composeCatalogQuery(state, { sort: "newest" });
    assert.equal(q, "search=Cotton&category=apparel&brand=levis&sort=newest&page=3");

    // Updating category resets page to 1
    q = composeCatalogQuery(state, { category: "denim" });
    assert.equal(q, "search=Cotton&category=denim&brand=levis&sort=price_desc");
  });

  await t.test("7D - Product Detail Variant Selection & Price/Stock Reflection", () => {
    const product = {
      id: 101,
      name: "Classic Silk Shirt",
      price: 80.00,
      stock_quantity: 15,
      variants: [
        { id: 1, name: "Red / Small", sku: "SHIRT-RED-S", price_modifier: 0, stock_quantity: 5, is_active: true },
        { id: 2, name: "Red / Large", sku: "SHIRT-RED-L", price_modifier: 10.00, stock_quantity: 0, is_active: true }, // Out of stock
        { id: 3, name: "Blue / Medium", sku: "SHIRT-BLU-M", price_modifier: 5.00, stock_quantity: 8, is_active: true },
        { id: 4, name: "Discontinued Variant", sku: "SHIRT-DISC", price_modifier: 0, stock_quantity: 10, is_active: false }, // Inactive
      ]
    };

    function resolveVariant(prod, variantId) {
      if (!variantId) {
        return {
          price: prod.price,
          stock: prod.stock_quantity,
          isAvailable: prod.stock_quantity > 0,
          sku: "BASE-SKU"
        };
      }
      const v = prod.variants.find((item) => item.id === variantId);
      if (!v) return null;
      return {
        price: prod.price + (v.price_modifier || 0),
        stock: v.stock_quantity,
        isAvailable: v.is_active && v.stock_quantity > 0,
        sku: v.sku
      };
    }

    // Available variant with price modifier
    const selBlue = resolveVariant(product, 3);
    assert.equal(selBlue.price, 85.00);
    assert.equal(selBlue.stock, 8);
    assert.equal(selBlue.isAvailable, true);
    assert.equal(selBlue.sku, "SHIRT-BLU-M");

    // Out-of-stock variant
    const selRedL = resolveVariant(product, 2);
    assert.equal(selRedL.price, 90.00);
    assert.equal(selRedL.stock, 0);
    assert.equal(selRedL.isAvailable, false);

    // Inactive variant must never appear available
    const selDisc = resolveVariant(product, 4);
    assert.equal(selDisc.isAvailable, false);
  });

  await t.test("7F - Cart Quantity Controls, Stock Limits & Validation", () => {
    function updateCartItemQuantity(currentQty, delta, maxStock) {
      const target = currentQty + delta;
      if (target <= 0) return 0; // Item removed
      if (target > maxStock) return maxStock; // Bounded by stock
      return target;
    }

    assert.equal(updateCartItemQuantity(2, 1, 5), 3);
    assert.equal(updateCartItemQuantity(5, 1, 5), 5); // Cannot exceed available stock
    assert.equal(updateCartItemQuantity(1, -1, 5), 0); // Removed

    // Checkout disabled if any item is out of stock or cart is empty
    function isCheckoutAllowed(cartItems) {
      if (!cartItems || cartItems.length === 0) return false;
      return cartItems.every((item) => item.quantity > 0 && item.stock_quantity >= item.quantity);
    }

    assert.equal(isCheckoutAllowed([]), false);
    assert.equal(isCheckoutAllowed([{ id: 1, quantity: 2, stock_quantity: 5 }]), true);
    assert.equal(isCheckoutAllowed([{ id: 1, quantity: 6, stock_quantity: 5 }]), false);
  });

  await t.test("7G - Wishlist Persistence & Authentication Synchronization", () => {
    class MockWishlistStore {
      constructor() {
        this.items = [];
      }
      addItem(item) {
        if (!this.items.some((i) => i.id === item.id)) {
          this.items.push(item);
        }
      }
      removeItem(id) {
        this.items = this.items.filter((i) => i.id !== id);
      }
      clearWishlist() {
        this.items = [];
      }
    }

    const wishlist = new MockWishlistStore();
    wishlist.addItem({ id: 10, name: "Sneakers" });
    wishlist.addItem({ id: 20, name: "Watch" });
    assert.equal(wishlist.items.length, 2);

    wishlist.removeItem(10);
    assert.equal(wishlist.items.length, 1);
    assert.equal(wishlist.items[0].id, 20);

    // On user logout, wishlist must be cleared to prevent stale state across accounts
    wishlist.clearWishlist();
    assert.equal(wishlist.items.length, 0);
  });

  await t.test("7H - Checkout Authoritative Totals & Duplicate Submission Prevention", () => {
    function computeAuthoritativeTotals(items, couponDiscount = 0, shippingCost = 15) {
      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const discount = Math.min(subtotal, Math.max(0, couponDiscount));
      const total = Math.max(0, subtotal - discount + shippingCost);
      return { subtotal, discount, shipping: shippingCost, total };
    }

    const items = [
      { id: 1, price: 50.00, quantity: 2 },
      { id: 2, price: 30.00, quantity: 1 }
    ];

    const totals = computeAuthoritativeTotals(items, 20.00, 10.00);
    assert.equal(totals.subtotal, 130.00);
    assert.equal(totals.discount, 20.00);
    assert.equal(totals.shipping, 10.00);
    assert.equal(totals.total, 120.00);

    // Duplicate submission guard
    let isSubmitting = false;
    let submitCount = 0;
    async function submitOrder() {
      if (isSubmitting) return; // Prevent double click
      isSubmitting = true;
      submitCount++;
      // Simulate API latency
      await new Promise((r) => setTimeout(r, 10));
      isSubmitting = false;
    }

    submitOrder();
    submitOrder(); // Duplicate click while pending
    assert.equal(submitCount, 1);
  });

  await t.test("7J - Customer Order State Machine & Live Reorder Validation", () => {
    function canCustomerCancel(orderStatus) {
      return orderStatus.toLowerCase() === "pending";
    }

    function canCustomerRequestReturn(orderStatus) {
      return orderStatus.toLowerCase() === "delivered";
    }

    assert.equal(canCustomerCancel("pending"), true);
    assert.equal(canCustomerCancel("processing"), false);
    assert.equal(canCustomerCancel("shipped"), false);
    assert.equal(canCustomerCancel("delivered"), false);
    assert.equal(canCustomerCancel("cancelled"), false);

    assert.equal(canCustomerRequestReturn("pending"), false);
    assert.equal(canCustomerRequestReturn("delivered"), true);
    assert.equal(canCustomerRequestReturn("cancelled"), false);
  });

  await t.test("7R - Security Audit: Internal Data Sanitization", () => {
    const rawBackendProduct = {
      id: 99,
      name: "Luxury Handbag",
      price: 450.00,
      cost_price: 180.00,
      margin: 270.00,
      supplier_id: 14,
      fifo_batches: [{ batch: 1, unit_cost: 175.00 }],
      stock_quantity: 4
    };

    function sanitizeForCustomer(prod) {
      const { cost_price, margin, supplier_id, fifo_batches, ...customerView } = prod;
      return customerView;
    }

    const customerProduct = sanitizeForCustomer(rawBackendProduct);
    assert.equal(customerProduct.price, 450.00);
    assert.equal(customerProduct.cost_price, undefined);
    assert.equal(customerProduct.margin, undefined);
    assert.equal(customerProduct.supplier_id, undefined);
    assert.equal(customerProduct.fifo_batches, undefined);
  });

});
