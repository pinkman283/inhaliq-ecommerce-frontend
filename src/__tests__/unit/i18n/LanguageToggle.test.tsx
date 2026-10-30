import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";

describe("LanguageToggle Component", () => {
  beforeEach(() => {
    document.cookie = "app_language=; path=/; max-age=0";
    document.documentElement.lang = "en";
  });

  describe("Desktop Variant (default)", () => {
    it("renders both English and বাংলা options with appropriate aria attributes", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="desktop" />
        </LanguageProvider>
      );

      const enBtn = screen.getByRole("button", { name: /English language/i });
      const bnBtn = screen.getByRole("button", { name: /বাংলা ভাষা/i });

      expect(enBtn).toBeDefined();
      expect(bnBtn).toBeDefined();
      expect(enBtn.getAttribute("aria-pressed")).toBe("true");
      expect(bnBtn.getAttribute("aria-pressed")).toBe("false");
    });

    it("switches to Bangla when clicking the বাংলা button", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="desktop" />
        </LanguageProvider>
      );

      const bnBtn = screen.getByRole("button", { name: /বাংলা ভাষা/i });
      const enBtn = screen.getByRole("button", { name: /English language/i });

      act(() => {
        fireEvent.click(bnBtn);
      });

      expect(bnBtn.getAttribute("aria-pressed")).toBe("true");
      expect(enBtn.getAttribute("aria-pressed")).toBe("false");
      expect(document.cookie).toContain("app_language=bn");
      expect(document.documentElement.lang).toBe("bn");
    });

    it("switches back to English when clicking the EN button", () => {
      render(
        <LanguageProvider initialLocale="bn">
          <LanguageToggle variant="desktop" />
        </LanguageProvider>
      );

      const enBtn = screen.getByRole("button", { name: /English language/i });
      const bnBtn = screen.getByRole("button", { name: /বাংলা ভাষা/i });

      expect(bnBtn.getAttribute("aria-pressed")).toBe("true");

      act(() => {
        fireEvent.click(enBtn);
      });

      expect(enBtn.getAttribute("aria-pressed")).toBe("true");
      expect(bnBtn.getAttribute("aria-pressed")).toBe("false");
      expect(document.cookie).toContain("app_language=en");
      expect(document.documentElement.lang).toBe("en");
    });
  });

  describe("Compact Variant", () => {
    it("renders compact toggle button showing prompt to switch", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="compact" />
        </LanguageProvider>
      );

      const toggleBtn = screen.getByRole("button");
      expect(toggleBtn.textContent).toContain("বাং");
      expect(toggleBtn.getAttribute("aria-pressed")).toBe("false");
      expect(toggleBtn.getAttribute("aria-label")).toContain("Switch language to Bangla");
    });

    it("toggles locale back and forth when clicked", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="compact" />
        </LanguageProvider>
      );

      const toggleBtn = screen.getByRole("button");

      // Click to toggle to Bangla
      act(() => {
        fireEvent.click(toggleBtn);
      });

      expect(toggleBtn.textContent).toContain("EN");
      expect(toggleBtn.getAttribute("aria-pressed")).toBe("true");
      expect(toggleBtn.getAttribute("aria-label")).toContain("Switch language to English");
      expect(document.documentElement.lang).toBe("bn");

      // Click again to return to English
      act(() => {
        fireEvent.click(toggleBtn);
      });

      expect(toggleBtn.textContent).toContain("বাং");
      expect(toggleBtn.getAttribute("aria-pressed")).toBe("false");
      expect(document.documentElement.lang).toBe("en");
    });
  });

  describe("Mobile Drawer Variant", () => {
    it("renders language label and segmented buttons", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="mobile" />
        </LanguageProvider>
      );

      expect(screen.getByText("Language / ভাষা")).toBeDefined();
      const enBtn = screen.getByRole("button", { name: "English" });
      const bnBtn = screen.getByRole("button", { name: "বাংলা" });

      expect(enBtn.getAttribute("aria-pressed")).toBe("true");
      expect(bnBtn.getAttribute("aria-pressed")).toBe("false");
    });

    it("switches language when clicking mobile segmented buttons", () => {
      render(
        <LanguageProvider initialLocale="en">
          <LanguageToggle variant="mobile" />
        </LanguageProvider>
      );

      const bnBtn = screen.getByRole("button", { name: "বাংলা" });
      const enBtn = screen.getByRole("button", { name: "English" });

      act(() => {
        fireEvent.click(bnBtn);
      });

      expect(bnBtn.getAttribute("aria-pressed")).toBe("true");
      expect(enBtn.getAttribute("aria-pressed")).toBe("false");
      expect(document.documentElement.lang).toBe("bn");
    });
  });
});

