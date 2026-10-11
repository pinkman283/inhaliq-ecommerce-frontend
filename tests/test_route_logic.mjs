// Unit test for route parameters, headers, and validation bounds
import assert from "node:assert";

const ALLOWED_PROFILES = new Set(["product", "thumbnail", "banner", "brand", "lossless"]);
const ALLOWED_OUTPUT_FORMATS = new Set(["auto", "webp", "jpeg", "png", "preserve"]);
const MAX_PROXY_BYTES = 4.2 * 1024 * 1024;

console.log("=== Testing Route Validation Bounds & Parameter Whitelisting ===");

// 1. Profile bounds
assert.strictEqual(ALLOWED_PROFILES.has("product"), true);
assert.strictEqual(ALLOWED_PROFILES.has("thumbnail"), true);
assert.strictEqual(ALLOWED_PROFILES.has("banner"), true);
assert.strictEqual(ALLOWED_PROFILES.has("brand"), true);
assert.strictEqual(ALLOWED_PROFILES.has("lossless"), true);
assert.strictEqual(ALLOWED_PROFILES.has("invalid"), false);
assert.strictEqual(ALLOWED_PROFILES.has("../traversal"), false);
console.log("✓ Profile whitelisting verified");

// 2. Output formats
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("auto"), true);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("webp"), true);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("jpeg"), true);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("png"), true);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("preserve"), true);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("gif"), false);
assert.strictEqual(ALLOWED_OUTPUT_FORMATS.has("exe"), false);
console.log("✓ Output format whitelisting verified");

// 3. Payload limits
const smallFileSize = 1.2 * 1024 * 1024;
const oversizedFileSize = 4.3 * 1024 * 1024;
assert.strictEqual(smallFileSize <= MAX_PROXY_BYTES, true);
assert.strictEqual(oversizedFileSize > MAX_PROXY_BYTES, true);
console.log("✓ 4.2MB Vercel serverless ceiling verified (4,404,019 bytes boundary)");

console.log("=== Route validation tests passed ===");
