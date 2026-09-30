import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectInitSettings() {
  const res = await fetch(`${baseUrl}/init-settings`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("data keys:", Object.keys(json.data || {}));
  console.log("main_settings:", json.data?.main_settings);
  console.log("general_settings:", json.data?.general_settings);
  console.log("facebook_pixels:", json.data?.facebook_pixels);
  console.log("shipping_charges count:", json.data?.shipping_charges?.length);
}

inspectInitSettings();
