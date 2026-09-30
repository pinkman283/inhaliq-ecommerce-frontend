import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const baseUrlMatch = envContent.match(/SENIOR_API_BASE_URL=["']([^"']+)["']/);
const keyMatch = envContent.match(/SENIOR_API_KEY=["']([^"']+)["']/);

const baseUrl = baseUrlMatch ? baseUrlMatch[1] : "https://www.inhaliq.com/api/v1";
const apiKey = keyMatch ? keyMatch[1] : "";

async function inspectProductDetail() {
  const res = await fetch(`${baseUrl}/product/uwell-caliburn-g5-pod-system-1`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": apiKey,
      "Origin": "http://localhost:3000",
    },
  });
  const json = await res.json();
  console.log("Detail status:", res.status);
  console.log("Data keys:", Object.keys(json.data || {}));
  console.log("Product keys:", Object.keys(json.data?.product || {}));
  console.log("Product price / new_price / old_price:", {
    new_price: json.data?.product?.new_price,
    old_price: json.data?.product?.old_price,
    price: json.data?.product?.price,
  });
  console.log("Variants length:", json.data?.product?.variants?.length);
  if (json.data?.product?.variants?.length > 0) {
    console.log("First variant:", json.data?.product?.variants[0]);
  }
  console.log("Sizes:", json.data?.product?.sizes);
  console.log("Colors:", json.data?.product?.colors);
  console.log("Images:", json.data?.product?.images);
  console.log("Video:", json.data?.product?.video, "Video link:", json.data?.product?.video_link);
  console.log("Related products length:", json.data?.related_products?.length);
  if (json.data?.related_products?.length > 0) {
    console.log("First related product:", {
      id: json.data?.related_products[0].id,
      name: json.data?.related_products[0].name,
      slug: json.data?.related_products[0].slug,
      new_price: json.data?.related_products[0].new_price,
    });
  }
}

inspectProductDetail();
