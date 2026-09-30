import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function check() {
  const categories = ["disposable-1", "devices-1", "nicsalt-juice-1", "freebase-juice"];
  
  for (const slug of categories) {
    console.log(`\n--- CATEGORY: ${slug} ---`);
    const res1 = await fetch(`${baseUrl}/shop?category=${slug}`, {
      headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
    });
    const j1 = await res1.json();
    const p1 = j1.data?.products?.data || [];
    console.log(`/shop?category=${slug} count:`, p1.length);
    console.log(`First 2 from /shop:`, p1.slice(0, 2).map(p => ({ id: p.id, name: p.name, category_id: p.category_id, category: p.category })));

    const res2 = await fetch(`${baseUrl}/category/${slug}`, {
      headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
    });
    const j2 = await res2.json();
    const p2 = j2.data?.products?.data || [];
    console.log(`/category/${slug} count:`, p2.length);
    console.log(`First 2 from /category:`, p2.slice(0, 2).map(p => ({ id: p.id, name: p.name, category_id: p.category_id, category: p.category })));
  }
}

check();
