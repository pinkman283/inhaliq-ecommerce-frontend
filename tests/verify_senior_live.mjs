import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function apiFetch(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function deepInspect() {
  console.log("=== 1. PRODUCT & SHOP INSPECTION ===");
  const shopRes = await apiFetch("/shop");
  console.log("Shop status:", shopRes.status);
  const products = shopRes.data?.products?.data || shopRes.data?.data || [];
  console.log(`Found ${products.length} products in /shop`);

  let sampleProductSlug = null;
  let sampleProductId = null;
  let sampleProduct = null;

  if (products.length > 0) {
    sampleProduct = products[0];
    sampleProductSlug = sampleProduct.slug;
    sampleProductId = sampleProduct.id;
    console.log("Sample product summary:", {
      id: sampleProduct.id,
      name: sampleProduct.name,
      slug: sampleProduct.slug,
      price: sampleProduct.price,
      old_price: sampleProduct.old_price,
      stock: sampleProduct.stock,
      has_variants: sampleProduct.has_variants,
      sizes_type: typeof sampleProduct.sizes,
      colors_type: typeof sampleProduct.colors,
      image: sampleProduct.image,
      gallery_count: sampleProduct.gallery?.length,
    });
  }

  if (sampleProductSlug) {
    console.log(`\n=== 2. SINGLE PRODUCT DETAIL (${sampleProductSlug}) ===`);
    const detailRes = await apiFetch(`/product/${sampleProductSlug}`);
    console.log("Detail status:", detailRes.status);
    const pData = detailRes.data?.data || detailRes.data;
    console.log("Detail fields:", Object.keys(pData || {}));
    console.log("Sizes:", JSON.stringify(pData?.sizes));
    console.log("Colors:", JSON.stringify(pData?.colors));
    console.log("Video:", JSON.stringify(pData?.video || pData?.video_link));
    console.log("Event ID:", pData?.event_id);
    console.log("Related items count:", pData?.related?.length || pData?.related_products?.length);

    console.log(`\n=== 3. PRODUCT REVIEWS (${sampleProductSlug}) ===`);
    const reviewsRes = await apiFetch(`/product/${sampleProductSlug}/reviews`);
    console.log("Reviews status:", reviewsRes.status, "Count:", reviewsRes.data?.data?.length ?? reviewsRes.data?.length);

    console.log(`\n=== 4. PRODUCT RELATED (${sampleProductSlug}) ===`);
    const relatedRes = await apiFetch(`/product/${sampleProductSlug}/related`);
    console.log("Related status:", relatedRes.status, "Count:", relatedRes.data?.data?.length ?? relatedRes.data?.length);
  }

  console.log("\n=== 5. CATEGORIES & SUBCATEGORIES ===");
  const catsRes = await apiFetch("/categories");
  const cats = catsRes.data?.data || catsRes.data || [];
  console.log(`Found ${cats.length} categories`);
  if (cats.length > 0) {
    const c = cats[0];
    console.log("Sample category:", { id: c.id, name: c.name, slug: c.slug, subcats_count: c.subcategories?.length });
    const catDetail = await apiFetch(`/category/${c.slug}`);
    console.log(`GET /category/${c.slug} status:`, catDetail.status, "Products count:", catDetail.data?.products?.data?.length || catDetail.data?.data?.length);

    if (c.subcategories && c.subcategories.length > 0) {
      const sub = c.subcategories[0];
      const subDetail = await apiFetch(`/subcategory/${sub.slug}`);
      console.log(`GET /subcategory/${sub.slug} status:`, subDetail.status);
    }
  }

  console.log("\n=== 6. BRANDS ===");
  const brandsRes = await apiFetch("/brands");
  const brands = brandsRes.data?.data || brandsRes.data || [];
  console.log(`Found ${brands.length} brands`);
  if (brands.length > 0) {
    const b = brands[0];
    console.log("Sample brand:", { id: b.id, name: b.name, slug: b.slug, logo: b.image || b.logo });
    const brandDetail = await apiFetch(`/brand/${b.slug}`);
    console.log(`GET /brand/${b.slug} status:`, brandDetail.status, "Products count:", brandDetail.data?.products?.data?.length || brandDetail.data?.data?.length);
  }

  console.log("\n=== 7. SEARCH ===");
  const searchRes = await apiFetch("/search?keyword=a");
  console.log("GET /search?keyword=a status:", searchRes.status, "Results count:", searchRes.data?.products?.data?.length || searchRes.data?.data?.length);

  console.log("\n=== 8. COUPONS ===");
  const couponsRes = await apiFetch("/coupons");
  console.log("GET /coupons status:", couponsRes.status, "Count:", couponsRes.data?.data?.length || couponsRes.data?.length);
  const sampleCoupon = couponsRes.data?.data?.[0]?.code || couponsRes.data?.[0]?.code || "SAVE10";

  console.log("\n=== 9. CHECKOUT CALCULATION ===");
  if (sampleProductId) {
    const calcPayload = {
      area_id: 1,
      items: [
        {
          product_id: sampleProductId,
          qty: 1,
          price: sampleProduct.price || 100,
        },
      ],
    };
    const calcRes = await apiFetch("/checkout/calculate", {
      method: "POST",
      body: calcPayload,
    });
    console.log("POST /checkout/calculate status:", calcRes.status);
    console.log("Calculation data:", JSON.stringify(calcRes.data));

    // Test with coupon
    const calcCouponRes = await apiFetch("/checkout/calculate", {
      method: "POST",
      body: { ...calcPayload, coupon_code: sampleCoupon },
    });
    console.log("Calculation with coupon status:", calcCouponRes.status, "Data:", JSON.stringify(calcCouponRes.data));

    // Test apply coupon
    const applyCouponRes = await apiFetch("/checkout/apply-coupon", {
      method: "POST",
      body: { coupon_code: sampleCoupon, subtotal: 1000 },
    });
    console.log("POST /checkout/apply-coupon status:", applyCouponRes.status, "Data:", JSON.stringify(applyCouponRes.data));
  }

  console.log("\n=== 10. SHIPPING & PAYMENT GATEWAYS ===");
  const shipRes = await apiFetch("/shipping-charges");
  console.log("Shipping charges data:", JSON.stringify(shipRes.data));

  const gwRes = await apiFetch("/payment-gateways");
  console.log("Payment gateways data:", JSON.stringify(gwRes.data));

  console.log("\n=== 11. BLOG & CMS PAGES ===");
  const blogRes = await apiFetch("/blog/posts");
  console.log("GET /blog/posts status:", blogRes.status, "Count:", blogRes.data?.data?.length || blogRes.data?.posts?.data?.length);

  const blogCatsRes = await apiFetch("/blog/categories");
  console.log("GET /blog/categories status:", blogCatsRes.status);

  const pageRes = await apiFetch("/page/privacy-policy");
  console.log("GET /page/privacy-policy status:", pageRes.status, "Title:", pageRes.data?.data?.title || pageRes.data?.title);

  console.log("\n=== 12. GUEST ORDER TRACKING ===");
  const trackRes = await apiFetch("/order-track?phone=01700000000&invoice_id=99999");
  console.log("GET /order-track test query status:", trackRes.status, "Data:", JSON.stringify(trackRes.data));
}

deepInspect();
