import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("RootLayout SSR & Hydration Integrity", () => {
  const layoutPath = path.resolve(__dirname, "../../../app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf8");

  it("does not manually render an empty <head /> tag inside RootLayout JSX", () => {
    // Next.js App Router forbids manual <head /> in root layout because it causes React 19 hydration mismatch
    const hasManualHead = /<head\s*\/>/i.test(layoutContent);
    expect(hasManualHead).toBe(false);
  });

  it("includes data-scroll-behavior='smooth' on html element", () => {
    expect(layoutContent).toContain('data-scroll-behavior="smooth"');
  });

  it("includes suppressHydrationWarning on root html and body elements", () => {
    expect(layoutContent).toMatch(/<html[\s\S]*?suppressHydrationWarning/);
    expect(layoutContent).toMatch(/<body[\s\S]*?suppressHydrationWarning/);
  });

  it("includes suppressHydrationWarning on injected theme-server-vars style element", () => {
    expect(layoutContent).toMatch(/id="theme-server-vars"[\s\S]*?suppressHydrationWarning/);
  });

  it("conditionally guards split reveal image preload", () => {
    // Should not preload split_reveal_image unconditionally to prevent unused preload console warnings
    expect(layoutContent).toContain("initialTheme.split_reveal_enabled && serverTheme.split_reveal_image");
  });
});

