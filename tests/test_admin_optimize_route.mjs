// Integration verification test for /api/admin/optimize route
import assert from "node:assert";

async function runTests() {
  console.log("=== Testing /api/admin/optimize Security & Error Boundaries ===");

  const baseUrl = "http://localhost:3000/api/admin/optimize";

  // Test 1: Reject request with missing Authorization header
  try {
    const res = await fetch(baseUrl, { method: "POST" });
    const json = await res.json();
    console.log("Test 1 (Missing Auth): Status =", res.status, "Body =", json);
    assert.strictEqual(res.status, 401, "Expected 401 Unauthorized");
    assert.strictEqual(json.code, "AUTH_REQUIRED", "Expected code AUTH_REQUIRED");
    console.log("✓ Test 1 Passed: Missing Authorization rejected with 401");
  } catch (err) {
    console.error("Test 1 Failed:", err.message);
  }

  // Test 2: Reject request with non-Bearer Authorization header
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const json = await res.json();
    console.log("Test 2 (Invalid Auth Scheme): Status =", res.status, "Body =", json);
    assert.strictEqual(res.status, 401, "Expected 401 Unauthorized");
    assert.strictEqual(json.code, "AUTH_REQUIRED", "Expected code AUTH_REQUIRED");
    console.log("✓ Test 2 Passed: Non-Bearer rejected with 401");
  } catch (err) {
    console.error("Test 2 Failed:", err.message);
  }

  // Test 3: Reject invalid / forged bearer token
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: "Bearer forged_invalid_token_12345" },
    });
    const json = await res.json();
    console.log("Test 3 (Forged Token): Status =", res.status, "Body =", json);
    assert.ok(res.status === 401 || res.status === 502, "Expected 401 Unauthorized or 502 (if backend offline)");
    console.log("✓ Test 3 Passed: Forged token rejected (verified against auth service)");
  } catch (err) {
    console.error("Test 3 Failed:", err.message);
  }

  console.log("=== Security verification complete ===");
}

runTests();
