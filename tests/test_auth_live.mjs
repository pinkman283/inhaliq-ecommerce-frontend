import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function testAuth() {
  console.log("--- Testing POST /auth/login with invalid credentials ---");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
    body: JSON.stringify({ phone: "01700000000", password: "wrongpassword123" }),
  });
  console.log("Login status:", loginRes.status);
  const loginJson = await loginRes.json();
  console.log("Login response:", JSON.stringify(loginJson, null, 2));

  console.log("\n--- Testing POST /auth/register validation ---");
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
    body: JSON.stringify({ name: "T", phone: "123", password: "1", password_confirmation: "2" }),
  });
  console.log("Register status:", regRes.status);
  const regJson = await regRes.json();
  console.log("Register response:", JSON.stringify(regJson, null, 2));
}

testAuth();
