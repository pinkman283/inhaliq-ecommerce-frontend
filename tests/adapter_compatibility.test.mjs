import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import pure mapper functions from compiled/transpiled sources or direct ESM
import {
  mapSeniorProduct,
  mapSeniorCategory,
  mapSeniorBrand,
  mapSeniorHomeToBanners,
  mapSeniorNavMenuToNavbarItems,
  mapSeniorOrder,
} from "../src/lib/api/adapters/senior/mappers.ts";

import {
  mapOriginalProduct,
  mapOriginalCategory,
  mapOriginalShippingZones,
  mapOriginalPaymentMethods,
  mapOriginalCalculationToResult,
  mapOriginalOrderCreationToSaveResult,
} from "../src/lib/api/adapters/original/mappers.ts";

describe("STOREFRONT BACKEND ADAPTER & MAPPERS COMPATIBILITY SUITE", () => {
  // 1. PRODUCT MAPPING
  describe("1. Product Mapping", () => {
    it("maps Senior raw product with separate sizes and colors into canonical Product with synthesized variants", () => {
      const seniorRaw = {
        id: 42,
        name: "Pro Mechanical Keyboard",
        slug: "pro-mech-kb",
        sku: "SEN-KB-42",
        price: 8500,
        old_price: 9500,
        stock: 15,
        status: 1,
        description: "<p>Top grade wireless mechanical keyboard.</p>",
        short_description: "Top grade keyboard",
        cover_image: "https://cdn.store.com/covers/kb.png",
        gallery: [
          "https://cdn.store.com/gallery/kb-1.png",
          "https://cdn.store.com/gallery/kb-2.png",
        ],
        sizes: [
          { id: 1, name: "Tenkeyless (TKL)" },
          { id: 2, name: "Full Size (104 Key)" },
        ],
        colors: [
          { id: 10, name: "Matte Black", code: "#111111" },
          { id: 20, name: "Arctic White", code: "#ffffff" },
        ],
        video: {
          url: "https://www.youtube.com/watch?v=demo12345",
          embed_url: "https://www.youtube.com/embed/demo12345",
        },
        rating_average: 4.8,
        reviews_count: 24,
      };

      const product = mapSeniorProduct(seniorRaw);

      assert.equal(product.id, 42);
      assert.equal(product.name, "Pro Mechanical Keyboard");
      assert.equal(product.price, 8500);
      assert.equal(product.compare_at_price, 9500);
      assert.equal(product.in_stock, true);
      assert.equal(product.stock_quantity, 15);
      assert.equal(product.primary_image?.image_url, "https://cdn.store.com/covers/kb.png");
      assert.equal(product.images?.length, 3); // Cover + 2 gallery items
      assert.equal(product.has_variants, true);
      // Synthesized variants from 2 sizes * 2 colors = 4 variants
      assert.equal(product.variants?.length, 4);
      assert.equal(product.variants?.[0].size, "Tenkeyless (TKL)");
      assert.equal(product.variants?.[0].color_name, "Matte Black");
      assert.equal(product.variants?.[0].color_hex, "#111111");
      assert.equal(Boolean(product.video), true);
    });

    it("maps Original Laravel product with existing single variant schema cleanly", () => {
      const originalRaw = {
        id: 101,
        name: "Studio Headphones",
        slug: "studio-headphones",
        sku: "ORIG-HP-101",
        price: 4500,
        sale_price: 3900,
        stock_quantity: 5,
        is_featured: true,
        description: "Studio monitors",
        image: "https://orig.store.com/hp.png",
        variants: [
          {
            id: 201,
            product_id: 101,
            name: "Midnight Black",
            color_name: "Midnight Black",
            price_modifier: 0,
            stock_quantity: 5,
          },
        ],
        rating: 5,
        reviews_count: 12,
      };

      const product = mapOriginalProduct(originalRaw);

      assert.equal(product.id, 101);
      assert.equal(product.name, "Studio Headphones");
      assert.equal(product.price, 4500);
      assert.equal(product.sale_price, 3900);
      assert.equal(product.in_stock, true);
      assert.equal(product.variants?.length, 1);
      assert.equal(product.variants?.[0].name, "Midnight Black");
    });
  });

  // 2. CATEGORY & NAVIGATION MAPPING
  describe("2. Category & Navigation Mapping", () => {
    it("normalizes Senior category and subcategory trees", () => {
      const seniorCategory = {
        id: 5,
        name: "Computing",
        slug: "computing",
        image: "https://cdn.store.com/cats/comp.png",
        subcategories: [
          {
            id: 51,
            name: "Laptops",
            slug: "laptops",
            childcategories: [
              { id: 511, name: "Gaming Laptops", slug: "gaming-laptops" },
            ],
          },
        ],
      };

      const mapped = mapSeniorCategory(seniorCategory);

      assert.equal(mapped.id, 5);
      assert.equal(mapped.name, "Computing");
      assert.equal(mapped.children?.length, 1);
      assert.equal(mapped.children?.[0].name, "Laptops");
      assert.equal(mapped.children?.[0].children?.length, 1);
      assert.equal(mapped.children?.[0].children?.[0].name, "Gaming Laptops");
    });

    it("normalizes Senior nav menu array to canonical NavbarItem tree", () => {
      const seniorNav = [
        {
          id: 1,
          name: "Home",
          slug: "/",
          type: "custom",
        },
        {
          id: 2,
          name: "Shop",
          slug: "/products",
          children: [
            { id: 21, name: "Audio", slug: "/products?category=audio" },
          ],
        },
      ];

      const navItems = mapSeniorNavMenuToNavbarItems(seniorNav);

      assert.equal(navItems.length, 2);
      assert.equal(navItems[0].name, "Home");
      assert.equal(navItems[1].children?.length, 1);
      assert.equal(navItems[1].children?.[0].name, "Audio");
    });

    it("preserves Original Category structure with children", () => {
      const originalCat = {
        id: 10,
        name: "Accessories",
        slug: "accessories",
        children: [
          { id: 11, name: "Cables", slug: "cables" },
        ],
      };

      const mapped = mapOriginalCategory(originalCat);
      assert.equal(mapped.id, 10);
      assert.equal(mapped.children?.length, 1);
      assert.equal(mapped.children?.[0].name, "Cables");
    });

    it("normalizes Senior brand data into canonical Brand model", () => {
      const seniorBrand = {
        id: 99,
        name: "Logitech",
        slug: "logitech",
        logo: "https://cdn.store.com/brands/logitech.png",
        website_url: "https://logitech.com",
        is_featured: 1,
        sorting: 5,
      };

      const mapped = mapSeniorBrand(seniorBrand);
      assert.equal(mapped.id, 99);
      assert.equal(mapped.name, "Logitech");
      assert.equal(mapped.logo, "https://cdn.store.com/brands/logitech.png");
      assert.equal(mapped.website, "https://logitech.com");
      assert.equal(mapped.is_featured, true);
    });
  });

  // 3. BANNER & HOMEPAGE MAPPING
  describe("3. Banner & Homepage Mapping", () => {
    it("maps Senior /home sliders and banners to canonical HomepageBannersResponse", () => {
      const seniorHome = {
        sliders: [
          {
            id: 1,
            title: "Summer Flash Deal",
            image: "https://cdn.store.com/banners/hero.jpg",
            link: "/campaign/summer",
          },
        ],
        banners: [
          {
            id: 2,
            title: "Audio Gear 20% Off",
            image: "https://cdn.store.com/banners/middle.jpg",
            link: "/products?category=audio",
          },
        ],
        popup_banners: [
          {
            id: 3,
            title: "Welcome Voucher",
            image: "https://cdn.store.com/banners/popup.jpg",
            link: "/promotions",
          },
        ],
      };

      const banners = mapSeniorHomeToBanners(seniorHome);

      assert.equal(banners.primary_banners.length, 1);
      assert.equal(banners.primary_banners[0].image_url, "https://cdn.store.com/banners/hero.jpg");
      assert.equal(banners.secondary_banners.length, 1);
      assert.equal(banners.secondary_banners[0].image_url, "https://cdn.store.com/banners/middle.jpg");
      assert.equal(banners.all_active_count, 3);
    });
  });

  // 4. CART & CHECKOUT CALCULATION MAPPING
  describe("4. Cart & Checkout Calculation Mapping", () => {
    it("maps Original evaluatePromotions payload to CheckoutCalculateResult", () => {
      const evalRes = {
        valid: true,
        subtotal: 10000,
        total_discount: 1500,
        shipping_amount: 60,
        grand_total: 8560,
        message: "Code applied successfully",
        applied_promotions: [
          { promotion_id: 1, promotion_name: "SAVE15", discount_amount: 1500 },
        ],
      };

      const result = mapOriginalCalculationToResult(evalRes);

      assert.equal(result.subtotal, 10000);
      assert.equal(result.discount, 1500);
      assert.equal(result.shipping_charge, 60);
      assert.equal(result.total, 8560);
      assert.equal(result.is_coupon_valid, true);
    });

    it("maps Original shipping zones to unified ShippingChargeItem[]", () => {
      const zones = [
        { id: "inside_dhaka", name: "Inside Dhaka Metro", rate: 60, is_active: true },
        { id: "outside_dhaka", name: "Outside Dhaka Division", rate: 120, is_active: true },
        { id: "inactive_zone", name: "Inactive Zone", rate: 200, is_active: false },
      ];

      const charges = mapOriginalShippingZones(zones);

      assert.equal(charges.length, 2);
      assert.equal(charges[0].name, "Inside Dhaka Metro");
      assert.equal(charges[0].amount, 60);
      assert.equal(charges[0].is_default, true);
      assert.equal(charges[1].amount, 120);
      assert.equal(charges[1].is_default, false);
    });

    it("maps Original payment methods to unified PaymentGatewayItem[]", () => {
      const methods = [
        { code: "cod", name: "Cash on Delivery", description: "Pay cash", available: true, notice: null },
        { code: "online_payment", name: "bKash / Nagad / Cards", description: "Online", available: true, notice: null },
        { code: "crypto", name: "Crypto", description: "Disabled", available: false, notice: null },
      ];

      const gateways = mapOriginalPaymentMethods(methods);

      assert.equal(gateways.length, 2);
      assert.equal(gateways[0].type, "cod");
      assert.equal(gateways[0].slug, "cod");
      assert.equal(gateways[1].type, "online");
      assert.equal(gateways[1].slug, "online_payment");
    });
  });

  // 5. ORDER CREATION MAPPING
  describe("5. Order Creation Mapping", () => {
    it("maps Senior order save response to OrderSaveResult including payment_url", () => {
      const seniorOrderRes = {
        success: true,
        order_id: 88,
        invoice_id: "INV-2026-0088",
        token: "tok_xyz_88",
        total: 12500,
        payment_url: "https://payment.gateway.com/pay/session-88",
      };

      const mapped = mapSeniorOrder(seniorOrderRes);

      assert.equal(mapped.order_id, 88);
      assert.equal(mapped.invoice_id, "INV-2026-0088");
      assert.equal(mapped.total, 12500);
      assert.equal(mapped.payment_url, "https://payment.gateway.com/pay/session-88");
    });

    it("maps Original order creation response to OrderSaveResult", () => {
      const origRes = {
        message: "Order placed successfully",
        order: {
          id: 55,
          order_number: "ORD-2026-9955",
          total_amount: 6400,
          order_status: "pending",
        },
      };

      const mapped = mapOriginalOrderCreationToSaveResult(origRes);

      assert.equal(mapped.order_id, 55);
      assert.equal(mapped.invoice_id, "ORD-2026-9955");
      assert.equal(mapped.total, 6400);
      assert.equal(mapped.status, "pending");
    });
  });

  // 6. BACKEND PROVIDER SELECTION & INTEGRITY
  describe("6. Backend Provider Selection Mechanism", () => {
    it("instantiates adapters with correct immutable provider identifiers", async () => {
      const { SeniorApiAdapter } = await import("../src/lib/api/adapters/senior/SeniorApiAdapter.ts");
      const { OriginalApiAdapter } = await import("../src/lib/api/adapters/original/OriginalApiAdapter.ts");

      const seniorAdapter = new SeniorApiAdapter();
      const originalAdapter = new OriginalApiAdapter();

      assert.equal(seniorAdapter.provider, "senior");
      assert.equal(originalAdapter.provider, "original");
    });
  });
});
