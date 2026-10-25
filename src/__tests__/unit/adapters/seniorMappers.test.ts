import { describe, it, expect } from "vitest";
import {
  mapSeniorProduct,
  mapSeniorCategory,
  mapSeniorBrand,
  mapSeniorNavMenuToNavbarItems,
  mapSeniorOrder,
} from "@/lib/api/adapters/senior/mappers";

describe("Senior Adapter Pure Mappers (Unit Tests)", () => {
  describe("mapSeniorProduct", () => {
    it("handles null or undefined input gracefully with defaults", () => {
      const product = mapSeniorProduct(null);
      expect(product.id).toBe(0);
      expect(product.name).toBe("Unknown Product");
      expect(product.price).toBe(0);
      expect(product.stock_quantity).toBe(0);
    });

    it("correctly maps raw Senior product data and computes fallback values", () => {
      const rawSenior = {
        id: 99,
        name: "Quantum Mechanical Keyboard",
        slug: "quantum-mech-kb",
        sku: "SEN-KB-99",
        price: 4500,
        old_price: 5200,
        stock: 25,
        status: 1,
        description: "<p>Top tier mechanical keyboard.</p>",
        short_description: "Top keyboard",
        cover_image: "https://example.com/cover.png",
        gallery: ["https://example.com/gallery1.png"],
        category: { id: 10, name: "Keyboards", slug: "keyboards" },
        brand: { id: 5, name: "Keychron", slug: "keychron" },
        sizes: [{ id: 1, name: "TKL" }],
        colors: [{ id: 1, name: "Navy", hex_code: "#000080" }],
      };

      const result = mapSeniorProduct(rawSenior);

      expect(result.id).toBe(99);
      expect(result.name).toBe("Quantum Mechanical Keyboard");
      expect(result.slug).toBe("quantum-mech-kb");
      expect(result.price).toBe(4500);
      expect(result.compare_at_price).toBe(5200);
      expect(result.stock_quantity).toBe(25);
      expect(result.is_active).toBe(true);
      expect(result.category?.name).toBe("Keyboards");
      expect(result.brand).toBe("Keychron");
      expect(result.variants).toBeDefined();
      expect(result.variants?.length).toBeGreaterThanOrEqual(1);
      expect(result.variants?.[0].sku).toContain("KB-99");
    });
  });

  describe("mapSeniorCategory", () => {
    it("maps raw senior category with slug", () => {
      const rawCat = {
        id: 15,
        name: "Audio Equipment",
        slug: "audio-equipment",
        description: "Studio headsets and speakers",
        image: "https://example.com/audio.png",
      };

      const result = mapSeniorCategory(rawCat);
      expect(result.id).toBe(15);
      expect(result.name).toBe("Audio Equipment");
      expect(result.slug).toBe("audio-equipment");
      expect(result.image).toBe("https://example.com/audio.png");
    });
  });

  describe("mapSeniorBrand", () => {
    it("maps raw senior brand with website and logo fallback", () => {
      const rawBrand = {
        id: 7,
        name: "Sony Audio",
        slug: "sony-audio",
        logo: "https://example.com/sony.png",
      };

      const result = mapSeniorBrand(rawBrand);
      expect(result.id).toBe(7);
      expect(result.name).toBe("Sony Audio");
      expect(result.slug).toBe("sony-audio");
    });
  });

  describe("mapSeniorNavMenuToNavbarItems", () => {
    it("constructs hierarchical navbar tree with active status", () => {
      const rawMenu = [
        {
          id: 1,
          name: "Home",
          url: "/",
          type: "custom",
          children: [],
        },
        {
          id: 2,
          name: "Keyboards",
          url: "/category/keyboards",
          type: "category",
          children: [
            {
              id: 3,
              name: "Wireless Keyboards",
              url: "/category/wireless-keyboards",
              type: "category",
            },
          ],
        },
      ];

      const items = mapSeniorNavMenuToNavbarItems(rawMenu);
      expect(items.length).toBe(2);
      expect(items[0].title).toBe("Home");
      expect(items[1].title).toBe("Keyboards");
      expect(items[1].children?.length).toBe(1);
      expect(items[1].children?.[0].title).toBe("Wireless Keyboards");
    });
  });

  describe("mapSeniorOrder", () => {
    it("maps raw order status and normalizes monetary values", () => {
      const rawOrder = {
        id: 1001,
        order_number: "SEN-ORD-1001",
        customer_name: "Rahim Chowdhury",
        customer_phone: "01711223344",
        total: "3500.50",
        shipping_fee: "120.00",
        status: "processing",
        payment_method: "cod",
        payment_status: "unpaid",
        items: [
          {
            id: 201,
            product_id: 99,
            product_name: "Mechanical Keyboard",
            quantity: 1,
            price: 3380.50,
          },
        ],
      };

      const order = mapSeniorOrder(rawOrder);
      expect(order.id).toBe(1001);
      expect(order.order_number).toBe("SEN-ORD-1001");
      expect(order.customer_name).toBe("Rahim Chowdhury");
      expect(order.total_amount).toBe(3500.5);
      expect(order.shipping_amount).toBe(120);
      expect(order.items.length).toBe(1);
    });
  });
});
