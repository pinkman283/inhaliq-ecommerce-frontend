import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectCampaigns() {
  const campsRes = await fetch(`${baseUrl}/campaigns`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  console.log("GET /campaigns status:", campsRes.status);
  const json = await campsRes.json().catch(() => null);
  console.log("Campaigns response:", json);
}

inspectCampaigns();
