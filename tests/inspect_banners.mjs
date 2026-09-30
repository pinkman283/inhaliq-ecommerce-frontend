import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectBanners() {
  const bcRes = await fetch(`${baseUrl}/banner-categories`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const bcJson = await bcRes.json();
  console.log("Banner categories status:", bcRes.status);
  console.log("Banner categories:", bcJson);

  if (bcJson.data && bcJson.data.length > 0) {
    const firstCatId = bcJson.data[0].id;
    console.log(`\nFetching /banners/${firstCatId}...`);
    const bRes = await fetch(`${baseUrl}/banners/${firstCatId}`, {
      headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
    });
    const bJson = await bRes.json();
    console.log(`Banners for category ${firstCatId} status:`, bRes.status);
    console.log("Banners count:", bJson.data?.length);
  }
}

inspectBanners();
