import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspect() {
  const res = await fetch(`${baseUrl}/shop`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
  });
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Top-level keys:", Object.keys(json));
  console.log("data property keys:", json.data ? Object.keys(json.data) : "no data prop");

  // If json.data is object:
  if (json.data) {
    for (const k of Object.keys(json.data)) {
      const val = json.data[k];
      console.log(`data.${k}: type=${typeof val}, isArray=${Array.isArray(val)}, length=${val?.length || Object.keys(val || {}).length}`);
    }
  }

  // Let's locate the product list:
  const products = json.data?.products?.data || json.data?.products || json.data || json.products?.data || json.products;
  console.log("Resolved products count:", products?.length);

  if (Array.isArray(products) && products.length > 0) {
    const first = products[0];
    console.log("\nFirst Product keys:", Object.keys(first));
    console.log("First Product sample:", JSON.stringify(first, null, 2).slice(0, 1500));

    // Now let's fetch this single product's detail
    const slug = first.slug;
    console.log(`\nFetching /product/${slug}...`);
    const detailRes = await fetch(`${baseUrl}/product/${slug}`, {
      headers: {
        "Accept": "application/json",
        "X-API-KEY": apiKey,
        "Origin": "http://localhost:3000",
      },
    });
    const detailJson = await detailRes.json();
    console.log("Product detail status:", detailRes.status);
    console.log("Product detail top keys:", Object.keys(detailJson));
    console.log("Product detail data keys:", detailJson.data ? Object.keys(detailJson.data) : "none");
    console.log("Product detail sample:", JSON.stringify(detailJson.data, null, 2).slice(0, 2000));
  }
}

inspect();
