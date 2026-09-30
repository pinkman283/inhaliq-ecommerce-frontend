import https from "node:https";

const apiKey = "1AX3OHg9.:0v";

async function getCategories() {
  return new Promise((resolve) => {
    const req = https.get("https://www.inhaliq.com/api/v1/categories", {
      headers: { "X-API-KEY": apiKey, "Accept": "application/json" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ error: e.message, data });
        }
      });
    });
    req.on("error", (err) => resolve({ error: err.message }));
  });
}

async function main() {
  const cats = await getCategories();
  console.log("Categories raw length:", cats.data?.length);
  for (const c of cats.data || []) {
    console.log(`Cat: ${c.name} (${c.slug}), sub_categories: ${c.sub_categories?.length || c.subcategories?.length || 0}`);
    if (c.sub_categories) {
      for (const s of c.sub_categories) {
        console.log(`   Sub: ${s.name} (${s.slug}), child_categories: ${s.child_categories?.length || s.childcategories?.length || 0}`);
      }
    }
  }
}

main();
