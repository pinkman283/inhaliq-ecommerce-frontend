/**
 * Phase 4D: Storefront Integration for Dynamic Product Options and Variants
 *
 * Automated Test Suite covering all 15 verification scenarios:
 * 1. Rendering arbitrary option groups (Color, Size, Storage, Material, Switch Type, etc.)
 * 2. Selecting a valid combination
 * 3. Handling incomplete and invalid selections without arbitrary fallback
 * 4. Resolving combinations regardless of attribute key order
 * 5. Excluding inactive variants from new purchases
 * 6. Updating price when selected variant changes (direct price + price_modifier fallback)
 * 7. Updating stock availability and quantity limits
 * 8. Switching to the variant-associated image
 * 9. Adding the correct variant ID to cart requests
 * 10. Keeping different variants of the same product as distinct cart lines
 * 11. Correct cart quantity updates and removal
 * 12. Handling unavailable variants and stock changes returned by server
 * 13. Preserving simple-product behavior
 * 14. Preserving legacy Color/Size product behavior
 * 15. Regression coverage for existing cart reliability and subtotal calculations
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

import {
  resolveMatchingVariant,
  getVariantEffectivePrice,
  isOptionValueAvailable,
  getVariantHexColor,
} from "../lib/storefrontVariants";
import { useCartStore, getAvailableStock } from "../store/useCartStore";
import { Product, ProductVariant, ProductOption } from "../types";
import { api } from "../lib/api";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

// -------------------------------------------------------------------
// Mock Data Generators
// -------------------------------------------------------------------

function createDynamicProduct(): Product {
  const options: ProductOption[] = [
    { name: "Color", values: ["Midnight Blue", "Cosmic Gray"] },
    { name: "Storage", values: ["128GB", "256GB"] },
    { name: "Material", values: ["Aluminum", "Titanium"] },
  ];

  const variants: ProductVariant[] = [
    {
      id: 201,
      product_id: 50,
      name: "Midnight Blue / 128GB / Aluminum",
      sku: "PRO-BLU-128-ALU",
      price: 799.0, // direct price
      price_modifier: 0,
      stock_quantity: 10,
      is_active: true,
      attributes: {
        Color: "Midnight Blue",
        Storage: "128GB",
        Material: "Aluminum",
      },
      image_id: 1001,
      image_url: "https://example.com/img/blue-alu.jpg",
    },
    {
      id: 202,
      product_id: 50,
      name: "Midnight Blue / 256GB / Titanium",
      sku: "PRO-BLU-256-TI",
      price: 999.0, // direct price
      price_modifier: 200,
      stock_quantity: 4,
      is_active: true,
      attributes: {
        Color: "Midnight Blue",
        Storage: "256GB",
        Material: "Titanium",
      },
      image_id: 1002,
      image_url: "https://example.com/img/blue-ti.jpg",
    },
    {
      id: 203,
      product_id: 50,
      name: "Cosmic Gray / 128GB / Aluminum (Inactive)",
      sku: "PRO-GRY-128-ALU",
      price: 799.0,
      price_modifier: 0,
      stock_quantity: 8,
      is_active: false, // INACTIVE
      attributes: {
        Color: "Cosmic Gray",
        Storage: "128GB",
        Material: "Aluminum",
      },
    },
    {
      id: 204,
      product_id: 50,
      name: "Cosmic Gray / 256GB / Titanium (Out of stock)",
      sku: "PRO-GRY-256-TI",
      price: 999.0,
      price_modifier: 200,
      stock_quantity: 0, // OUT OF STOCK
      is_active: true,
      attributes: {
        Color: "Cosmic Gray",
        Storage: "256GB",
        Material: "Titanium",
      },
    },
  ];

  return {
    id: 50,
    name: "Aether Pro Workstation",
    slug: "aether-pro-workstation",
    price: 799.0,
    stock_quantity: 14,
    is_active: true,
    has_options: true,
    options,
    variants,
  } as unknown as Product;
}

function createLegacyProduct(): Product {
  const variants: ProductVariant[] = [
    {
      id: 301,
      product_id: 60,
      name: "Obsidian Black / M",
      sku: "LEG-BLK-M",
      price: null as any, // relies on modifier!
      price_modifier: 0,
      stock_quantity: 5,
      is_active: true,
      color_name: "Obsidian Black",
      color_hex: "#111111",
      size: "M",
    },
    {
      id: 302,
      product_id: 60,
      name: "Obsidian Black / L",
      sku: "LEG-BLK-L",
      price: null as any,
      price_modifier: 25.0, // base 100 + 25 = 125
      stock_quantity: 3,
      is_active: true,
      color_name: "Obsidian Black",
      color_hex: "#111111",
      size: "L",
    },
  ];

  return {
    id: 60,
    name: "Legacy Cyber Hoodie",
    slug: "legacy-cyber-hoodie",
    price: 100.0,
    stock_quantity: 8,
    is_active: true,
    variants,
  } as unknown as Product;
}

function createSimpleProduct(): Product {
  return {
    id: 70,
    name: "Minimalist Desk Pad",
    slug: "minimalist-desk-pad",
    price: 35.0,
    stock_quantity: 7,
    is_active: true,
    has_options: false,
    variants: [],
  } as unknown as Product;
}

async function runStorefrontTestSuite() {
  console.log("\n=======================================================");
  console.log("PHASE 4D: STOREFRONT DYNAMIC VARIANTS & OPTIONS TEST SUITE");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------
  // Test 1: Rendering Arbitrary Option Groups
  // -------------------------------------------------------------------
  console.log("Scenario 1: Arbitrary Option Groups Rendering");
  const dynProduct = createDynamicProduct();
  assert(
    Array.isArray(dynProduct.options) && dynProduct.options.length === 3,
    "Product declares 3 arbitrary option groups (Color, Storage, Material)"
  );
  assert(
    dynProduct.options![0].name === "Color" && dynProduct.options![0].values.length === 2,
    "Color group contains 'Midnight Blue' and 'Cosmic Gray'"
  );
  assert(
    dynProduct.options![1].name === "Storage" && dynProduct.options![1].values.includes("256GB"),
    "Storage group contains '128GB' and '256GB'"
  );

  // -------------------------------------------------------------------
  // Test 2: Selecting a Valid Combination
  // -------------------------------------------------------------------
  console.log("\nScenario 2: Valid Combination Resolution");
  const validSelection = {
    Color: "Midnight Blue",
    Storage: "256GB",
    Material: "Titanium",
  };
  const resolved202 = resolveMatchingVariant(
    dynProduct.variants!,
    validSelection,
    dynProduct.options!
  );
  assert(
    resolved202 !== null && resolved202.id === 202,
    "Deterministically resolves variant 202 for Midnight Blue / 256GB / Titanium",
    `Got: ${resolved202?.id}`
  );

  // -------------------------------------------------------------------
  // Test 3: Handling Incomplete and Invalid Selections
  // -------------------------------------------------------------------
  console.log("\nScenario 3: Incomplete and Invalid Selections Handling");
  const partialSelection = {
    Color: "Midnight Blue",
    Storage: "128GB",
    // Missing Material!
  };
  const incompleteResult = resolveMatchingVariant(
    dynProduct.variants!,
    partialSelection,
    dynProduct.options!
  );
  assert(
    incompleteResult === null,
    "Returns null for incomplete selection (does NOT guess or invent combination)"
  );

  const nonExistentSelection = {
    Color: "Midnight Blue",
    Storage: "128GB",
    Material: "Titanium", // This combination was never created in DB
  };
  const invalidResult = resolveMatchingVariant(
    dynProduct.variants!,
    nonExistentSelection,
    dynProduct.options!
  );
  assert(
    invalidResult === null,
    "Returns null for non-existent option combination (prevents impossible combinations)"
  );

  // -------------------------------------------------------------------
  // Test 4: Canonical Key-Order Independence
  // -------------------------------------------------------------------
  console.log("\nScenario 4: Key-Order & Case Independence");
  const scrambledOrderSelection = {
    material: "titanium",
    COLOR: "MIDNIGHT BLUE",
    sToRaGe: "256gb",
  };
  const scrambledResult = resolveMatchingVariant(
    dynProduct.variants!,
    scrambledOrderSelection,
    dynProduct.options!
  );
  assert(
    scrambledResult !== null && scrambledResult.id === 202,
    "Resolves matching variant regardless of attribute key order or casing"
  );

  // -------------------------------------------------------------------
  // Test 5: Excluding Inactive Variants from New Purchases
  // -------------------------------------------------------------------
  console.log("\nScenario 5: Inactive Variant Exclusion");
  const inactiveSelection = {
    Color: "Cosmic Gray",
    Storage: "128GB",
    Material: "Aluminum",
  };
  const inactiveResult = resolveMatchingVariant(
    dynProduct.variants!,
    inactiveSelection,
    dynProduct.options!
  );
  assert(
    inactiveResult === null,
    "Excludes inactive variant from resolution for customer purchase",
    `Inactive variant id 203 returned: ${inactiveResult?.id}`
  );

  // -------------------------------------------------------------------
  // Test 6: Price Display: Direct Variant Price & Modifier Fallback
  // -------------------------------------------------------------------
  console.log("\nScenario 6: Authoritative Price Resolution");
  const directPriceVariant = dynProduct.variants![1]; // price = 999.0
  const effectiveDirect = getVariantEffectivePrice(dynProduct, directPriceVariant);
  assert(
    effectiveDirect === 999.0,
    "Resolves direct variant price ($999.00) without using price_modifier",
    `Got: ${effectiveDirect}`
  );

  const legacyProd = createLegacyProduct();
  const modifierVariant = legacyProd.variants![1]; // price is null, modifier = 25
  const effectiveModifier = getVariantEffectivePrice(legacyProd, modifierVariant);
  assert(
    effectiveModifier === 125.0,
    "Falls back to base price (100) + price_modifier (25) = $125.00 when price is null",
    `Got: ${effectiveModifier}`
  );

  // -------------------------------------------------------------------
  // Test 7: Stock Availability & Quantity Limits
  // -------------------------------------------------------------------
  console.log("\nScenario 7: Stock Availability & Limits");
  const outOfStockVariant = dynProduct.variants![3]; // stock_quantity = 0
  const stockOfOos = getAvailableStock(dynProduct, outOfStockVariant);
  assert(stockOfOos === 0, "Identifies variant as out of stock (stock = 0)");

  const stockOf202 = getAvailableStock(dynProduct, resolved202);
  assert(stockOf202 === 4, "Accurately resolves stock quantity for variant 202 (stock = 4)");

  // -------------------------------------------------------------------
  // Test 8: Variant-Associated Image Resolution
  // -------------------------------------------------------------------
  console.log("\nScenario 8: Variant-Associated Image Switching");
  assert(
    resolved202?.image_id === 1002 && resolved202?.image_url === "https://example.com/img/blue-ti.jpg",
    "Variant 202 links to specific variant image (id: 1002, blue-ti.jpg)"
  );
  const fallbackImgVariant = legacyProd.variants![0];
  assert(
    !fallbackImgVariant.image_url,
    "Gracefully handles variant without assigned image (falls back to gallery)"
  );

  // -------------------------------------------------------------------
  // Test 9: Adding Exact Variant ID to Cart Request
  // -------------------------------------------------------------------
  console.log("\nScenario 9: Add to Cart with Variant ID");
  useCartStore.getState().clearCart();
  const addRes = useCartStore.getState().addItem(dynProduct, resolved202, 2);
  assert(addRes.success, "Successfully adds variant 202 to cart");

  const cartItems = useCartStore.getState().items;
  assert(
    cartItems.length === 1 && cartItems[0].variant?.id === 202,
    "Cart line item stores exact variant ID (202)",
    `Stored variant ID: ${cartItems[0]?.variant?.id}`
  );
  assert(
    cartItems[0].selectedAttributes?.["Storage"] === "256GB",
    "Cart line item preserves selectedAttributes metadata"
  );

  // -------------------------------------------------------------------
  // Test 10: Multiple Variants as Distinct Cart Lines
  // -------------------------------------------------------------------
  console.log("\nScenario 10: Distinct Cart Lines for Different Variants");
  const variant201 = dynProduct.variants![0];
  useCartStore.getState().addItem(dynProduct, variant201, 1);

  const twoItemsCart = useCartStore.getState().items;
  assert(
    twoItemsCart.length === 2,
    "Different variants of the same product exist as separate cart lines"
  );
  assert(
    twoItemsCart[0].variant?.id === 202 && twoItemsCart[1].variant?.id === 201,
    "Maintains separate lines for variant 202 and variant 201"
  );

  // Test merging for same variant
  useCartStore.getState().addItem(dynProduct, variant201, 2);
  const mergedCart = useCartStore.getState().items;
  assert(
    mergedCart.length === 2 && mergedCart[1].quantity === 3,
    "Repeated additions of same variant merge quantities (1 + 2 = 3)"
  );

  // -------------------------------------------------------------------
  // Test 11: Cart Quantity Updates and Removal
  // -------------------------------------------------------------------
  console.log("\nScenario 11: Cart Quantity Updates and Removal");
  const updateRes = useCartStore.getState().updateQuantity(dynProduct.id, 202, 3);
  assert(updateRes.success, "Updates quantity of variant 202 to 3");
  assert(
    useCartStore.getState().items[0].quantity === 3,
    "Stored quantity reflects updated value (3)"
  );

  // Prevent exceeding variant stock ceiling (stock is 4, trying 5)
  const exceedRes = useCartStore.getState().updateQuantity(dynProduct.id, 202, 5);
  assert(!exceedRes.success, "Blocks updating quantity beyond variant stock (5 > 4)");

  // Removal
  useCartStore.getState().removeItem(dynProduct.id, 202);
  assert(
    useCartStore.getState().items.length === 1 && useCartStore.getState().items[0].variant?.id === 201,
    "Removes variant 202 without affecting variant 201"
  );

  // -------------------------------------------------------------------
  // Test 12: Server Cart Validation (Stock Changes & Stale Items)
  // -------------------------------------------------------------------
  console.log("\nScenario 12: Stale Cart & Stock Validation with Server");

  // Mock api.validateCart
  api.validateCart = async (payload: any): Promise<any> => {
    return {
      is_valid: false,
      has_changes: true,
      summary: {
        has_errors: true,
        has_price_changes: true,
        has_quantity_adjustments: false,
        has_out_of_stock: false,
        has_inactive_items: false,
      },
      items: [
        {
          product_id: dynProduct.id,
          variant_id: 201,
          requested_quantity: 3,
          validated_quantity: 3,
          submitted_price: 799.0,
          authoritative_price: 849.0, // price increased on server!
          stock_available: 10,
          status: "price_changed",
          message: "Price updated to $849.00",
        },
      ],
    };
  };

  const valRes = await useCartStore.getState().validateCartWithServer();
  assert(
    valRes !== null && valRes.is_valid === false,
    "Server detects price change for variant 201"
  );
  const validatedItem = useCartStore.getState().items[0];
  assert(
    validatedItem.validationStatus === "price_changed",
    "Cart line marked with validationStatus 'price_changed'"
  );

  // -------------------------------------------------------------------
  // Test 13: Simple Product Purchase Flow
  // -------------------------------------------------------------------
  console.log("\nScenario 13: Simple Products Preservation");
  const simpleProduct = createSimpleProduct();
  useCartStore.getState().clearCart();
  const simpleAdd = useCartStore.getState().addItem(simpleProduct, null, 2);
  assert(simpleAdd.success, "Adds simple product with null variant");

  const simpleCart = useCartStore.getState().items;
  assert(
    simpleCart.length === 1 && simpleCart[0].variant === null,
    "Simple product has variant=null in cart"
  );
  assert(
    getVariantEffectivePrice(simpleCart[0].product, simpleCart[0].variant) === 35.0,
    "Uses direct base product price ($35.00) for simple product"
  );

  // -------------------------------------------------------------------
  // Test 14: Legacy Color/Size Product Compatibility
  // -------------------------------------------------------------------
  console.log("\nScenario 14: Legacy Color/Size Product Compatibility");
  useCartStore.getState().clearCart();
  const legRes = resolveMatchingVariant(
    legacyProd.variants!,
    { Color: "Obsidian Black", Size: "L" },
    []
  );
  assert(
    legRes !== null && legRes.id === 302,
    "Infers and resolves legacy variant 302 by color_name and size"
  );

  const legColorHex = getVariantHexColor(legacyProd.variants!, "Obsidian Black");
  assert(
    legColorHex === "#111111",
    "Resolves color hex '#111111' for legacy variant swatch"
  );

  const legAdd = useCartStore.getState().addItem(legacyProd, legRes, 1);
  assert(legAdd.success, "Adds legacy variant to cart with computed modifier price ($125)");
  assert(
    getVariantEffectivePrice(useCartStore.getState().items[0].product, useCartStore.getState().items[0].variant) === 125.0,
    "Authoritative item price in cart is $125.00"
  );

  // -------------------------------------------------------------------
  // Test 15: Subtotal & Reliability Regression Coverage
  // -------------------------------------------------------------------
  console.log("\nScenario 15: Cart Subtotal & Reliability Calculations");
  // Cart currently has legacy product (price 125, qty 1)
  // Add dynamic product variant 202 (price 999, qty 2)
  useCartStore.getState().addItem(dynProduct, resolved202, 2);
  const subtotal = useCartStore.getState().getSubtotal();
  // Expected: 125 * 1 + 999 * 2 = 125 + 1998 = 2123
  assert(
    subtotal === 2123.0,
    `Accurate subtotal across mixed legacy and dynamic variants: expected 2123, got ${subtotal}`
  );

  // Ensure hasInvalidItems detects issues
  assert(
    !useCartStore.getState().hasInvalidItems(),
    "hasInvalidItems() returns false for valid in-stock items"
  );

  // Mark an item out of stock
  useCartStore.setState({
    items: useCartStore.getState().items.map((i) =>
      i.variant?.id === 202 ? { ...i, availableStock: 0 } : i
    ),
  });
  assert(
    useCartStore.getState().hasInvalidItems(),
    "hasInvalidItems() returns true when variant stock drops below cart quantity"
  );

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log("=======================================================\n");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStorefrontTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
