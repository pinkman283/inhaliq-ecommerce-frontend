import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function testPage() {
  const res = await fetch(`${baseUrl}/page/privacy-policy`, {
    headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
  });
  console.log("GET /page/privacy-policy status:", res.status);
  const json = await res.json().catch(() => null);
  console.log("Response:", JSON.stringify(json, null, 2).slice(0, 1000));
}

testPage();
