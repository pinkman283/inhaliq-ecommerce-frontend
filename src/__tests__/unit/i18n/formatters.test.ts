import { describe, it, expect } from "vitest";
import {
  toBengaliDigits,
  isProtectedIdentifier,
  formatNumber,
  formatCurrency,
  formatDate,
} from "@/lib/i18n/formatters";

describe("i18n formatters", () => {
  describe("toBengaliDigits", () => {
    it("converts ASCII numerals to Bengali numerals", () => {
      expect(toBengaliDigits("0123456789")).toBe("০১২৩৪৫৬৭৮৯");
      expect(toBengaliDigits(12345)).toBe("১২৩৪৫");
    });

    it("preserves non-numeric characters", () => {
      expect(toBengaliDigits("৳1,200.50")).toBe("৳১,২০০.৫০");
      expect(toBengaliDigits("Item 5 of 10")).toBe("Item ৫ of ১০");
    });

    it("handles empty and falsy input gracefully", () => {
      expect(toBengaliDigits("")).toBe("");
      expect(toBengaliDigits(null as any)).toBe("");
      expect(toBengaliDigits(undefined as any)).toBe("");
    });
  });

  describe("isProtectedIdentifier", () => {
    it("protects Bangladeshi phone numbers", () => {
      expect(isProtectedIdentifier("01712345678")).toBe(true);
      expect(isProtectedIdentifier("+8801812345678")).toBe(true);
      expect(isProtectedIdentifier("01999999999")).toBe(true);
    });

    it("protects alphanumeric SKUs and Order IDs", () => {
      expect(isProtectedIdentifier("ORD-2026-9921")).toBe(true);
      expect(isProtectedIdentifier("SKU_PROD_102")).toBe(true);
      expect(isProtectedIdentifier("INV-10928")).toBe(true);
    });

    it("protects tracking numbers", () => {
      expect(isProtectedIdentifier("TRK98765432")).toBe(true);
      expect(isProtectedIdentifier("REDX123456")).toBe(true);
    });

    it("does not protect standard counts and amounts", () => {
      expect(isProtectedIdentifier("5")).toBe(false);
      expect(isProtectedIdentifier("1200")).toBe(false);
      expect(isProtectedIdentifier("99")).toBe(false);
    });
  });

  describe("formatNumber", () => {
    it("formats standard numbers in English locale", () => {
      const formatted = formatNumber(12500, "en");
      expect(formatted).toBe("12,500");
    });

    it("formats standard numbers in Bengali locale", () => {
      const formatted = formatNumber(12500, "bn");
      // Intl in Bengali locale outputs Bengali numerals with locale grouping
      expect(formatted).toMatch(/[১২৩৪৫৬৭৮৯০,]+/);
    });

    it("handles invalid numbers gracefully", () => {
      expect(formatNumber(NaN, "en")).toBe("0");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency with default ৳ symbol in English", () => {
      expect(formatCurrency(1500, "en")).toBe("৳1,500");
    });

    it("formats currency in Bengali without mutating price values", () => {
      const res = formatCurrency(2500, "bn");
      expect(res.startsWith("৳")).toBe(true);
      expect(res).toMatch(/৳[১২৩৪৫৬৭৮৯০,]+/);
    });

    it("allows custom currency symbols", () => {
      expect(formatCurrency(50, "en", "$")).toBe("$50");
    });
  });

  describe("formatDate", () => {
    it("formats dates into readable English strings", () => {
      const dateStr = "2026-10-28T00:00:00Z";
      const formatted = formatDate(dateStr, "en");
      expect(formatted).toContain("2026");
    });

    it("formats dates into Bengali locale without throwing", () => {
      const dateStr = "2026-10-28T00:00:00Z";
      const formatted = formatDate(dateStr, "bn");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("handles invalid date strings gracefully", () => {
      expect(formatDate("invalid-date", "en")).toBe("invalid-date");
    });
  });
});
