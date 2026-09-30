import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectSearch() {
  const searchRes = await fetch(`${baseUrl}/search?keyword=flyto`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const json = await searchRes.json();
  console.log("Search status:", searchRes.status);
  console.log("Search response keys:", Object.keys(json.data || {}));
  console.log("Search data.products type:", typeof json.data?.products);
  if (json.data?.products) {
    console.log("data.products keys:", Object.keys(json.data.products));
    console.log("data.products.data length:", json.data.products.data?.length);
  }
}

inspectSearch();
