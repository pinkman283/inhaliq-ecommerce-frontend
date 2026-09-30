/**
 * Global Storefront Feature Flags & Presentation Configuration
 * 
 * To change these settings:
 * 1. Modify the flags below directly, OR
 * 2. Set the corresponding environment variable in .env.local (e.g. NEXT_PUBLIC_SHOW_TOP_ANNOUNCEMENT="true")
 */
export const STOREFRONT_CONFIG = {
  /**
   * Top announcement / coupon bar above the navbar (e.g. Fast Dispatch, courier code, etc.).
   * DEFAULT: false (OFF)
   * To enable: set to true or define NEXT_PUBLIC_SHOW_TOP_ANNOUNCEMENT="true"
   */
  SHOW_TOP_ANNOUNCEMENT: process.env.NEXT_PUBLIC_SHOW_TOP_ANNOUNCEMENT === "true",

  /**
   * Bottom promotional section on the homepage (DiscountVoucherCarousel / flash release banners).
   * DEFAULT: false (OFF)
   * To enable: set to true or define NEXT_PUBLIC_SHOW_BOTTOM_PROMOTION="true"
   */
  SHOW_BOTTOM_PROMOTION: process.env.NEXT_PUBLIC_SHOW_BOTTOM_PROMOTION === "true",

  /**
   * Light 4-card benefit strip on the homepage (Fast Express Delivery, Cash on Delivery, etc.).
   * DEFAULT: false (OFF / Hidden)
   * To enable: set to true or define NEXT_PUBLIC_SHOW_BENEFIT_CARDS="true"
   */
  SHOW_BENEFIT_CARDS: process.env.NEXT_PUBLIC_SHOW_BENEFIT_CARDS === "true",

  /**
   * Centralized Default Card Corner Radius across storefront.
   * Moderately rounded (clean, professional, not excessively bubbly).
   * DEFAULT: "10px" (0.625rem)
   */
  DEFAULT_CARD_RADIUS: process.env.NEXT_PUBLIC_DEFAULT_CARD_RADIUS || "8px",

  /**
   * Centralized Inhaliq Brand Default Theme Colors.
   * Single source of truth for the storefront's default/fallback color palette.
   */
  THEME_COLORS: {
    PRIMARY: process.env.NEXT_PUBLIC_THEME_PRIMARY || "#006B45",
    PRIMARY_HOVER: process.env.NEXT_PUBLIC_THEME_PRIMARY_HOVER || "#005238",
    SECONDARY: process.env.NEXT_PUBLIC_THEME_SECONDARY || "#C6A15B",
    SECONDARY_HOVER: process.env.NEXT_PUBLIC_THEME_SECONDARY_HOVER || "#AD8A45",
  },

  /**
   * Controls theme color precedence:
   * - When `true` (default during this temporary frontend phase): The frontend defaults above (#006B45 / #C6A15B)
   *   take precedence over the uncustomized Senior API backend colors (#1c2942).
   * - When `false` (when user's custom admin backend is ready): Backend/Admin theme settings
   *   take precedence over frontend defaults.
   * To disable override: set NEXT_PUBLIC_OVERRIDE_BACKEND_THEME_COLORS="false"
   */
  OVERRIDE_BACKEND_THEME_COLORS: process.env.NEXT_PUBLIC_OVERRIDE_BACKEND_THEME_COLORS !== "false",
};
