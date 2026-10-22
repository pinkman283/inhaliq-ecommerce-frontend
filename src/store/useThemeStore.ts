import { create } from "zustand";
import axios from "axios";
import { STOREFRONT_CONFIG } from "@/config/storefrontConfig";

export interface ThemeSettings {
  theme_primary_color: string;
  theme_primary_hover?: string;
  theme_secondary_color: string;
  theme_secondary_hover?: string;
  theme_accent_gradient: string;
  theme_bg_color: string;
  theme_card_bg_color: string;
  theme_card_border_color?: string;
  theme_text_heading_color?: string;
  theme_text_body_color?: string;
  theme_btn_primary_bg?: string;
  theme_btn_primary_text?: string;
  theme_btn_secondary_bg?: string;
  theme_btn_secondary_text?: string;
  theme_tab_active_bg?: string;
  theme_tab_active_text?: string;
  theme_view_all_color?: string;
  theme_hover_bg?: string;
  theme_hover_text?: string;
  theme_nav_btn_bg?: string;
  theme_nav_btn_color?: string;
  theme_footer_bg_color?: string;
  theme_footer_text_color?: string;
  theme_radius: "rounded-none" | "rounded-md" | "rounded-lg" | "rounded-xl" | "rounded-2xl" | string;
  theme_card_radius?: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_badge: string;
  navbar_promo_enabled?: boolean;
  navbar_promo_discount_text?: string;
  navbar_promo_code?: string;
  navbar_promo_link?: string;
  store_brand_name: string;
  store_brand_tagline: string;
  store_brand_logo?: string;
  store_favicon?: string;
  logo_placements?: Record<string, string>;
  hero_headline_line1: string;
  hero_headline_line2_gradient: string;
  hero_headline_line3: string;
  hero_subheading: string;
  hero_badge_text: string;
  split_reveal_enabled: boolean;
  split_reveal_image: string;
  split_reveal_logo: string;
  split_reveal_title: string;
  split_reveal_subtitle: string;
  split_reveal_duration: number;
  split_reveal_mode: "every_time" | "once_per_session" | string;
  split_reveal_dim: number;
  split_reveal_direction: "vertical" | "horizontal" | string;
  // WhatsApp Customer Support Settings
  whatsapp_support_enabled?: boolean;
  whatsapp_phone_number?: string;
  whatsapp_default_message?: string;
  // Flash Deals Campaign Settings
  flash_deals_enabled?: boolean;
  flash_deals_title?: string;
  flash_deals_badge?: string;
  // Trust & Customer Reassurance Settings
  trust_ribbon_enabled?: boolean;
  trust_ribbon_title_1?: string;
  trust_ribbon_desc_1?: string;
  trust_ribbon_title_2?: string;
  trust_ribbon_desc_2?: string;
  trust_ribbon_title_3?: string;
  trust_ribbon_desc_3?: string;
  trust_ribbon_title_4?: string;
  trust_ribbon_desc_4?: string;
  // Shipping Display Settings
  shipping_inside_dhaka_rate?: number;
  shipping_outside_dhaka_rate?: number;
  shipping_free_threshold?: number;
  // Product Reviews & Ratings Storefront Visibility
  reviews_enabled?: boolean;
  // Deals & Promotional Quick Navigation Settings
  nav_deals_enabled?: boolean;
  nav_deals_text?: string;
  nav_deals_link?: string;
  category_deals_card_enabled?: boolean;
  category_deals_card_title?: string;
  category_deals_card_subtitle?: string;
  category_deals_card_link?: string;
  // Footer Guarantees & Features Strip Settings
  footer_features_enabled?: boolean;
  footer_feature_title_1?: string;
  footer_feature_desc_1?: string;
  footer_feature_link_1?: string;
  footer_feature_title_2?: string;
  footer_feature_desc_2?: string;
  footer_feature_link_2?: string;
  footer_feature_title_3?: string;
  footer_feature_desc_3?: string;
  footer_feature_link_3?: string;
  footer_feature_title_4?: string;
  footer_feature_desc_4?: string;
  footer_feature_link_4?: string;
  // Customer Auth Page Customization
  customer_auth_bg_image?: string;
  customer_auth_bg_color?: string;
  customer_auth_card_position?: "left" | "center" | "right";
  // SEO & Knowledge Graph Settings
  seo_meta?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    google_site_verification?: string;
    bing_site_verification?: string;
    canonical_base_url?: string;
    og_image?: string;
  };
  business_contact?: {
    legal_name?: string;
    hotline?: string;
    support_email?: string;
    whatsapp_number?: string;
    warehouse_address?: string;
  };
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  theme_primary_color: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY,
  theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
  theme_secondary_color: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY,
  theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
  theme_accent_gradient: "emerald-teal",
  theme_bg_color: "#F8FAFC",
  theme_card_bg_color: "#FFFFFF",
  theme_card_border_color: "#E2E8F0",
  theme_text_heading_color: "#0F172A",
  theme_text_body_color: "#475569",
  theme_btn_primary_bg: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY,
  theme_btn_primary_text: "#FFFFFF",
  theme_btn_secondary_bg: "#F1F5F9",
  theme_btn_secondary_text: "#0F172A",
  theme_tab_active_bg: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY,
  theme_tab_active_text: "#FFFFFF",
  theme_view_all_color: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY,
  theme_hover_bg: "rgba(15, 23, 42, 0.05)",
  theme_hover_text: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
  theme_nav_btn_bg: "#FFFFFF",
  theme_nav_btn_color: "#0F172A",
  theme_footer_bg_color: "#0F172A",
  theme_footer_text_color: "#94A3B8",
  theme_radius: "rounded-md",
  theme_card_radius: STOREFRONT_CONFIG.DEFAULT_CARD_RADIUS,
  announcement_enabled: STOREFRONT_CONFIG.SHOW_TOP_ANNOUNCEMENT,
  announcement_text: "Free Express Courier on orders over ৳2,000",
  announcement_badge: "Fast Dispatch: Daily Courier Active",
  navbar_promo_enabled: false,
  navbar_promo_discount_text: "",
  navbar_promo_code: "",
  navbar_promo_link: "/promotions",
  nav_deals_enabled: true,
  nav_deals_text: "Deals",
  nav_deals_link: "/products?discounted=true",
  category_deals_card_enabled: true,
  category_deals_card_title: "Top Deals",
  category_deals_card_subtitle: "Up to 20% Off",
  category_deals_card_link: "/products?discounted=true",
  footer_features_enabled: true,
  footer_feature_title_1: "Nationwide Delivery",
  footer_feature_desc_1: "Fast delivery across Bangladesh",
  footer_feature_link_1: "/shipping-policy",
  footer_feature_title_2: "100% Authentic Guarantee",
  footer_feature_desc_2: "Verified genuine products",
  footer_feature_link_2: "/about",
  footer_feature_title_3: "Cash on Delivery",
  footer_feature_desc_3: "Pay upon order arrival",
  footer_feature_link_3: "/track",
  footer_feature_title_4: "Dedicated Customer Care",
  footer_feature_desc_4: "Prompt expert support",
  footer_feature_link_4: "/contact",
  customer_auth_bg_image: "",
  customer_auth_bg_color: "#F8FAFC",
  customer_auth_card_position: "left",
  store_brand_name: "INHALIQ",
  store_brand_tagline: "ELEVATE EVERY INHALE",
  store_brand_logo: "/branding/logo.png",
  store_favicon: "/favicon.png",
  logo_placements: {},
  hero_headline_line1: "Curated Precision",
  hero_headline_line2_gradient: "Hardware & Audio",
  hero_headline_line3: "& Everyday Carry.",
  hero_subheading: "Engineered with aerospace-grade titanium, custom mechanical acoustics, and tactile everyday carry for creators who refuse mediocrity.",
  hero_badge_text: "2026 Studio Flagship Release",
  split_reveal_enabled: false,
  split_reveal_image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2000&q=85",
  split_reveal_logo: "",
  split_reveal_title: "INHALIQ",
  split_reveal_subtitle: "ELEVATE EVERY INHALE",
  split_reveal_duration: 2.2,
  split_reveal_mode: "every_time",
  split_reveal_dim: 0.45,
  split_reveal_direction: "vertical",
  whatsapp_support_enabled: true,
  whatsapp_phone_number: "+18002384371",
  whatsapp_default_message: "Hello! I would like to inquire about your studio products.",
  flash_deals_enabled: true,
  flash_deals_title: "Limited Time Deals",
  flash_deals_badge: "Flash Deal Drop",
  trust_ribbon_enabled: true,
  trust_ribbon_title_1: "Fast Express Delivery",
  trust_ribbon_desc_1: "Dispatched within 24-48 hours",
  trust_ribbon_title_2: "Cash on Delivery (COD)",
  trust_ribbon_desc_2: "Pay safely upon product arrival",
  trust_ribbon_title_3: "100% Genuine & Authentic",
  trust_ribbon_desc_3: "Official manufacturer warranty coverage",
  trust_ribbon_title_4: "7-Day Easy Replacement",
  trust_ribbon_desc_4: "Hassle-free returns & replacement policy",
  shipping_inside_dhaka_rate: 60,
  shipping_outside_dhaka_rate: 120,
  shipping_free_threshold: 100,
  reviews_enabled: true,
};

export const RADIUS_MAP: Record<string, { root: string; sm: string; md: string; lg: string; xl: string; "2xl": string; "3xl": string; "4xl": string }> = {
  "rounded-none": { root: "0px", sm: "0px", md: "0px", lg: "0px", xl: "0px", "2xl": "0px", "3xl": "0px", "4xl": "0px" },
  "rounded-md": { root: "0.375rem", sm: "0.125rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem", "2xl": "0.75rem", "3xl": "1rem", "4xl": "1.25rem" },
  "rounded-lg": { root: "0.5rem", sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", "4xl": "2rem" },
  "rounded-xl": { root: "0.75rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem", "4xl": "2rem" },
  "rounded-2xl": { root: "1rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "2rem", "4xl": "2.5rem" },
};

export function getThemeCardRadiusPx(radiusKey?: string): number {
  if (!radiusKey) {
    const defaultVal = STOREFRONT_CONFIG.DEFAULT_CARD_RADIUS || "10px";
    return parseInt(defaultVal, 10) || 10;
  }
  if (radiusKey === "rounded-none") return 0;
  if (radiusKey === "rounded-md") return 8;
  if (radiusKey === "rounded-lg") return 10;
  if (radiusKey === "rounded-xl") return 14;
  if (radiusKey === "rounded-2xl") return 18;
  if (radiusKey.endsWith("px")) return Math.max(0, parseInt(radiusKey, 10) || 0);
  return 10;
}

export function getThemeInputRadiusPx(radiusKey?: string): number {
  if (!radiusKey) return 12;
  if (radiusKey === "rounded-none") return 0;
  if (radiusKey === "rounded-md") return 6;
  if (radiusKey === "rounded-lg") return 8;
  if (radiusKey === "rounded-xl") return 12;
  if (radiusKey === "rounded-2xl") return 16;
  if (radiusKey.endsWith("px")) return Math.max(0, Math.round((parseInt(radiusKey, 10) || 12) / 2));
  return 12;
}


export function getHexLuminance(hex: string): number {
  if (!hex || typeof hex !== "string") return 0;
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length < 6) return 0;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getAutoSynchronizedTokens(bgColor: string, primaryColor: string): Partial<ThemeSettings> {
  const isLight = getHexLuminance(bgColor) > 0.45;
  if (isLight) {
    return {
      theme_bg_color: bgColor || "#F8FAFC",
      theme_card_bg_color: "#FFFFFF",
      theme_card_border_color: "#E2E8F0",
      theme_text_heading_color: "#0F172A",
      theme_text_body_color: "#475569",
      theme_btn_primary_bg: primaryColor,
      theme_btn_primary_text: getHexLuminance(primaryColor) > 0.5 ? "#0F172A" : "#FFFFFF",
      theme_btn_secondary_bg: "#F1F5F9",
      theme_btn_secondary_text: "#0F172A",
      theme_tab_active_bg: primaryColor,
      theme_tab_active_text: getHexLuminance(primaryColor) > 0.5 ? "#0F172A" : "#FFFFFF",
      theme_hover_bg: "rgba(15, 23, 42, 0.05)",
      theme_hover_text: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
      theme_nav_btn_bg: "#FFFFFF",
      theme_nav_btn_color: "#0F172A",
    };
  } else {
    return {
      theme_bg_color: bgColor,
      theme_card_bg_color: "#0c101d",
      theme_card_border_color: "rgba(255, 255, 255, 0.1)",
      theme_text_heading_color: "#ffffff",
      theme_text_body_color: "#94a3b8",
      theme_btn_primary_bg: primaryColor,
      theme_btn_primary_text: "#ffffff",
      theme_btn_secondary_bg: "rgba(255, 255, 255, 0.05)",
      theme_btn_secondary_text: "#ffffff",
      theme_tab_active_bg: primaryColor,
      theme_tab_active_text: "#ffffff",
      theme_hover_bg: "rgba(255, 255, 255, 0.08)",
      theme_hover_text: primaryColor,
      theme_nav_btn_bg: "#0c101d",
      theme_nav_btn_color: "#ffffff",
    };
  }
}

export function applyThemeToDOM(theme: ThemeSettings) {
  if (typeof document === "undefined") return;

  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  if (isAdmin) {
    document.body.classList.add("admin-body");
    document.body.classList.remove("theme-light-mode");
    const root = document.documentElement;
    root.classList.remove("theme-light-mode");
    root.style.removeProperty("--theme-text-heading");
    root.style.removeProperty("--theme-text-body");
    root.style.removeProperty("--theme-text-main");
    root.style.removeProperty("--theme-text-sub");
    return;
  }

  document.body.classList.remove("admin-body");
  const root = document.documentElement;

  // Calculate Light vs Dark mode based on background luminance
  const isLightMode = getHexLuminance(theme.theme_bg_color) > 0.45;
  document.body.classList.toggle("theme-light-mode", isLightMode);
  root.classList.toggle("theme-light-mode", isLightMode);

  // Core Canvas & Brand Accent Tokens
  const primaryColor = theme.theme_primary_color || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
  const primaryHover = theme.theme_primary_hover || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER;
  const secondaryColor = theme.theme_secondary_color || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY;
  const secondaryHover = theme.theme_secondary_hover || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER;

  root.style.setProperty("--theme-primary", primaryColor);
  root.style.setProperty("--theme-primary-hover", primaryHover);
  root.style.setProperty("--theme-secondary", secondaryColor);
  root.style.setProperty("--theme-secondary-hover", secondaryHover);
  root.style.setProperty("--theme-bg", theme.theme_bg_color || (isLightMode ? "#F8FAFC" : "#090a0f"));
  root.style.setProperty("--theme-bg-muted", isLightMode ? "#F1F5F9" : "#0e121e");
  root.style.setProperty("--theme-card-bg", theme.theme_card_bg_color || (isLightMode ? "#FFFFFF" : "#0c101d"));

  // Typography Tokens
  const headingColor = theme.theme_text_heading_color || (isLightMode ? "#0F172A" : "#ffffff");
  const bodyColor = theme.theme_text_body_color || (isLightMode ? "#475569" : "#94a3b8");
  root.style.setProperty("--theme-text-heading", headingColor);
  root.style.setProperty("--theme-text-body", bodyColor);
  root.style.setProperty("--theme-text-main", headingColor);
  root.style.setProperty("--theme-text-sub", bodyColor);

  // Card Border Token
  const cardBorder = theme.theme_card_border_color || (isLightMode ? "#E2E8F0" : "rgba(255, 255, 255, 0.08)");
  root.style.setProperty("--theme-card-border", cardBorder);
  root.style.setProperty("--theme-border-sub", cardBorder);

  // Buttons & CTAs Tokens
  root.style.setProperty("--theme-btn-primary-bg", theme.theme_btn_primary_bg || primaryColor);
  root.style.setProperty("--theme-btn-primary-text", theme.theme_btn_primary_text || "#FFFFFF");
  root.style.setProperty("--theme-btn-secondary-bg", theme.theme_btn_secondary_bg || (isLightMode ? "#F1F5F9" : "rgba(255, 255, 255, 0.05)"));
  root.style.setProperty("--theme-btn-secondary-text", theme.theme_btn_secondary_text || (isLightMode ? "#0F172A" : "#ffffff"));
  root.style.setProperty("--theme-btn-bg", theme.theme_btn_primary_bg || primaryColor);

  // Tabs & Navigation Tokens
  const tabActiveBg = theme.theme_tab_active_bg || theme.theme_view_all_color || primaryColor;
  const tabActiveText = theme.theme_tab_active_text || (getHexLuminance(tabActiveBg) > 0.5 ? "#0F172A" : "#FFFFFF");
  const viewAllColor = theme.theme_view_all_color || tabActiveBg;
  root.style.setProperty("--theme-tab-active-bg", tabActiveBg);
  root.style.setProperty("--theme-tab-active-text", tabActiveText);
  root.style.setProperty("--theme-view-all-color", viewAllColor);

  // Carousel & Navigation Arrow Tokens
  const navBg = theme.theme_nav_btn_bg || (isLightMode ? "#FFFFFF" : theme.theme_card_bg_color || "#0c101d");
  const navColor = theme.theme_nav_btn_color || (isLightMode ? "#0F172A" : "#ffffff");
  root.style.setProperty("--theme-nav-btn-bg", navBg);
  root.style.setProperty("--theme-nav-btn-text", navColor);

  // Hover & Interactive Tokens
  root.style.setProperty("--theme-hover-bg", theme.theme_hover_bg || (isLightMode ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.08)"));
  root.style.setProperty("--theme-hover-text", theme.theme_hover_text || (isLightMode ? primaryHover : primaryColor));
  root.style.setProperty("--theme-hover-accent", theme.theme_hover_text || (isLightMode ? primaryHover : primaryColor));

  // Footer Surface & Typography Tokens
  const footerBg = theme.theme_footer_bg_color || (isLightMode ? "#0F172A" : "#1f242e");
  const isFooterLight = getHexLuminance(footerBg) > 0.45;
  const footerText = theme.theme_footer_text_color || (isFooterLight ? "#475569" : "#94A3B8");
  const footerBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.08)";
  const footerHeading = isFooterLight ? "#0F172A" : "#FFFFFF";
  const footerRibbonBg = isFooterLight ? "#F1F5F9" : "rgba(255, 255, 255, 0.02)";
  const footerInputBg = isFooterLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.08)";
  const footerInputBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.15)";
  const footerInputText = isFooterLight ? "#0F172A" : "#FFFFFF";
  const footerSocialBg = isFooterLight ? "#F1F5F9" : "rgba(255, 255, 255, 0.08)";
  const footerSocialBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";
  const footerLogoBg = isFooterLight ? "#FFFFFF" : "#1E293B";

  root.style.setProperty("--theme-footer-bg", footerBg);
  root.style.setProperty("--theme-footer-text", footerText);
  root.style.setProperty("--theme-footer-border", footerBorder);
  root.style.setProperty("--theme-footer-heading", footerHeading);
  root.style.setProperty("--theme-footer-ribbon-bg", footerRibbonBg);
  root.style.setProperty("--theme-footer-input-bg", footerInputBg);
  root.style.setProperty("--theme-footer-input-border", footerInputBorder);
  root.style.setProperty("--theme-footer-input-text", footerInputText);
  root.style.setProperty("--theme-footer-social-bg", footerSocialBg);
  root.style.setProperty("--theme-footer-social-border", footerSocialBorder);
  root.style.setProperty("--theme-footer-logo-inner-bg", footerLogoBg);

  const radiusConfig = RADIUS_MAP[theme.theme_radius] || RADIUS_MAP["rounded-md"];
  root.style.setProperty("--radius", radiusConfig.root);
  root.style.setProperty("--radius-sm", radiusConfig.sm);
  root.style.setProperty("--radius-md", radiusConfig.md);
  root.style.setProperty("--radius-lg", radiusConfig.lg);
  root.style.setProperty("--radius-xl", radiusConfig.xl);
  root.style.setProperty("--radius-2xl", radiusConfig["2xl"]);
  root.style.setProperty("--radius-3xl", radiusConfig["3xl"]);
  root.style.setProperty("--radius-4xl", radiusConfig["4xl"]);
  root.style.setProperty("--theme-card-radius", theme.theme_card_radius || STOREFRONT_CONFIG.DEFAULT_CARD_RADIUS || "8px");
  root.style.setProperty("--theme-btn-radius", "6px");
  root.style.setProperty("--theme-input-radius", "6px");
}

interface ThemeState {
  theme: ThemeSettings;
  isLoaded: boolean;
  setTheme: (theme: Partial<ThemeSettings>) => void;
  fetchTheme: () => Promise<void>;
}

const API_BASE_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api")
  : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api");

export function initThemeFromCache(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cached = localStorage.getItem("aether_active_theme_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      const restored = { ...DEFAULT_THEME_SETTINGS, ...parsed };
      if (STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS) {
        restored.theme_primary_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
        restored.theme_primary_hover = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER;
        restored.theme_secondary_color = STOREFRONT_CONFIG.THEME_COLORS.SECONDARY;
        restored.theme_secondary_hover = STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER;
        restored.theme_btn_primary_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
        restored.theme_tab_active_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
        restored.theme_view_all_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
        restored.theme_hover_text = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
      }
      useThemeStore.setState({
        theme: restored,
        isLoaded: true,
      });
      applyThemeToDOM(restored);
      return true;
    }
  } catch (e) {}
  return false;
}

const getInitialClientTheme = (): ThemeSettings => {
  if (typeof window !== "undefined") {
    try {
      const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior";
      const cached = localStorage.getItem("aether_active_theme_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        const restored = { ...DEFAULT_THEME_SETTINGS, ...parsed };
        if (provider === "senior") {
          restored.theme_bg_color = "#F8FAFC";
          restored.theme_card_bg_color = "#FFFFFF";
          restored.theme_card_border_color = "#E2E8F0";
          restored.theme_text_heading_color = "#0F172A";
          restored.theme_text_body_color = "#475569";
          restored.theme_primary_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_primary_hover = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER;
          restored.theme_btn_primary_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_tab_active_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_view_all_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_hover_text = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER;
          restored.theme_hover_bg = "rgba(15, 23, 42, 0.05)";
        }
        if (STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS) {
          restored.theme_primary_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_primary_hover = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER;
          restored.theme_secondary_color = STOREFRONT_CONFIG.THEME_COLORS.SECONDARY;
          restored.theme_secondary_hover = STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER;
          restored.theme_btn_primary_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_tab_active_bg = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_view_all_color = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
          restored.theme_hover_text = STOREFRONT_CONFIG.THEME_COLORS.PRIMARY;
        }
        return restored;
      }
    } catch (e) {}
  }
  return DEFAULT_THEME_SETTINGS;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialClientTheme(),
  isLoaded: typeof window !== "undefined" && Boolean(localStorage.getItem("aether_active_theme_cache")),

  setTheme: (partialTheme) => {
    const updated = { ...get().theme, ...partialTheme };
    set({ theme: updated, isLoaded: true });
    applyThemeToDOM(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("aether_active_theme_cache", JSON.stringify(updated));
      } catch (e) {}
    }
  },

  fetchTheme: async () => {
    try {
      const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior";
      if (provider === "senior") {
        const res = await axios.get("/api/storefront/init-settings", {
          timeout: 8000,
        });
        if (res.data?.success && res.data?.data) {
          const init = res.data.data;
          const rawPrimary = init.main_settings?.primary_color;
          const rawSecondary = init.main_settings?.secondary_color;
          const primaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.PRIMARY
            : (rawPrimary || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY);
          const secondaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.SECONDARY
            : (rawSecondary || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY);

          const loadedTheme: ThemeSettings = {
            ...DEFAULT_THEME_SETTINGS,
            store_brand_name: init.general_settings?.name || DEFAULT_THEME_SETTINGS.store_brand_name,
            store_brand_logo: init.general_settings?.white_logo || init.general_settings?.logo || DEFAULT_THEME_SETTINGS.store_brand_logo,
            store_favicon: init.general_settings?.favicon || DEFAULT_THEME_SETTINGS.store_favicon,
            theme_primary_color: primaryColor,
            theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
            theme_secondary_color: secondaryColor,
            theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
            theme_btn_primary_bg: primaryColor,
            theme_tab_active_bg: primaryColor,
            theme_view_all_color: primaryColor,
            theme_hover_text: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
            theme_footer_bg_color: init.main_settings?.footer_color || "#0F172A",
            theme_bg_color: "#F8FAFC",
            theme_card_bg_color: "#FFFFFF",
            theme_card_border_color: "#E2E8F0",
            theme_text_heading_color: "#0F172A",
            theme_text_body_color: "#475569",
          };
          set({ theme: loadedTheme, isLoaded: true });
          applyThemeToDOM(loadedTheme);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("aether_active_theme_cache", JSON.stringify(loadedTheme));
            } catch (e) {}
          }
          return;
        }
      }

      const res = await axios.get(`${API_BASE_URL}/theme-settings`, {
        timeout: 8000,
      });
      if (res.data) {
        const backendData = res.data;
        const primaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
          ? STOREFRONT_CONFIG.THEME_COLORS.PRIMARY
          : (backendData.theme_primary_color || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY);
        const secondaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
          ? STOREFRONT_CONFIG.THEME_COLORS.SECONDARY
          : (backendData.theme_secondary_color || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY);

        const loadedTheme: ThemeSettings = {
          ...DEFAULT_THEME_SETTINGS,
          ...backendData,
          theme_primary_color: primaryColor,
          theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
          theme_secondary_color: secondaryColor,
          theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
          theme_btn_primary_bg: primaryColor,
          theme_tab_active_bg: primaryColor,
          theme_view_all_color: primaryColor,
        };
        set({ theme: loadedTheme, isLoaded: true });
        applyThemeToDOM(loadedTheme);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("aether_active_theme_cache", JSON.stringify(loadedTheme));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Using default/cached theme (backend unreachable):", err);
      applyThemeToDOM(get().theme);
      set({ isLoaded: true });
    }
  },
}));

/**
 * Resolves the appropriate brand logo URL for a given placement.
 * Order of fallback:
 * 1. Explicit placement match from logo_placements[placement]
 * 2. If 'mobile_navbar', fallback to 'navbar'
 * 3. Fallback to primary store_brand_logo
 * 4. Fallback default parameter
 */
export function resolveLogo(
  theme?: ThemeSettings | null,
  placement?: "navbar" | "mobile_navbar" | "footer" | "auth" | "invoice" | "split_reveal" | string,
  fallback = "/branding/logo.png"
): string {
  if (!theme) return fallback;

  if (placement && theme.logo_placements && theme.logo_placements[placement]) {
    return theme.logo_placements[placement];
  }

  // Mobile navbar gracefully falls back to desktop navbar logo if not explicitly assigned
  if (placement === "mobile_navbar" && theme.logo_placements?.navbar) {
    return theme.logo_placements.navbar;
  }

  // Split reveal fallback
  if (placement === "split_reveal" && theme.split_reveal_logo) {
    return theme.split_reveal_logo;
  }

  // Standard brand logo fallback
  if (theme.store_brand_logo) {
    return theme.store_brand_logo;
  }

  return fallback;
}

