import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import axios from "axios";
import { mapSeniorNavMenuToNavbarItems } from "../src/lib/api/adapters/senior/mappers.ts";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const baseURL = env.SENIOR_API_BASE_URL || "https://www.inhaliq.com/api/v1";
const apiKey = env.SENIOR_API_KEY || "1AX3OHg9.:0v";

describe("LIVE SENIOR API /nav-menu MULTI-LEVEL HIERARCHY TEST", () => {
  it("fetches live /nav-menu and verifies 3-tier hierarchy mapping without flattening or empty menus", async () => {
    const client = axios.create({
      baseURL,
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
      },
    });

    const res = await client.get("/nav-menu");
    assert.equal(res.status, 200);

    const rawData = res.data?.data || res.data;
    assert.ok(Array.isArray(rawData), "raw nav-menu data should be an array");

    const mapped = mapSeniorNavMenuToNavbarItems(rawData);
    assert.ok(mapped.length >= 4, "Should map all root categories");

    // 1. Top-Level Category: Disposable
    const disposable = mapped.find((c) => c.title === "Disposable");
    assert.ok(disposable, "Disposable must exist");
    assert.equal(disposable.url, "/category/disposable-1");
    assert.ok(disposable.children && disposable.children.length === 2, "Disposable has 2 subcategories: Voltbar and Flyto");

    // 2. Subcategory: Voltbar
    const voltbar = disposable.children.find((s) => s.title === "Voltbar");
    assert.ok(voltbar, "Voltbar subcategory must exist");
    assert.equal(voltbar.url, "/category/voltbar");
    assert.ok(voltbar.children && voltbar.children.length === 3, "Voltbar must have 3 child categories");

    // 3. Child categories under Voltbar
    const expectedVoltbarChildren = ["Voltbar 12K Cartridge", "Voltbar Switch Battery", "Voltbar 12K Kit"];
    for (const childTitle of expectedVoltbarChildren) {
      const child = voltbar.children.find((c) => c.title === childTitle);
      assert.ok(child, `Child category ${childTitle} must exist under Voltbar`);
      assert.ok(child.url?.startsWith("/category/"), `Child category URL must start with /category/`);
      assert.equal(child.children, undefined, "Child category must NOT have further children");
    }

    // 4. Subcategory: Flyto
    const flyto = disposable.children.find((s) => s.title === "Flyto");
    assert.ok(flyto, "Flyto subcategory must exist");
    assert.equal(flyto.url, "/category/flyto-2");
    assert.ok(flyto.children && flyto.children.length === 4, "Flyto must have 4 child categories");

    // 5. Top-Level Category: Devices
    const devices = mapped.find((c) => c.title === "Devices");
    assert.ok(devices, "Devices must exist");
    assert.equal(devices.url, "/category/devices-1");
    assert.ok(devices.children && devices.children.length === 3, "Devices has 3 subcategories: Mods, Pod Mods, Pod Systems");

    // 6. Subcategory: Pod Mods (NO children - empty child menu prevention)
    const podMods = devices.children.find((s) => s.title === "Pod Mods");
    assert.ok(podMods, "Pod Mods must exist");
    assert.equal(podMods.url, "/category/pod-mods");
    assert.equal(podMods.children, undefined, "Pod Mods has 0 children: children must be undefined so NO empty submenu appears");

    // 7. Subcategory: Mods (has child: Rincoe)
    const mods = devices.children.find((s) => s.title === "Mods");
    assert.ok(mods, "Mods must exist");
    assert.equal(mods.children?.length, 1);
    assert.equal(mods.children[0].title, "Rincoe");
    assert.equal(mods.children[0].children, undefined);

    // 8. Categories without subcategories (Nicsalt Juice, Freebase juice)
    const nicsalt = mapped.find((c) => c.title === "Nicsalt Juice");
    assert.ok(nicsalt, "Nicsalt Juice must exist");
    assert.equal(nicsalt.url, "/category/nicsalt-juice-1");
    assert.equal(nicsalt.children, undefined, "Nicsalt Juice has no subcategories: children must be undefined");

    const freebase = mapped.find((c) => c.title.toLowerCase().includes("freebase"));
    assert.ok(freebase, "Freebase juice must exist");
    assert.equal(freebase.children, undefined, "Freebase juice has no subcategories: children must be undefined");
  });
});
