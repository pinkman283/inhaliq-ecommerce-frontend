import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectNavMenu() {
  const res = await fetch(`${baseUrl}/nav-menu`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const json = await res.json();
  console.log("Nav menu items count:", json.data?.length);
  if (json.data && json.data.length > 0) {
    for (const item of json.data) {
      console.log({
        id: item.id,
        name: item.name,
        slug: item.slug,
        subcategories_count: item.subcategories?.length,
        products_count: item.products?.length,
      });
      if (item.subcategories && item.subcategories.length > 0) {
        console.log("  Subcategory sample:", item.subcategories[0]);
      }
    }
  }
}

inspectNavMenu();
