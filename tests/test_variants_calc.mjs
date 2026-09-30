import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function findVariantsAndTestCalc() {
  const res = await fetch(`${baseUrl}/shop?per_page=50`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
  });
  const json = await res.json();
  const products = json.data?.products?.data || [];

  console.log(`Fetched ${products.length} products from /shop`);

  let productWithVariants = null;
  for (const p of products) {
    if ((p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0) || (p.variants && p.variants.length > 0)) {
      productWithVariants = p;
      break;
    }
  }

  if (productWithVariants) {
    console.log("Found product with variants in /shop:", {
      id: productWithVariants.id,
      name: productWithVariants.name,
      slug: productWithVariants.slug,
      sizes: productWithVariants.sizes,
      colors: productWithVariants.colors,
      variants: productWithVariants.variants,
    });
  } else {
    console.log("No products with variants in the first 50 /shop items. Checking /home or single detail calls...");
  }

  // Test POST /checkout/calculate with real product 63
  console.log("\n--- Testing POST /checkout/calculate ---");
  const calcPayload = {
    area_id: 11, // Using real shipping charge id 11 ("Inside Dhaka")
    items: [
      {
        product_id: 63,
        qty: 2,
        price: 550,
      }
    ]
  };

  const calcRes = await fetch(`${baseUrl}/checkout/calculate`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
    body: JSON.stringify(calcPayload),
  });
  console.log("Calculate status:", calcRes.status);
  const calcJson = await calcRes.json();
  console.log("Calculate response:", JSON.stringify(calcJson, null, 2));

  // Test POST /checkout/calculate with invalid coupon
  console.log("\n--- Testing POST /checkout/calculate with coupon ---");
  const calcCouponRes = await fetch(`${baseUrl}/checkout/calculate`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
    body: JSON.stringify({ ...calcPayload, coupon_code: "NONEXISTENT10" }),
  });
  console.log("Calculate with coupon status:", calcCouponRes.status);
  const calcCouponJson = await calcCouponRes.json();
  console.log("Calculate with coupon response:", JSON.stringify(calcCouponJson, null, 2));

  // Test POST /checkout/apply-coupon
  console.log("\n--- Testing POST /checkout/apply-coupon ---");
  const applyRes = await fetch(`${baseUrl}/checkout/apply-coupon`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
    body: JSON.stringify({ coupon_code: "NONEXISTENT10", subtotal: 1100 }),
  });
  console.log("Apply coupon status:", applyRes.status);
  const applyJson = await applyRes.json();
  console.log("Apply coupon response:", JSON.stringify(applyJson, null, 2));
}

findVariantsAndTestCalc();
