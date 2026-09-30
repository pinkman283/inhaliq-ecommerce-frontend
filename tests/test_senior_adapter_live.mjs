import fs from "node:fs";

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local", e);
}

import { SeniorApiAdapter } from "../src/lib/api/adapters/senior/SeniorApiAdapter.ts";

async function verifyAdapter() {
  console.log("=== VERIFYING SeniorApiAdapter DIRECTLY AGAINST LIVE SENIOR API ===");
  const adapter = new SeniorApiAdapter();

  try {
    // 1. Init Settings
    console.log("\n1. Testing getInitSettings()...");
    const settings = await adapter.getInitSettings();
    console.log("Init settings store name:", settings.general_settings?.name);
    console.log("Primary color:", settings.main_settings?.primary_color);
    console.log("Shipping charges in settings:", settings.shipping_charges?.length);

    // 2. Homepage & Banners
    console.log("\n2. Testing getHomepageData() & getHomepageBanners()...");
    const home = await adapter.getHomepageData();
    console.log("Homepage sliders count:", home.sliders?.length);
    console.log("Homepage banners mapped primary:", home.banners?.primary_banners?.length);
    console.log("Homepage banners mapped secondary:", home.banners?.secondary_banners?.length);
    console.log("Homepage banners mapped bottom:", home.banners?.bottom_banners?.length);

    // 3. Navigation Menu
    console.log("\n3. Testing getNavMenu()...");
    const nav = await adapter.getNavMenu();
    console.log("Navbar items count:", nav.length);
    if (nav.length > 0) {
      console.log("First nav item:", { id: nav[0].id, title: nav[0].title, href: nav[0].href });
    }

    // 4. Categories
    console.log("\n4. Testing getCategories()...");
    const categories = await adapter.getCategories();
    console.log("Categories count:", categories.length);
    if (categories.length > 0) {
      console.log("First category:", { id: categories[0].id, name: categories[0].name, slug: categories[0].slug });
    }

    // 5. Brands
    console.log("\n5. Testing getBrands()...");
    const brands = await adapter.getBrands();
    console.log("Brands count:", brands.length);
    if (brands.length > 0) {
      console.log("First brand:", { id: brands[0].id, name: brands[0].name, slug: brands[0].slug });
    }

    // 6. Products Catalog
    console.log("\n6. Testing getProducts({ per_page: 12 })...");
    const catalog = await adapter.getProducts({ per_page: 12 });
    console.log("Products returned count:", catalog.data.length, "Total:", catalog.total, "Pages:", catalog.last_page);
    if (catalog.data.length > 0) {
      const p = catalog.data[0];
      console.log("First product in catalog:", {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        in_stock: p.in_stock,
        stock_quantity: p.stock_quantity,
        has_variants: p.has_variants,
        variants_count: p.variants?.length,
      });
    }

    // 7. Product Detail with Real Variants
    console.log("\n7. Testing getProduct('uwell-caliburn-g5-pod-system-1')...");
    const detail = await adapter.getProduct("uwell-caliburn-g5-pod-system-1");
    console.log("Product detail name:", detail.product.name);
    console.log("Product price:", detail.product.price);
    console.log("Product compare_at_price:", detail.product.compare_at_price);
    console.log("Product has_variants:", detail.product.has_variants);
    console.log("Product variants count:", detail.product.variants?.length);
    if (detail.product.variants && detail.product.variants.length > 0) {
      console.log("First variant:", detail.product.variants[0]);
    }
    console.log("Related products count:", detail.related.length);

    // 8. Category Page
    console.log("\n8. Testing getCategory('disposable-1')...");
    const catPage = await adapter.getCategory("disposable-1");
    console.log("Category name:", catPage.category.name);
    console.log("Category products count:", catPage.products.length);

    // 9. Brand Page
    console.log("\n9. Testing getBrand('rincoe')...");
    const brandPage = await adapter.getBrand("rincoe");
    console.log("Brand name:", brandPage.brand.name);
    console.log("Brand products count:", brandPage.products.length);

    // 10. Search Products
    console.log("\n10. Testing searchProducts('flyto')...");
    const searchRes = await adapter.searchProducts("flyto");
    console.log("Search matches count:", searchRes.data.length);

    // 11. Shipping Charges & Payment Gateways
    console.log("\n11. Testing getShippingCharges() & getPaymentGateways()...");
    const shipping = await adapter.getShippingCharges();
    console.log("Shipping charges:", shipping);

    const gateways = await adapter.getPaymentGateways();
    console.log("Payment gateways:", gateways);

    // 12. Checkout Calculation
    console.log("\n12. Testing calculateCheckout()...");
    const calc = await adapter.calculateCheckout({
      area_id: 11,
      items: [
        {
          product_id: 63,
          qty: 2,
          price: 550,
        },
      ],
    });
    console.log("Checkout calculation result:", calc);

    // 13. CMS Page
    console.log("\n13. Testing getPage('privacy-policy')...");
    const page = await adapter.getPage("privacy-policy");
    console.log("Page title:", page.title);
    console.log("Page content length:", page.content.length);

    // 14. Blog Posts
    console.log("\n14. Testing getBlogPosts()...");
    const blog = await adapter.getBlogPosts();
    console.log("Blog posts count:", blog.posts.length);

    console.log("\n>>> ALL REAL SENIOR API ADAPTER OPERATIONS COMPLETED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Adapter verification error:", err);
    process.exit(1);
  }
}

verifyAdapter();
