import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/components/providers/LanguageProvider";

function TestConsumer() {
  const { locale, isBangla, toggleLocale, setLocale, t, formatPrice, toLocalDigits } = useLanguage();

  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="is-bangla">{isBangla ? "yes" : "no"}</span>
      <span data-testid="translated-title">{t("nav.allProducts")}</span>
      <span data-testid="interpolated">{t("common.itemsCount", { count: 3 })}</span>
      <span data-testid="fallback-key">{t("nonexistent.key.here", undefined, "Fallback Text")}</span>
      <span data-testid="local-digits">{toLocalDigits("3")}</span>
      <span data-testid="protected-sku">{toLocalDigits("ORD-2026-99")}</span>
      <button onClick={toggleLocale} data-testid="toggle-btn">
        Toggle
      </button>
      <button onClick={() => setLocale("bn")} data-testid="set-bn-btn">
        Set BN
      </button>
      <button onClick={() => setLocale("en")} data-testid="set-en-btn">
        Set EN
      </button>
    </div>
  );
}

describe("LanguageProvider and useLanguage hook", () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = "app_language=; path=/; max-age=0";
    document.documentElement.lang = "en";
  });

  it("initializes with default locale 'en'", () => {
    render(
      <LanguageProvider initialLocale="en">
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("current-locale").textContent).toBe("en");
    expect(screen.getByTestId("is-bangla").textContent).toBe("no");
    expect(screen.getByTestId("translated-title").textContent).toBe("All Products");
    expect(screen.getByTestId("interpolated").textContent).toBe("3 items");
  });

  it("initializes with 'bn' when initialLocale is 'bn'", () => {
    render(
      <LanguageProvider initialLocale="bn">
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("current-locale").textContent).toBe("bn");
    expect(screen.getByTestId("is-bangla").textContent).toBe("yes");
    expect(screen.getByTestId("translated-title").textContent).toBe("সব পণ্য");
    expect(screen.getByTestId("interpolated").textContent).toBe("৩ টি পণ্য");
  });

  it("toggles between English and Bangla on toggleLocale()", () => {
    render(
      <LanguageProvider initialLocale="en">
        <TestConsumer />
      </LanguageProvider>
    );

    const toggleBtn = screen.getByTestId("toggle-btn");

    // Click to switch to Bangla
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId("current-locale").textContent).toBe("bn");
    expect(screen.getByTestId("is-bangla").textContent).toBe("yes");
    expect(screen.getByTestId("translated-title").textContent).toBe("সব পণ্য");
    expect(document.cookie).toContain("app_language=bn");
    expect(document.documentElement.lang).toBe("bn");

    // Click again to switch back to English
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId("current-locale").textContent).toBe("en");
    expect(screen.getByTestId("is-bangla").textContent).toBe("no");
    expect(screen.getByTestId("translated-title").textContent).toBe("All Products");
    expect(document.cookie).toContain("app_language=en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("handles missing keys with fallback and dev warning", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <LanguageProvider initialLocale="bn">
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("fallback-key").textContent).toBe("Fallback Text");

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("preserves protected identifiers without converting to Bengali numerals", () => {
    render(
      <LanguageProvider initialLocale="bn">
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("local-digits").textContent).toBe("৩");
    // ORD-2026-99 must NOT have digits converted to Bengali
    expect(screen.getByTestId("protected-sku").textContent).toBe("ORD-2026-99");
  });
});

