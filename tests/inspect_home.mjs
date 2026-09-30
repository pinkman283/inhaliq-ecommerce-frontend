import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectHome() {
  const homeRes = await fetch(`${baseUrl}/home`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const homeJson = await homeRes.json();
  const d = homeJson.data;
  console.log("Home keys:", Object.keys(d || {}));
  console.log("ALL SLIDERS:", d?.sliders);
  console.log("CATEGORY BOTTOM ADS:", d?.category_bottom_ads);
  console.log("Deals middle ads count:", d?.deals_middle_ads?.length);
  if (d?.deals_middle_ads?.length > 0) {
    console.log("First deals middle ad:", d.deals_middle_ads[0]);
  }
  console.log("Home popup banner:", d?.home_popup_banner);
}

inspectHome();
