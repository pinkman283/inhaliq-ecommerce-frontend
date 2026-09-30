import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function testBlog() {
  try {
    const res = await fetch(`${baseUrl}/blog/posts`, {
      headers: { "Accept": "application/json", "X-API-KEY": apiKey, "Origin": "http://localhost:3000" },
      signal: AbortSignal.timeout(20000),
    });
    console.log("GET /blog/posts status:", res.status);
    const json = await res.json().catch(() => null);
    console.log("Blog posts response:", JSON.stringify(json, null, 2).slice(0, 1000));
  } catch (err) {
    console.log("Blog fetch error:", err.message);
  }
}

testBlog();
