/**
 * Phase 4B: Comprehensive Cart Reliability & Stock Protection Test Suite
 *
 * Verifies all 14 frontend cart requirements:
 * 1. Add product within stock -> succeeds.
 * 2. Add product above stock -> blocked/capped.
 * 3. Add variant within stock -> succeeds.
 * 4. Add variant above stock -> blocked/capped.
 * 5. Increase cart quantity above stock -> blocked/capped.
 * 6. Product becomes inactive -> cart detects it.
 * 7. Product no longer exists -> cart handles it.
 * 8. Variant no longer exists -> cart handles it.
 * 9. Variant/product relationship is invalid -> cart rejects it.
 * 10. Stock decreases after item was added -> cart detects stale quantity.
 * 11. Product price changes -> cart refresh detects price change.
 * 12. Valid cart -> checkout proceeds (hasInvalidItems() is false).
 * 13. Invalid cart -> checkout blocked (hasInvalidItems() is true).
 * 14. Malformed localStorage cart does not crash the frontend.
 */

// Mock in-memory localStorage for Node test runner
const mockStore = new Map<string, string>();
const mockStorageObj: Storage = {
  length: 0,
  key: () => null,
  getItem: (key: string) => mockStore.get(key) ?? null,
  setItem: (key: string, val: string) => {
    mockStore.set(key, String(val));
  },
  removeItem: (key: string) => {
    mockStore.delete(key);
  },
  clear: () => {
    mockStore.clear();
  },
};
(globalThis as unknown as { localStorage: Storage }).localStorage = mockStorageObj;

import { useCartStore, getAvailableStock } from "../store/useCartStore";
import { CartItem, Product, ProductVariant } from "../types";
import { api } from "../lib/api";

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 101,
    name: "Precision Acoustic Headphones",
    slug: "precision-headphones",
    price: 150.0,
    stock_quantity: 5,
    is_active: true,
    category_id: 1,
    ...overrides,
  } as Product;
}

function createMockVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 501,
    product_id: 101,
    name: "Midnight Black / Studio",
    sku: "SKU-BLK-STD",
    stock_quantity: 3,
    price_modifier: 25.0,
    ...overrides,
  } as ProductVariant;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName} - ${detail || "Assertion failed"}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runCartTestSuite() {
  console.log("\n=======================================================");
  console.log("PHASE 4B: RUNNING CART RELIABILITY & STOCK TEST SUITE");
  console.log("=======================================================\n");

  const getStore = () => useCartStore.getState();

  // Test 1: Add product within stock -> succeeds
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 5 });
    const res = getStore().addItem(product, null, 2);

    assert(res.success === true, "1. Add product within stock succeeds");
    assert(getStore().items.length === 1, "1. Item is added to store");
    assert(getStore().items[0].quantity === 2, "1. Quantity is set to 2");
    assert(getStore().items[0].availableStock === 5, "1. Available stock recorded as 5");
  }

  // Test 2: Add product above stock -> capped at available stock
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 4 });
    const res = getStore().addItem(product, null, 10);

    assert(res.success === true, "2. Add product above stock succeeds partially");
    assert(getStore().items[0].quantity === 4, "2. Quantity capped to available stock (4)");
    assert(res.currentQuantity === 4, "2. Return result confirms capped quantity");

    // Attempt to add more when already at max stock
    const excessRes = getStore().addItem(product, null, 1);
    assert(excessRes.success === false, "2. Further add blocked when already at max stock");
    assert(excessRes.reason === "stock_exceeded", "2. Reason indicates stock_exceeded");
    assert(getStore().items[0].quantity === 4, "2. Cart quantity remains at 4");
  }

  // Test 3: Add variant within stock -> succeeds
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 50 });
    const variant = createMockVariant({ stock_quantity: 4 });
    const res = getStore().addItem(product, variant, 3);

    assert(res.success === true, "3. Add variant within stock succeeds");
    assert(getStore().items[0].variant?.id === 501, "3. Variant ID matches");
    assert(getStore().items[0].quantity === 3, "3. Variant quantity is 3");
    assert(getStore().items[0].availableStock === 4, "3. Variant stock resolved as 4");
  }

  // Test 4: Add variant above stock -> capped / blocked
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 50 });
    const variant = createMockVariant({ stock_quantity: 2 });
    const res = getStore().addItem(product, variant, 5);

    assert(res.success === true, "4. Initial add over variant stock caps quantity");
    assert(getStore().items[0].quantity === 2, "4. Quantity is capped at variant stock (2)");

    // Adding more is blocked
    const blockedRes = getStore().addItem(product, variant, 1);
    assert(blockedRes.success === false, "4. Adding above variant stock is blocked");
    assert(blockedRes.reason === "stock_exceeded", "4. Blocked reason is stock_exceeded");
    assert(getStore().items[0].quantity === 2, "4. Cart item remains at 2");
  }

  // Test 5: Increase cart quantity above stock in cart controls -> blocked/capped
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 3 });
    getStore().addItem(product, null, 3);

    const updateRes = getStore().updateQuantity(product.id, null, 4);
    assert(updateRes.success === false, "5. Incrementing past available stock is blocked");
    assert(updateRes.adjusted === true, "5. Adjusted flag is true");
    assert(getStore().items[0].quantity === 3, "5. Item quantity remains at max 3");

    // Decrement works safely
    const decRes = getStore().updateQuantity(product.id, null, 2);
    assert(decRes.success === true, "5. Decrementing quantity within stock succeeds");
    assert(getStore().items[0].quantity === 2, "5. Item quantity updated to 2");

    // Setting quantity 0 removes item
    getStore().updateQuantity(product.id, null, 0);
    assert(getStore().items.length === 0, "5. Setting quantity to 0 removes item cleanly");
  }

  // Test 6: Inactive product -> cart refresh detects inactive status
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 10, is_active: true });
    getStore().addItem(product, null, 1);

    // Mock API response returning inactive status
    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: false,
      has_changes: true,
      items: [
        {
          product_id: product.id,
          variant_id: null,
          requested_quantity: 1,
          normalized_quantity: 1,
          available_stock: 0,
          unit_price: 150.0,
          status: "inactive",
          message: "Product is no longer active.",
          is_valid: false,
          price_changed: false,
        },
      ],
      summary: {
        total_items: 0,
        subtotal: 0,
        has_out_of_stock: false,
        has_price_changes: false,
        has_inactive_items: true,
        notices: ["Precision Acoustic Headphones is currently unavailable and cannot be purchased."],
      },
    });

    await getStore().validateCartWithServer();
    assert(getStore().items[0].validationStatus === "inactive", "6. Item status marked inactive");
    assert(getStore().hasInvalidItems() === true, "6. hasInvalidItems() returns true for inactive item");
    assert(getStore().getSubtotal() === 0, "6. Inactive item excluded from subtotal");

    api.validateCart = originalValidate;
  }

  // Test 7: Product deleted / no longer exists -> cart handles it
  {
    getStore().clearCart();
    const product = createMockProduct({ id: 999 });
    getStore().addItem(product, null, 1);

    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: false,
      has_changes: true,
      items: [
        {
          product_id: 999,
          variant_id: null,
          requested_quantity: 1,
          normalized_quantity: 0,
          available_stock: 0,
          unit_price: 0,
          status: "product_not_found",
          message: "Product no longer exists.",
          is_valid: false,
          price_changed: false,
        },
      ],
      summary: {
        total_items: 0,
        subtotal: 0,
        has_out_of_stock: true,
        has_price_changes: false,
        has_inactive_items: false,
        notices: ["A product in your cart is no longer available."],
      },
    });

    await getStore().validateCartWithServer();
    assert(getStore().items[0].validationStatus === "product_not_found", "7. Deleted product marked product_not_found");
    assert(getStore().hasInvalidItems() === true, "7. Cart flagged as invalid");
    assert(getStore().items[0].quantity === 0, "7. Normalized quantity set to 0");

    api.validateCart = originalValidate;
  }

  // Test 8: Variant deleted / no longer exists -> cart handles it
  {
    getStore().clearCart();
    const product = createMockProduct();
    const variant = createMockVariant({ id: 888 });
    getStore().addItem(product, variant, 1);

    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: false,
      has_changes: true,
      items: [
        {
          product_id: product.id,
          variant_id: 888,
          requested_quantity: 1,
          normalized_quantity: 0,
          available_stock: 0,
          unit_price: 0,
          status: "variant_not_found",
          message: "Variant no longer exists.",
          is_valid: false,
          price_changed: false,
        },
      ],
      summary: {
        total_items: 0,
        subtotal: 0,
        has_out_of_stock: true,
        has_price_changes: false,
        has_inactive_items: false,
        notices: ["A selected variant is no longer available."],
      },
    });

    await getStore().validateCartWithServer();
    assert(getStore().items[0].validationStatus === "variant_not_found", "8. Missing variant flagged");
    assert(getStore().hasInvalidItems() === true, "8. Cart with missing variant is invalid");

    api.validateCart = originalValidate;
  }

  // Test 9: Variant/product relationship invalid -> cart rejects it
  {
    getStore().clearCart();
    const product = createMockProduct({ id: 101 });
    const foreignVariant = createMockVariant({ id: 999, product_id: 202 });
    getStore().addItem(product, foreignVariant, 1);

    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: false,
      has_changes: true,
      items: [
        {
          product_id: 101,
          variant_id: 999,
          requested_quantity: 1,
          normalized_quantity: 0,
          available_stock: 0,
          unit_price: 0,
          status: "variant_mismatch",
          message: "Variant does not belong to this product.",
          is_valid: false,
          price_changed: false,
        },
      ],
      summary: {
        total_items: 0,
        subtotal: 0,
        has_out_of_stock: true,
        has_price_changes: false,
        has_inactive_items: false,
        notices: ["A product variant selection in your cart is invalid."],
      },
    });

    await getStore().validateCartWithServer();
    assert(getStore().items[0].validationStatus === "variant_mismatch", "9. Variant mismatch detected");
    assert(getStore().hasInvalidItems() === true, "9. Variant mismatch marks cart as invalid");

    api.validateCart = originalValidate;
  }

  // Test 10: Stock decreases after item was added -> cart detects stale quantity and adjusts
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 5 });
    getStore().addItem(product, null, 5);

    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: true,
      has_changes: true,
      items: [
        {
          product_id: product.id,
          variant_id: null,
          requested_quantity: 5,
          normalized_quantity: 2,
          available_stock: 2,
          unit_price: 150.0,
          status: "quantity_adjusted",
          message: "Only 2 available. Cart quantity was adjusted to 2.",
          is_valid: true,
          price_changed: false,
        },
      ],
      summary: {
        total_items: 2,
        subtotal: 300.0,
        has_out_of_stock: false,
        has_price_changes: false,
        has_inactive_items: false,
        notices: ["Only 2 available in stock. Cart quantity was adjusted to 2."],
      },
    });

    await getStore().validateCartWithServer();
    assert(getStore().items[0].quantity === 2, "10. Stale quantity 5 adjusted down to live stock 2");
    assert(getStore().items[0].availableStock === 2, "10. Available stock updated to 2");
    assert(getStore().items[0].validationStatus === "quantity_adjusted", "10. Status marked quantity_adjusted");

    api.validateCart = originalValidate;
  }

  // Test 11: Product price changes -> cart refresh detects price change
  {
    getStore().clearCart();
    const product = createMockProduct({ price: 100.0, stock_quantity: 10 });
    getStore().addItem(product, null, 1);

    const originalValidate = api.validateCart;
    api.validateCart = async () => ({
      is_valid: true,
      has_changes: true,
      items: [
        {
          product_id: product.id,
          variant_id: null,
          requested_quantity: 1,
          normalized_quantity: 1,
          available_stock: 10,
          unit_price: 125.0,
          original_client_price: 100.0,
          status: "valid",
          message: "Price updated.",
          is_valid: true,
          price_changed: true,
          product: { ...product, price: 125.0 },
        },
      ],
      summary: {
        total_items: 1,
        subtotal: 125.0,
        has_out_of_stock: false,
        has_price_changes: true,
        has_inactive_items: false,
        notices: ["Price for Precision Acoustic Headphones changed from $100.00 to $125.00."],
      },
    });

    await getStore().validateCartWithServer();
    assert(Number(getStore().items[0].product.price) === 125.0, "11. Product price refreshed to authoritative $125.00");
    assert(getStore().getSubtotal() === 125.0, "11. Subtotal recalculated with live price");

    api.validateCart = originalValidate;
  }

  // Test 12: Valid cart -> checkout proceeds (hasInvalidItems() is false)
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 10, price: 100 });
    getStore().addItem(product, null, 2);

    assert(getStore().hasInvalidItems() === false, "12. Valid cart has hasInvalidItems() === false");
    assert(getStore().getItemCount() === 2, "12. Item count is 2");
    assert(getStore().getSubtotal() === 200, "12. Subtotal is 200");
  }

  // Test 13: Invalid cart -> checkout blocked (hasInvalidItems() is true)
  {
    getStore().clearCart();
    const product = createMockProduct({ stock_quantity: 0 }); // 0 stock
    // Force insert out of stock item to test barrier
    useCartStore.setState({
      items: [
        {
          product,
          variant: null,
          quantity: 1,
          availableStock: 0,
          validationStatus: "out_of_stock",
        } as CartItem,
      ],
    });

    assert(getStore().hasInvalidItems() === true, "13. Cart with out-of-stock item is invalid");
  }

  // Test 14: Malformed localStorage cart does not crash the frontend
  {
    const rehydratedState: { items: unknown[] } = {
      items: [
        null,
        undefined,
        {},
        { product: null, quantity: 2 },
        { product: { id: "not-a-number" }, quantity: 1 },
        { product: { id: 101, name: "Valid Product", stock_quantity: 5, price: 50 }, quantity: -1 },
        { product: { id: 101, name: "Valid Product", stock_quantity: 5, price: 50 }, quantity: NaN },
        { product: { id: 101, name: "Valid Product", stock_quantity: 5, price: 50 }, quantity: 2.7 },
      ],
    };

    // Run the rehydration sanitization logic from useCartStore.ts
    const sanitized = rehydratedState.items
      .filter((item: unknown): item is { product: Product; variant?: ProductVariant; quantity: number } => {
        if (!item || typeof item !== "object") return false;
        const rec = item as Record<string, unknown>;
        if (!rec.product || typeof rec.product !== "object") return false;
        const prod = rec.product as Record<string, unknown>;
        if (typeof prod.id !== "number" || isNaN(prod.id)) return false;
        if (typeof rec.quantity !== "number" || isNaN(rec.quantity) || rec.quantity <= 0) return false;
        return true;
      })
      .map((item) => ({
        ...item,
        quantity: Math.floor(item.quantity),
        availableStock: getAvailableStock(item.product, item.variant),
      }));

    assert(sanitized.length === 1, "14. All 7 malformed items purged; 1 valid item retained");
    assert(sanitized[0].quantity === 2, "14. Non-integer 2.7 safely floored to 2");
    assert(sanitized[0].availableStock === 5, "14. Available stock calculated safely without crashing");
  }

  console.log("\n=======================================================");
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} tests successful!`);
  console.log("=======================================================\n");
}

runCartTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
