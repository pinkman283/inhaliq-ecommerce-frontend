import { describe, it, expect } from "vitest";
import { en } from "@/locales/en";
import { bn } from "@/locales/bn";

function getLeafKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe("i18n Dictionaries & Parity", () => {
  const enKeys = getLeafKeys(en).sort();
  const bnKeys = getLeafKeys(bn).sort();

  it("has exact namespace and key parity between English and Bangla", () => {
    expect(bnKeys).toEqual(enKeys);
  });

  it("ensures no translation key in Bangla dictionary is empty", () => {
    bnKeys.forEach((key) => {
      const parts = key.split(".");
      let val: any = bn;
      for (const part of parts) {
        val = val[part];
      }
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    });
  });

  it("differentiates 'Checkout' from 'Place Order' in Bangla glossary", () => {
    // Checkout: Cart drawer CTA (অর্ডার সম্পন্ন করুন)
    // Place Order: Checkout page final submit button (অর্ডার কনফার্ম করুন)
    expect(bn.cart.checkout).not.toEqual(bn.checkout.placeOrder);
    expect(bn.cart.checkout).toBe("অর্ডার সম্পন্ন করুন");
    expect(bn.checkout.placeOrder).toBe("অর্ডার কনফার্ম করুন");
  });

  it("uses natural Bangladeshi e-commerce terminology", () => {
    expect(bn.common.addToCart).toBe("কার্টে যোগ করুন");
    expect(bn.common.buyNow).toBe("এখনই কিনুন");
    expect(bn.nav.trackOrder).toBe("অর্ডার ট্র্যাক");
    expect(bn.footer.nationwideDelivery).toBe("সারাদেশে ডেলিভারি");
    expect(bn.footer.authenticGuarantee).toBe("১০০% আসল পণ্যের নিশ্চয়তা");
    expect(bn.footer.cashOnDelivery).toBe("ক্যাশ অন ডেলিভারি");
  });
});

