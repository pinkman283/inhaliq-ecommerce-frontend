import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function fetchAll() {
  const res = await fetch(`${baseUrl}/shop?per_page=100`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": apiKey,
    },
  });
  const json = await res.json();
  const list = json.data?.products?.data || json.data?.products || [];
  console.log(`Fetched ${list.length} products from Senior Backend:`);
  for (const p of list) {
    console.log(`[${p.id}] ${p.name} | Price: ${p.new_price} | Stock: ${p.stock} | Img: ${p.image}`);
  }
}

fetchAll();
