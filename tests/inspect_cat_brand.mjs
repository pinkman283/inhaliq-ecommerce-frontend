import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectCategoryAndBrand() {
  const catRes = await fetch(`${baseUrl}/category/disposable-1`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const catJson = await catRes.json();
  console.log("Category response keys:", Object.keys(catJson.data || {}));
  console.log("Category products type:", typeof catJson.data?.products, "isArray:", Array.isArray(catJson.data?.products));
  if (catJson.data?.products) {
    console.log("Category products sub-keys:", Object.keys(catJson.data.products));
    console.log("Category products.data length:", catJson.data.products.data?.length);
  }

  const brandRes = await fetch(`${baseUrl}/brand/rincoe`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const brandJson = await brandRes.json();
  console.log("\nBrand response keys:", Object.keys(brandJson.data || {}));
  console.log("Brand products type:", typeof brandJson.data?.products, "isArray:", Array.isArray(brandJson.data?.products));
  if (brandJson.data?.products) {
    console.log("Brand products sub-keys:", Object.keys(brandJson.data.products));
    console.log("Brand products.data length:", brandJson.data.products.data?.length);
  }
}

inspectCategoryAndBrand();
