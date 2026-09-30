"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Palette,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  Upload,
  Trash2,
  Sliders,
  Layers,
  ShieldCheck,
  ChevronRight,
  Info,
  Radio,
  Split,
  Tag,
  ArrowRight,
  Maximize2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Laptop,
  Smartphone,
  Flame,
  LayoutTemplate
} from "lucide-react";
import { themeService } from "@/services/themeService";
import {
  useThemeStore,
  ThemeSettings,
  DEFAULT_THEME_SETTINGS,
  getHexLuminance,
} from "@/store/useThemeStore";
import { BUILTIN_PRESETS, ThemePreset } from "@/config/themePresets";
import { LiveStorefrontPreview } from "@/components/admin/settings/LiveStorefrontPreview";
import { AdminSaveBar } from "@/components/admin/ui/AdminSaveBar";
import { toast } from "sonner";

function ThemeStudioInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "messaging" ? "messaging" : "visual";

  const { setTheme: updateClientTheme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<"visual" | "messaging">(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [presetCategory, setPresetCategory] = useState<"all" | "dark" | "light">("all");

  // Form State — Visual Tokens
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME_SETTINGS.theme_primary_color);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_THEME_SETTINGS.theme_secondary_color);
  const [accentGradient, setAccentGradient] = useState(DEFAULT_THEME_SETTINGS.theme_accent_gradient);
  const [bgColor, setBgColor] = useState(DEFAULT_THEME_SETTINGS.theme_bg_color);
  const [cardBgColor, setCardBgColor] = useState(DEFAULT_THEME_SETTINGS.theme_card_bg_color);
  const [cardBorderColor, setCardBorderColor] = useState(DEFAULT_THEME_SETTINGS.theme_card_border_color || "rgba(255, 255, 255, 0.1)");
  const [textHeadingColor, setTextHeadingColor] = useState(DEFAULT_THEME_SETTINGS.theme_text_heading_color || "#ffffff");
  const [textBodyColor, setTextBodyColor] = useState(DEFAULT_THEME_SETTINGS.theme_text_body_color || "#94a3b8");
  const [btnPrimaryBg, setBtnPrimaryBg] = useState(DEFAULT_THEME_SETTINGS.theme_btn_primary_bg || "#06b6d4");
  const [btnPrimaryText, setBtnPrimaryText] = useState(DEFAULT_THEME_SETTINGS.theme_btn_primary_text || "#ffffff");
  const [btnSecondaryBg, setBtnSecondaryBg] = useState(DEFAULT_THEME_SETTINGS.theme_btn_secondary_bg || "rgba(255, 255, 255, 0.05)");
  const [btnSecondaryText, setBtnSecondaryText] = useState(DEFAULT_THEME_SETTINGS.theme_btn_secondary_text || "#ffffff");
  const [tabActiveBg, setTabActiveBg] = useState(DEFAULT_THEME_SETTINGS.theme_tab_active_bg || "#06b6d4");
  const [tabActiveText, setTabActiveText] = useState(DEFAULT_THEME_SETTINGS.theme_tab_active_text || "#ffffff");
  const [viewAllColor, setViewAllColor] = useState(DEFAULT_THEME_SETTINGS.theme_view_all_color || "#06b6d4");
  const [hoverBg, setHoverBg] = useState(DEFAULT_THEME_SETTINGS.theme_hover_bg || "rgba(6, 182, 212, 0.15)");
  const [hoverText, setHoverText] = useState(DEFAULT_THEME_SETTINGS.theme_hover_text || "#06b6d4");
  const [navBtnBg, setNavBtnBg] = useState(DEFAULT_THEME_SETTINGS.theme_nav_btn_bg || "#ffffff");
  const [navBtnColor, setNavBtnColor] = useState(DEFAULT_THEME_SETTINGS.theme_nav_btn_color || "#0f172a");
  const [radius, setRadius] = useState<string>(DEFAULT_THEME_SETTINGS.theme_radius || "rounded-lg");
  const [footerBgColor, setFooterBgColor] = useState(DEFAULT_THEME_SETTINGS.theme_footer_bg_color || "#1f242e");
  const [footerTextColor, setFooterTextColor] = useState(DEFAULT_THEME_SETTINGS.theme_footer_text_color || "#94a3b8");

  // Form State — Storefront Messaging
  const [announcementEnabled, setAnnouncementEnabled] = useState(DEFAULT_THEME_SETTINGS.announcement_enabled);
  const [announcementText, setAnnouncementText] = useState(DEFAULT_THEME_SETTINGS.announcement_text);
  const [announcementBadge, setAnnouncementBadge] = useState(DEFAULT_THEME_SETTINGS.announcement_badge);

  const [heroHeadline1, setHeroHeadline1] = useState(DEFAULT_THEME_SETTINGS.hero_headline_line1);
  const [heroHeadline2Gradient, setHeroHeadline2Gradient] = useState(DEFAULT_THEME_SETTINGS.hero_headline_line2_gradient);
  const [heroHeadline3, setHeroHeadline3] = useState(DEFAULT_THEME_SETTINGS.hero_headline_line3);
  const [heroSubheading, setHeroSubheading] = useState(DEFAULT_THEME_SETTINGS.hero_subheading);
  const [heroBadgeText, setHeroBadgeText] = useState(DEFAULT_THEME_SETTINGS.hero_badge_text);

  const [splitRevealEnabled, setSplitRevealEnabled] = useState(DEFAULT_THEME_SETTINGS.split_reveal_enabled);
  const [splitRevealImage, setSplitRevealImage] = useState(DEFAULT_THEME_SETTINGS.split_reveal_image);
  const [splitRevealLogo, setSplitRevealLogo] = useState(DEFAULT_THEME_SETTINGS.split_reveal_logo || "");
  const [splitRevealTitle, setSplitRevealTitle] = useState(DEFAULT_THEME_SETTINGS.split_reveal_title);
  const [splitRevealSubtitle, setSplitRevealSubtitle] = useState(DEFAULT_THEME_SETTINGS.split_reveal_subtitle);
  const [splitRevealDuration, setSplitRevealDuration] = useState(DEFAULT_THEME_SETTINGS.split_reveal_duration);
  const [splitRevealMode, setSplitRevealMode] = useState(DEFAULT_THEME_SETTINGS.split_reveal_mode);
  const [splitRevealDim, setSplitRevealDim] = useState(DEFAULT_THEME_SETTINGS.split_reveal_dim);
  const [splitRevealDirection, setSplitRevealDirection] = useState(DEFAULT_THEME_SETTINGS.split_reveal_direction);

  const [customerAuthBgImage, setCustomerAuthBgImage] = useState(DEFAULT_THEME_SETTINGS.customer_auth_bg_image || "");
  const [customerAuthBgColor, setCustomerAuthBgColor] = useState(DEFAULT_THEME_SETTINGS.customer_auth_bg_color || "#ffffff");
  const [customerAuthCardPosition, setCustomerAuthCardPosition] = useState(DEFAULT_THEME_SETTINGS.customer_auth_card_position || "left");

  // Deals & Promotional Navigation
  const [navDealsEnabled, setNavDealsEnabled] = useState(DEFAULT_THEME_SETTINGS.nav_deals_enabled ?? true);
  const [navDealsText, setNavDealsText] = useState(DEFAULT_THEME_SETTINGS.nav_deals_text || "Deals");
  const [navDealsLink, setNavDealsLink] = useState(DEFAULT_THEME_SETTINGS.nav_deals_link || "/products?discounted=true");
  const [categoryDealsCardEnabled, setCategoryDealsCardEnabled] = useState(DEFAULT_THEME_SETTINGS.category_deals_card_enabled ?? true);
  const [categoryDealsCardTitle, setCategoryDealsCardTitle] = useState(DEFAULT_THEME_SETTINGS.category_deals_card_title || "Top Deals");
  const [categoryDealsCardSubtitle, setCategoryDealsCardSubtitle] = useState(DEFAULT_THEME_SETTINGS.category_deals_card_subtitle || "Up to 20% Off");
  const [categoryDealsCardLink, setCategoryDealsCardLink] = useState(DEFAULT_THEME_SETTINGS.category_deals_card_link || "/products?discounted=true");

  const [flashDealsEnabled, setFlashDealsEnabled] = useState(DEFAULT_THEME_SETTINGS.flash_deals_enabled ?? true);
  const [flashDealsTitle, setFlashDealsTitle] = useState(DEFAULT_THEME_SETTINGS.flash_deals_title || "Limited Time Deals");
  const [flashDealsBadge, setFlashDealsBadge] = useState(DEFAULT_THEME_SETTINGS.flash_deals_badge || "Flash Deal Drop");

  // Trust Ribbon
  const [trustRibbonEnabled, setTrustRibbonEnabled] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_enabled ?? true);
  const [trustRibbonTitle1, setTrustRibbonTitle1] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_title_1 || "Fast Express Delivery");
  const [trustRibbonDesc1, setTrustRibbonDesc1] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_desc_1 || "Dispatched within 24-48 hours");
  const [trustRibbonTitle2, setTrustRibbonTitle2] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_title_2 || "Cash on Delivery (COD)");
  const [trustRibbonDesc2, setTrustRibbonDesc2] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_desc_2 || "Pay safely upon product arrival");
  const [trustRibbonTitle3, setTrustRibbonTitle3] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_title_3 || "100% Genuine & Authentic");
  const [trustRibbonDesc3, setTrustRibbonDesc3] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_desc_3 || "Official manufacturer warranty coverage");
  const [trustRibbonTitle4, setTrustRibbonTitle4] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_title_4 || "7-Day Easy Replacement");
  const [trustRibbonDesc4, setTrustRibbonDesc4] = useState(DEFAULT_THEME_SETTINGS.trust_ribbon_desc_4 || "Hassle-free returns & replacement policy");

  // Footer Features
  const [footerFeaturesEnabled, setFooterFeaturesEnabled] = useState(DEFAULT_THEME_SETTINGS.footer_features_enabled ?? true);
  const [footerFeatureTitle1, setFooterFeatureTitle1] = useState(DEFAULT_THEME_SETTINGS.footer_feature_title_1 || "Free Express Shipping");
  const [footerFeatureDesc1, setFooterFeatureDesc1] = useState(DEFAULT_THEME_SETTINGS.footer_feature_desc_1 || "Complimentary delivery on qualifying orders.");
  const [footerFeatureLink1, setFooterFeatureLink1] = useState(DEFAULT_THEME_SETTINGS.footer_feature_link_1 || "/shipping-policy");
  const [footerFeatureTitle2, setFooterFeatureTitle2] = useState(DEFAULT_THEME_SETTINGS.footer_feature_title_2 || "100% Authentic Guarantee");
  const [footerFeatureDesc2, setFooterFeatureDesc2] = useState(DEFAULT_THEME_SETTINGS.footer_feature_desc_2 || "Verified authentic hardware and genuine e-liquids.");
  const [footerFeatureLink2, setFooterFeatureLink2] = useState(DEFAULT_THEME_SETTINGS.footer_feature_link_2 || "/about");
  const [footerFeatureTitle3, setFooterFeatureTitle3] = useState(DEFAULT_THEME_SETTINGS.footer_feature_title_3 || "Fast Dispatch");
  const [footerFeatureDesc3, setFooterFeatureDesc3] = useState(DEFAULT_THEME_SETTINGS.footer_feature_desc_3 || "Orders processed and dispatched within 24-48 hours.");
  const [footerFeatureLink3, setFooterFeatureLink3] = useState(DEFAULT_THEME_SETTINGS.footer_feature_link_3 || "/track");
  const [footerFeatureTitle4, setFooterFeatureTitle4] = useState(DEFAULT_THEME_SETTINGS.footer_feature_title_4 || "Dedicated Customer Care");
  const [footerFeatureDesc4, setFooterFeatureDesc4] = useState(DEFAULT_THEME_SETTINGS.footer_feature_desc_4 || "Expert assistance with orders and device support.");
  const [footerFeatureLink4, setFooterFeatureLink4] = useState(DEFAULT_THEME_SETTINGS.footer_feature_link_4 || "/contact");

  // Baseline state for dirty tracking
  const [initialSettings, setInitialSettings] = useState<Record<string, any> | null>(null);

  // File upload refs
  const splitImageInputRef = useRef<HTMLInputElement>(null);
  const splitLogoInputRef = useRef<HTMLInputElement>(null);
  const authBgInputRef = useRef<HTMLInputElement>(null);

  // Fetch Settings on Mount
  useEffect(() => {
    async function loadTheme() {
      try {
        setLoading(true);
        const data = await themeService.getTheme();
        const s = data.settings || {};

        setInitialSettings(s);

        // Visual tokens
        if (s.theme_primary_color) setPrimaryColor(s.theme_primary_color);
        if (s.theme_secondary_color) setSecondaryColor(s.theme_secondary_color);
        if (s.theme_accent_gradient) setAccentGradient(s.theme_accent_gradient);
        if (s.theme_bg_color) setBgColor(s.theme_bg_color);
        if (s.theme_card_bg_color) setCardBgColor(s.theme_card_bg_color);
        if (s.theme_card_border_color) setCardBorderColor(s.theme_card_border_color);
        if (s.theme_text_heading_color) setTextHeadingColor(s.theme_text_heading_color);
        if (s.theme_text_body_color) setTextBodyColor(s.theme_text_body_color);
        if (s.theme_btn_primary_bg) setBtnPrimaryBg(s.theme_btn_primary_bg);
        if (s.theme_btn_primary_text) setBtnPrimaryText(s.theme_btn_primary_text);
        if (s.theme_btn_secondary_bg) setBtnSecondaryBg(s.theme_btn_secondary_bg);
        if (s.theme_btn_secondary_text) setBtnSecondaryText(s.theme_btn_secondary_text);
        if (s.theme_tab_active_bg) setTabActiveBg(s.theme_tab_active_bg);
        if (s.theme_tab_active_text) setTabActiveText(s.theme_tab_active_text);
        if (s.theme_view_all_color) setViewAllColor(s.theme_view_all_color);
        if (s.theme_hover_bg) setHoverBg(s.theme_hover_bg);
        if (s.theme_hover_text) setHoverText(s.theme_hover_text);
        if (s.theme_nav_btn_bg) setNavBtnBg(s.theme_nav_btn_bg);
        if (s.theme_nav_btn_color) setNavBtnColor(s.theme_nav_btn_color);
        if (s.theme_radius) setRadius(s.theme_radius);
        if (s.theme_footer_bg_color) setFooterBgColor(s.theme_footer_bg_color);
        if (s.theme_footer_text_color) setFooterTextColor(s.theme_footer_text_color);

        // Messaging & Storefront tokens
        setAnnouncementEnabled(s.announcement_enabled !== undefined ? Boolean(s.announcement_enabled) : DEFAULT_THEME_SETTINGS.announcement_enabled);
        setAnnouncementText(s.announcement_text ?? DEFAULT_THEME_SETTINGS.announcement_text);
        setAnnouncementBadge(s.announcement_badge ?? DEFAULT_THEME_SETTINGS.announcement_badge);

        setHeroHeadline1(s.hero_headline_line1 ?? DEFAULT_THEME_SETTINGS.hero_headline_line1);
        setHeroHeadline2Gradient(s.hero_headline_line2_gradient ?? DEFAULT_THEME_SETTINGS.hero_headline_line2_gradient);
        setHeroHeadline3(s.hero_headline_line3 ?? DEFAULT_THEME_SETTINGS.hero_headline_line3);
        setHeroSubheading(s.hero_subheading ?? DEFAULT_THEME_SETTINGS.hero_subheading);
        setHeroBadgeText(s.hero_badge_text ?? DEFAULT_THEME_SETTINGS.hero_badge_text);

        setSplitRevealEnabled(s.split_reveal_enabled !== undefined ? Boolean(s.split_reveal_enabled) : DEFAULT_THEME_SETTINGS.split_reveal_enabled);
        setSplitRevealImage(s.split_reveal_image ?? DEFAULT_THEME_SETTINGS.split_reveal_image);
        setSplitRevealLogo(s.split_reveal_logo ?? "");
        setSplitRevealTitle(s.split_reveal_title ?? DEFAULT_THEME_SETTINGS.split_reveal_title);
        setSplitRevealSubtitle(s.split_reveal_subtitle ?? DEFAULT_THEME_SETTINGS.split_reveal_subtitle);
        setSplitRevealDuration(s.split_reveal_duration ? Number(s.split_reveal_duration) : DEFAULT_THEME_SETTINGS.split_reveal_duration);
        setSplitRevealMode(s.split_reveal_mode ?? DEFAULT_THEME_SETTINGS.split_reveal_mode);
        setSplitRevealDim(s.split_reveal_dim !== undefined ? Number(s.split_reveal_dim) : DEFAULT_THEME_SETTINGS.split_reveal_dim);
        setSplitRevealDirection(s.split_reveal_direction ?? DEFAULT_THEME_SETTINGS.split_reveal_direction);

        setCustomerAuthBgImage(s.customer_auth_bg_image ?? "");
        setCustomerAuthBgColor(s.customer_auth_bg_color ?? "#ffffff");
        setCustomerAuthCardPosition(s.customer_auth_card_position ?? "left");

        setNavDealsEnabled(s.nav_deals_enabled !== undefined ? Boolean(s.nav_deals_enabled) : true);
        setNavDealsText(s.nav_deals_text ?? "Deals");
        setNavDealsLink(s.nav_deals_link ?? "/products?discounted=true");
        setCategoryDealsCardEnabled(s.category_deals_card_enabled !== undefined ? Boolean(s.category_deals_card_enabled) : true);
        setCategoryDealsCardTitle(s.category_deals_card_title ?? "Top Deals");
        setCategoryDealsCardSubtitle(s.category_deals_card_subtitle ?? "Up to 20% Off");
        setCategoryDealsCardLink(s.category_deals_card_link ?? "/products?discounted=true");

        setFlashDealsEnabled(s.flash_deals_enabled !== undefined ? Boolean(s.flash_deals_enabled) : true);
        setFlashDealsTitle(s.flash_deals_title ?? "Limited Time Deals");
        setFlashDealsBadge(s.flash_deals_badge ?? "Flash Deal Drop");

        setTrustRibbonEnabled(s.trust_ribbon_enabled !== undefined ? Boolean(s.trust_ribbon_enabled) : true);
        setTrustRibbonTitle1(s.trust_ribbon_title_1 ?? "Fast Express Delivery");
        setTrustRibbonDesc1(s.trust_ribbon_desc_1 ?? "Dispatched within 24-48 hours");
        setTrustRibbonTitle2(s.trust_ribbon_title_2 ?? "Cash on Delivery (COD)");
        setTrustRibbonDesc2(s.trust_ribbon_desc_2 ?? "Pay safely upon product arrival");
        setTrustRibbonTitle3(s.trust_ribbon_title_3 ?? "100% Genuine & Authentic");
        setTrustRibbonDesc3(s.trust_ribbon_desc_3 ?? "Official manufacturer warranty coverage");
        setTrustRibbonTitle4(s.trust_ribbon_title_4 ?? "7-Day Easy Replacement");
        setTrustRibbonDesc4(s.trust_ribbon_desc_4 ?? "Hassle-free returns & replacement policy");

        setFooterFeaturesEnabled(s.footer_features_enabled !== undefined ? Boolean(s.footer_features_enabled) : true);
        setFooterFeatureTitle1(s.footer_feature_title_1 ?? "Free Express Shipping");
        setFooterFeatureDesc1(s.footer_feature_desc_1 ?? "Complimentary delivery on qualifying orders.");
        setFooterFeatureLink1(s.footer_feature_link_1 ?? "/shipping-policy");
        setFooterFeatureTitle2(s.footer_feature_title_2 ?? "100% Authentic Guarantee");
        setFooterFeatureDesc2(s.footer_feature_desc_2 ?? "Verified authentic hardware and genuine e-liquids.");
        setFooterFeatureLink2(s.footer_feature_link_2 ?? "/about");
        setFooterFeatureTitle3(s.footer_feature_title_3 ?? "Fast Dispatch");
        setFooterFeatureDesc3(s.footer_feature_desc_3 ?? "Orders processed and dispatched within 24-48 hours.");
        setFooterFeatureLink3(s.footer_feature_link_3 ?? "/track");
        setFooterFeatureTitle4(s.footer_feature_title_4 ?? "Dedicated Customer Care");
        setFooterFeatureDesc4(s.footer_feature_desc_4 ?? "Expert assistance with orders and device support.");
        setFooterFeatureLink4(s.footer_feature_link_4 ?? "/contact");
      } catch (err: any) {
        console.error("Failed to load theme settings:", err);
        toast.error("Failed to load theme settings from server.");
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, []);

  // Dirty state detection
  const isDirty = useMemo(() => {
    if (!initialSettings) return false;
    const str = (v: any) => (v === undefined || v === null ? "" : String(v).trim().toLowerCase());
    const bool = (v: any) => Boolean(v);
    const num = (v: any) => Number(v) || 0;

    return (
      str(primaryColor) !== str(initialSettings.theme_primary_color) ||
      str(secondaryColor) !== str(initialSettings.theme_secondary_color) ||
      str(accentGradient) !== str(initialSettings.theme_accent_gradient) ||
      str(bgColor) !== str(initialSettings.theme_bg_color) ||
      str(cardBgColor) !== str(initialSettings.theme_card_bg_color) ||
      str(cardBorderColor) !== str(initialSettings.theme_card_border_color) ||
      str(textHeadingColor) !== str(initialSettings.theme_text_heading_color) ||
      str(textBodyColor) !== str(initialSettings.theme_text_body_color) ||
      str(btnPrimaryBg) !== str(initialSettings.theme_btn_primary_bg) ||
      str(btnPrimaryText) !== str(initialSettings.theme_btn_primary_text) ||
      str(btnSecondaryBg) !== str(initialSettings.theme_btn_secondary_bg) ||
      str(btnSecondaryText) !== str(initialSettings.theme_btn_secondary_text) ||
      str(tabActiveBg) !== str(initialSettings.theme_tab_active_bg) ||
      str(tabActiveText) !== str(initialSettings.theme_tab_active_text) ||
      str(viewAllColor) !== str(initialSettings.theme_view_all_color) ||
      str(hoverBg) !== str(initialSettings.theme_hover_bg) ||
      str(hoverText) !== str(initialSettings.theme_hover_text) ||
      str(navBtnBg) !== str(initialSettings.theme_nav_btn_bg) ||
      str(navBtnColor) !== str(initialSettings.theme_nav_btn_color) ||
      str(radius) !== str(initialSettings.theme_radius) ||
      str(footerBgColor) !== str(initialSettings.theme_footer_bg_color) ||
      str(footerTextColor) !== str(initialSettings.theme_footer_text_color) ||
      bool(announcementEnabled) !== bool(initialSettings.announcement_enabled) ||
      str(announcementText) !== str(initialSettings.announcement_text) ||
      str(announcementBadge) !== str(initialSettings.announcement_badge) ||
      str(heroHeadline1) !== str(initialSettings.hero_headline_line1) ||
      str(heroHeadline2Gradient) !== str(initialSettings.hero_headline_line2_gradient) ||
      str(heroHeadline3) !== str(initialSettings.hero_headline_line3) ||
      str(heroSubheading) !== str(initialSettings.hero_subheading) ||
      str(heroBadgeText) !== str(initialSettings.hero_badge_text) ||
      bool(splitRevealEnabled) !== bool(initialSettings.split_reveal_enabled) ||
      str(splitRevealImage) !== str(initialSettings.split_reveal_image) ||
      str(splitRevealLogo) !== str(initialSettings.split_reveal_logo) ||
      str(splitRevealTitle) !== str(initialSettings.split_reveal_title) ||
      str(splitRevealSubtitle) !== str(initialSettings.split_reveal_subtitle) ||
      num(splitRevealDuration) !== num(initialSettings.split_reveal_duration) ||
      str(splitRevealMode) !== str(initialSettings.split_reveal_mode) ||
      num(splitRevealDim) !== num(initialSettings.split_reveal_dim) ||
      str(splitRevealDirection) !== str(initialSettings.split_reveal_direction) ||
      str(customerAuthBgImage) !== str(initialSettings.customer_auth_bg_image) ||
      str(customerAuthBgColor) !== str(initialSettings.customer_auth_bg_color) ||
      str(customerAuthCardPosition) !== str(initialSettings.customer_auth_card_position) ||
      bool(navDealsEnabled) !== bool(initialSettings.nav_deals_enabled) ||
      str(navDealsText) !== str(initialSettings.nav_deals_text) ||
      str(navDealsLink) !== str(initialSettings.nav_deals_link) ||
      bool(categoryDealsCardEnabled) !== bool(initialSettings.category_deals_card_enabled) ||
      str(categoryDealsCardTitle) !== str(initialSettings.category_deals_card_title) ||
      str(categoryDealsCardSubtitle) !== str(initialSettings.category_deals_card_subtitle) ||
      str(categoryDealsCardLink) !== str(initialSettings.category_deals_card_link) ||
      bool(flashDealsEnabled) !== bool(initialSettings.flash_deals_enabled) ||
      str(flashDealsTitle) !== str(initialSettings.flash_deals_title) ||
      str(flashDealsBadge) !== str(initialSettings.flash_deals_badge) ||
      bool(trustRibbonEnabled) !== bool(initialSettings.trust_ribbon_enabled) ||
      str(trustRibbonTitle1) !== str(initialSettings.trust_ribbon_title_1) ||
      str(trustRibbonDesc1) !== str(initialSettings.trust_ribbon_desc_1) ||
      str(trustRibbonTitle2) !== str(initialSettings.trust_ribbon_title_2) ||
      str(trustRibbonDesc2) !== str(initialSettings.trust_ribbon_desc_2) ||
      str(trustRibbonTitle3) !== str(initialSettings.trust_ribbon_title_3) ||
      str(trustRibbonDesc3) !== str(initialSettings.trust_ribbon_desc_3) ||
      str(trustRibbonTitle4) !== str(initialSettings.trust_ribbon_title_4) ||
      str(trustRibbonDesc4) !== str(initialSettings.trust_ribbon_desc_4) ||
      bool(footerFeaturesEnabled) !== bool(initialSettings.footer_features_enabled) ||
      str(footerFeatureTitle1) !== str(initialSettings.footer_feature_title_1) ||
      str(footerFeatureDesc1) !== str(initialSettings.footer_feature_desc_1) ||
      str(footerFeatureLink1) !== str(initialSettings.footer_feature_link_1) ||
      str(footerFeatureTitle2) !== str(initialSettings.footer_feature_title_2) ||
      str(footerFeatureDesc2) !== str(initialSettings.footer_feature_desc_2) ||
      str(footerFeatureLink2) !== str(initialSettings.footer_feature_link_2) ||
      str(footerFeatureTitle3) !== str(initialSettings.footer_feature_title_3) ||
      str(footerFeatureDesc3) !== str(initialSettings.footer_feature_desc_3) ||
      str(footerFeatureLink3) !== str(initialSettings.footer_feature_link_3) ||
      str(footerFeatureTitle4) !== str(initialSettings.footer_feature_title_4) ||
      str(footerFeatureDesc4) !== str(initialSettings.footer_feature_desc_4) ||
      str(footerFeatureLink4) !== str(initialSettings.footer_feature_link_4)
    );
  }, [
    initialSettings,
    primaryColor, secondaryColor, accentGradient, bgColor, cardBgColor, cardBorderColor,
    textHeadingColor, textBodyColor, btnPrimaryBg, btnPrimaryText, btnSecondaryBg, btnSecondaryText,
    tabActiveBg, tabActiveText, viewAllColor, hoverBg, hoverText, navBtnBg, navBtnColor, radius,
    footerBgColor, footerTextColor, announcementEnabled, announcementText, announcementBadge,
    heroHeadline1, heroHeadline2Gradient, heroHeadline3, heroSubheading, heroBadgeText,
    splitRevealEnabled, splitRevealImage, splitRevealLogo, splitRevealTitle, splitRevealSubtitle,
    splitRevealDuration, splitRevealMode, splitRevealDim, splitRevealDirection, customerAuthBgImage,
    customerAuthBgColor, customerAuthCardPosition, navDealsEnabled, navDealsText, navDealsLink,
    categoryDealsCardEnabled, categoryDealsCardTitle, categoryDealsCardSubtitle, categoryDealsCardLink,
    flashDealsEnabled, flashDealsTitle, flashDealsBadge, trustRibbonEnabled, trustRibbonTitle1,
    trustRibbonDesc1, trustRibbonTitle2, trustRibbonDesc2, trustRibbonTitle3, trustRibbonDesc3,
    trustRibbonTitle4, trustRibbonDesc4, footerFeaturesEnabled, footerFeatureTitle1, footerFeatureDesc1,
    footerFeatureLink1, footerFeatureTitle2, footerFeatureDesc2, footerFeatureLink2, footerFeatureTitle3,
    footerFeatureDesc3, footerFeatureLink3, footerFeatureTitle4, footerFeatureDesc4, footerFeatureLink4,
  ]);

  // Apply a Built-in Preset
  const handleApplyPreset = (preset: ThemePreset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setBgColor(preset.bg);
    setCardBgColor(preset.card);
    setAccentGradient(preset.id);
    if (preset.border) setCardBorderColor(preset.border);
    if (preset.heading) setTextHeadingColor(preset.heading);
    if (preset.body) setTextBodyColor(preset.body);
    if (preset.btnPrimaryBg) setBtnPrimaryBg(preset.btnPrimaryBg);
    if (preset.btnPrimaryText) setBtnPrimaryText(preset.btnPrimaryText);
    if (preset.btnSecondaryBg) setBtnSecondaryBg(preset.btnSecondaryBg);
    if (preset.btnSecondaryText) setBtnSecondaryText(preset.btnSecondaryText);
    if (preset.tabActiveBg) setTabActiveBg(preset.tabActiveBg);
    if (preset.tabActiveText) setTabActiveText(preset.tabActiveText);
    if (preset.viewAllColor) setViewAllColor(preset.viewAllColor);
    if (preset.hoverBg) setHoverBg(preset.hoverBg);
    if (preset.hoverText) setHoverText(preset.hoverText);
    if (preset.radius) setRadius(preset.radius);

    // Optimistically update live theme store for instantaneous preview
    updateClientTheme({
      theme_primary_color: preset.primary,
      theme_secondary_color: preset.secondary,
      theme_bg_color: preset.bg,
      theme_card_bg_color: preset.card,
      theme_radius: preset.radius || "rounded-lg",
    });

    toast.success(`Preset "${preset.name}" applied. Click Save to publish changes.`);
  };

  // Discard all changes and restore initial
  const handleDiscard = () => {
    if (!initialSettings) return;
    const s = initialSettings;
    setPrimaryColor(s.theme_primary_color ?? DEFAULT_THEME_SETTINGS.theme_primary_color);
    setSecondaryColor(s.theme_secondary_color ?? DEFAULT_THEME_SETTINGS.theme_secondary_color);
    setAccentGradient(s.theme_accent_gradient ?? DEFAULT_THEME_SETTINGS.theme_accent_gradient);
    setBgColor(s.theme_bg_color ?? DEFAULT_THEME_SETTINGS.theme_bg_color);
    setCardBgColor(s.theme_card_bg_color ?? DEFAULT_THEME_SETTINGS.theme_card_bg_color);
    setCardBorderColor(s.theme_card_border_color ?? "rgba(255, 255, 255, 0.1)");
    setTextHeadingColor(s.theme_text_heading_color ?? "#ffffff");
    setTextBodyColor(s.theme_text_body_color ?? "#94a3b8");
    setBtnPrimaryBg(s.theme_btn_primary_bg ?? "#06b6d4");
    setBtnPrimaryText(s.theme_btn_primary_text ?? "#ffffff");
    setBtnSecondaryBg(s.theme_btn_secondary_bg ?? "rgba(255, 255, 255, 0.05)");
    setBtnSecondaryText(s.theme_btn_secondary_text ?? "#ffffff");
    setTabActiveBg(s.theme_tab_active_bg ?? "#06b6d4");
    setTabActiveText(s.theme_tab_active_text ?? "#ffffff");
    setViewAllColor(s.theme_view_all_color ?? "#06b6d4");
    setHoverBg(s.theme_hover_bg ?? "rgba(6, 182, 212, 0.15)");
    setHoverText(s.theme_hover_text ?? "#06b6d4");
    setNavBtnBg(s.theme_nav_btn_bg ?? "#ffffff");
    setNavBtnColor(s.theme_nav_btn_color ?? "#0f172a");
    setRadius(s.theme_radius ?? "rounded-lg");
    setFooterBgColor(s.theme_footer_bg_color ?? "#1f242e");
    setFooterTextColor(s.theme_footer_text_color ?? "#94a3b8");

    setAnnouncementEnabled(s.announcement_enabled !== undefined ? Boolean(s.announcement_enabled) : DEFAULT_THEME_SETTINGS.announcement_enabled);
    setAnnouncementText(s.announcement_text ?? DEFAULT_THEME_SETTINGS.announcement_text);
    setAnnouncementBadge(s.announcement_badge ?? DEFAULT_THEME_SETTINGS.announcement_badge);

    setHeroHeadline1(s.hero_headline_line1 ?? DEFAULT_THEME_SETTINGS.hero_headline_line1);
    setHeroHeadline2Gradient(s.hero_headline_line2_gradient ?? DEFAULT_THEME_SETTINGS.hero_headline_line2_gradient);
    setHeroHeadline3(s.hero_headline_line3 ?? DEFAULT_THEME_SETTINGS.hero_headline_line3);
    setHeroSubheading(s.hero_subheading ?? DEFAULT_THEME_SETTINGS.hero_subheading);
    setHeroBadgeText(s.hero_badge_text ?? DEFAULT_THEME_SETTINGS.hero_badge_text);

    setSplitRevealEnabled(s.split_reveal_enabled !== undefined ? Boolean(s.split_reveal_enabled) : DEFAULT_THEME_SETTINGS.split_reveal_enabled);
    setSplitRevealImage(s.split_reveal_image ?? DEFAULT_THEME_SETTINGS.split_reveal_image);
    setSplitRevealLogo(s.split_reveal_logo ?? "");
    setSplitRevealTitle(s.split_reveal_title ?? DEFAULT_THEME_SETTINGS.split_reveal_title);
    setSplitRevealSubtitle(s.split_reveal_subtitle ?? DEFAULT_THEME_SETTINGS.split_reveal_subtitle);
    setSplitRevealDuration(s.split_reveal_duration ? Number(s.split_reveal_duration) : DEFAULT_THEME_SETTINGS.split_reveal_duration);
    setSplitRevealMode(s.split_reveal_mode ?? DEFAULT_THEME_SETTINGS.split_reveal_mode);
    setSplitRevealDim(s.split_reveal_dim !== undefined ? Number(s.split_reveal_dim) : DEFAULT_THEME_SETTINGS.split_reveal_dim);
    setSplitRevealDirection(s.split_reveal_direction ?? DEFAULT_THEME_SETTINGS.split_reveal_direction);

    setCustomerAuthBgImage(s.customer_auth_bg_image ?? "");
    setCustomerAuthBgColor(s.customer_auth_bg_color ?? "#ffffff");
    setCustomerAuthCardPosition(s.customer_auth_card_position ?? "left");

    toast.info("Unsaved changes discarded.");
  };

  // Save Settings to Backend API
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, any> = {
        theme_primary_color: primaryColor,
        theme_secondary_color: secondaryColor,
        theme_accent_gradient: accentGradient,
        theme_bg_color: bgColor,
        theme_card_bg_color: cardBgColor,
        theme_card_border_color: cardBorderColor,
        theme_text_heading_color: textHeadingColor,
        theme_text_body_color: textBodyColor,
        theme_btn_primary_bg: btnPrimaryBg,
        theme_btn_primary_text: btnPrimaryText,
        theme_btn_secondary_bg: btnSecondaryBg,
        theme_btn_secondary_text: btnSecondaryText,
        theme_tab_active_bg: tabActiveBg,
        theme_tab_active_text: tabActiveText,
        theme_view_all_color: viewAllColor,
        theme_hover_bg: hoverBg,
        theme_hover_text: hoverText,
        theme_nav_btn_bg: navBtnBg,
        theme_nav_btn_color: navBtnColor,
        theme_radius: radius,
        theme_footer_bg_color: footerBgColor,
        theme_footer_text_color: footerTextColor,
        announcement_enabled: announcementEnabled,
        announcement_text: announcementText,
        announcement_badge: announcementBadge,
        hero_headline_line1: heroHeadline1,
        hero_headline_line2_gradient: heroHeadline2Gradient,
        hero_headline_line3: heroHeadline3,
        hero_subheading: heroSubheading,
        hero_badge_text: heroBadgeText,
        split_reveal_enabled: splitRevealEnabled,
        split_reveal_image: splitRevealImage,
        split_reveal_logo: splitRevealLogo,
        split_reveal_title: splitRevealTitle,
        split_reveal_subtitle: splitRevealSubtitle,
        split_reveal_duration: splitRevealDuration,
        split_reveal_mode: splitRevealMode,
        split_reveal_dim: splitRevealDim,
        split_reveal_direction: splitRevealDirection,
        customer_auth_bg_image: customerAuthBgImage,
        customer_auth_bg_color: customerAuthBgColor,
        customer_auth_card_position: customerAuthCardPosition,
        nav_deals_enabled: navDealsEnabled,
        nav_deals_text: navDealsText,
        nav_deals_link: navDealsLink,
        category_deals_card_enabled: categoryDealsCardEnabled,
        category_deals_card_title: categoryDealsCardTitle,
        category_deals_card_subtitle: categoryDealsCardSubtitle,
        category_deals_card_link: categoryDealsCardLink,
        flash_deals_enabled: flashDealsEnabled,
        flash_deals_title: flashDealsTitle,
        flash_deals_badge: flashDealsBadge,
        trust_ribbon_enabled: trustRibbonEnabled,
        trust_ribbon_title_1: trustRibbonTitle1,
        trust_ribbon_desc_1: trustRibbonDesc1,
        trust_ribbon_title_2: trustRibbonTitle2,
        trust_ribbon_desc_2: trustRibbonDesc2,
        trust_ribbon_title_3: trustRibbonTitle3,
        trust_ribbon_desc_3: trustRibbonDesc3,
        trust_ribbon_title_4: trustRibbonTitle4,
        trust_ribbon_desc_4: trustRibbonDesc4,
        footer_features_enabled: footerFeaturesEnabled,
        footer_feature_title_1: footerFeatureTitle1,
        footer_feature_desc_1: footerFeatureDesc1,
        footer_feature_link_1: footerFeatureLink1,
        footer_feature_title_2: footerFeatureTitle2,
        footer_feature_desc_2: footerFeatureDesc2,
        footer_feature_link_2: footerFeatureLink2,
        footer_feature_title_3: footerFeatureTitle3,
        footer_feature_desc_3: footerFeatureDesc3,
        footer_feature_link_3: footerFeatureLink3,
        footer_feature_title_4: footerFeatureTitle4,
        footer_feature_desc_4: footerFeatureDesc4,
        footer_feature_link_4: footerFeatureLink4,
      };

      const res = await themeService.updateTheme(payload);
      const serverSettings = res?.settings || {};

      const updatedBaseline = {
        ...initialSettings,
        ...payload,
        ...serverSettings,
      };
      setInitialSettings(updatedBaseline);

      // Synchronize client-side Zustand store and DOM CSS variables
      updateClientTheme(payload);

      toast.success("Theme & storefront settings saved successfully!");
    } catch (err: any) {
      console.error("Save theme error:", err);
      toast.error(err?.response?.data?.message || "Failed to save theme settings.");
    } finally {
      setSaving(false);
    }
  };

  // Reset to Factory Defaults
  const handleResetDefaults = async () => {
    try {
      setResetting(true);
      const res = await themeService.resetDefaults();
      const d = res?.settings || DEFAULT_THEME_SETTINGS;

      setInitialSettings(d);
      updateClientTheme(d);

      // Re-populate state from defaults
      setPrimaryColor(d.theme_primary_color || DEFAULT_THEME_SETTINGS.theme_primary_color);
      setSecondaryColor(d.theme_secondary_color || DEFAULT_THEME_SETTINGS.theme_secondary_color);
      setAccentGradient(d.theme_accent_gradient || DEFAULT_THEME_SETTINGS.theme_accent_gradient);
      setBgColor(d.theme_bg_color || DEFAULT_THEME_SETTINGS.theme_bg_color);
      setCardBgColor(d.theme_card_bg_color || DEFAULT_THEME_SETTINGS.theme_card_bg_color);
      setCardBorderColor(d.theme_card_border_color || DEFAULT_THEME_SETTINGS.theme_card_border_color);
      setTextHeadingColor(d.theme_text_heading_color || DEFAULT_THEME_SETTINGS.theme_text_heading_color);
      setTextBodyColor(d.theme_text_body_color || DEFAULT_THEME_SETTINGS.theme_text_body_color);
      setBtnPrimaryBg(d.theme_btn_primary_bg || DEFAULT_THEME_SETTINGS.theme_btn_primary_bg);
      setBtnPrimaryText(d.theme_btn_primary_text || DEFAULT_THEME_SETTINGS.theme_btn_primary_text);
      setBtnSecondaryBg(d.theme_btn_secondary_bg || DEFAULT_THEME_SETTINGS.theme_btn_secondary_bg);
      setBtnSecondaryText(d.theme_btn_secondary_text || DEFAULT_THEME_SETTINGS.theme_btn_secondary_text);
      setTabActiveBg(d.theme_tab_active_bg || DEFAULT_THEME_SETTINGS.theme_tab_active_bg);
      setTabActiveText(d.theme_tab_active_text || DEFAULT_THEME_SETTINGS.theme_tab_active_text);
      setViewAllColor(d.theme_view_all_color || DEFAULT_THEME_SETTINGS.theme_view_all_color);
      setHoverBg(d.theme_hover_bg || DEFAULT_THEME_SETTINGS.theme_hover_bg);
      setHoverText(d.theme_hover_text || DEFAULT_THEME_SETTINGS.theme_hover_text);
      setNavBtnBg(d.theme_nav_btn_bg || DEFAULT_THEME_SETTINGS.theme_nav_btn_bg);
      setNavBtnColor(d.theme_nav_btn_color || DEFAULT_THEME_SETTINGS.theme_nav_btn_color);
      setRadius(d.theme_radius || DEFAULT_THEME_SETTINGS.theme_radius);
      setFooterBgColor(d.theme_footer_bg_color || DEFAULT_THEME_SETTINGS.theme_footer_bg_color);
      setFooterTextColor(d.theme_footer_text_color || DEFAULT_THEME_SETTINGS.theme_footer_text_color);

      setAnnouncementEnabled(d.announcement_enabled ?? DEFAULT_THEME_SETTINGS.announcement_enabled);
      setAnnouncementText(d.announcement_text ?? DEFAULT_THEME_SETTINGS.announcement_text);
      setAnnouncementBadge(d.announcement_badge ?? DEFAULT_THEME_SETTINGS.announcement_badge);

      setHeroHeadline1(d.hero_headline_line1 ?? DEFAULT_THEME_SETTINGS.hero_headline_line1);
      setHeroHeadline2Gradient(d.hero_headline_line2_gradient ?? DEFAULT_THEME_SETTINGS.hero_headline_line2_gradient);
      setHeroHeadline3(d.hero_headline_line3 ?? DEFAULT_THEME_SETTINGS.hero_headline_line3);
      setHeroSubheading(d.hero_subheading ?? DEFAULT_THEME_SETTINGS.hero_subheading);
      setHeroBadgeText(d.hero_badge_text ?? DEFAULT_THEME_SETTINGS.hero_badge_text);

      setSplitRevealEnabled(d.split_reveal_enabled ?? DEFAULT_THEME_SETTINGS.split_reveal_enabled);
      setSplitRevealImage(d.split_reveal_image ?? DEFAULT_THEME_SETTINGS.split_reveal_image);
      setSplitRevealLogo(d.split_reveal_logo ?? "");
      setSplitRevealTitle(d.split_reveal_title ?? DEFAULT_THEME_SETTINGS.split_reveal_title);
      setSplitRevealSubtitle(d.split_reveal_subtitle ?? DEFAULT_THEME_SETTINGS.split_reveal_subtitle);
      setSplitRevealDuration(d.split_reveal_duration ? Number(d.split_reveal_duration) : DEFAULT_THEME_SETTINGS.split_reveal_duration);
      setSplitRevealMode(d.split_reveal_mode ?? DEFAULT_THEME_SETTINGS.split_reveal_mode);
      setSplitRevealDim(d.split_reveal_dim !== undefined ? Number(d.split_reveal_dim) : DEFAULT_THEME_SETTINGS.split_reveal_dim);
      setSplitRevealDirection(d.split_reveal_direction ?? DEFAULT_THEME_SETTINGS.split_reveal_direction);

      setCustomerAuthBgImage(d.customer_auth_bg_image ?? "");
      setCustomerAuthBgColor(d.customer_auth_bg_color ?? "#ffffff");
      setCustomerAuthCardPosition(d.customer_auth_card_position ?? "left");

      setShowResetModal(false);
      toast.success("Theme settings reset to factory defaults successfully!");
    } catch (err: any) {
      console.error("Reset theme error:", err);
      toast.error("Failed to reset theme settings.");
    } finally {
      setResetting(false);
    }
  };

  // Image upload helpers (using FileReader data URL, automatically persisted by Laravel disk storage)
  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} file size must be less than 5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setter(dataUrl);
      toast.success(`${label} uploaded! Remember to save changes.`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filteredPresets = useMemo(() => {
    if (presetCategory === "all") return BUILTIN_PRESETS;
    return BUILTIN_PRESETS.filter((p) => p.category === presetCategory);
  }, [presetCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Theme & Storefront Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">Content / CMS</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-medium">Theme & Storefront</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Theme & Storefront</h1>
              <p className="text-xs text-slate-400">
                Visual brand styling, color palettes, button tokens, hero copy, and storefront presentation
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreviewDrawer(!showPreviewDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showPreviewDrawer
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {showPreviewDrawer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreviewDrawer ? "Hide Preview" : "Live Preview"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isDirty
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/20"
                : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab("visual")}
          className={`flex items-center gap-2.5 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "visual"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual Design</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Colors & Styles
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("messaging")}
          className={`flex items-center gap-2.5 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "messaging"
              ? "border-indigo-400 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Storefront Messaging</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Hero & Banners
          </span>
        </button>
      </div>

      {/* Live Preview Split Layout (if toggled) */}
      {showPreviewDrawer && (
        <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Live Storefront Real-Time Preview</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreviewDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Preview ✕
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#07090e]">
            <LiveStorefrontPreview
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              bgColor={bgColor}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              textHeadingColor={textHeadingColor}
              textBodyColor={textBodyColor}
              btnPrimaryBg={btnPrimaryBg}
              btnPrimaryText={btnPrimaryText}
              footerBgColor={footerBgColor}
              footerTextColor={footerTextColor}
              radius={radius}
              announcementEnabled={announcementEnabled}
              announcementText={announcementText}
              announcementBadge={announcementBadge}
              heroHeadline1={heroHeadline1}
              heroHeadline2Gradient={heroHeadline2Gradient}
              heroHeadline3={heroHeadline3}
              heroSubheading={heroSubheading}
              heroBadgeText={heroBadgeText}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: VISUAL DESIGN                                      */}
      {/* ======================================================== */}
      {activeTab === "visual" && (
        <div className="space-y-6">
          {/* Section: Curated Theme Presets */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Curated Theme Presets</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select a professionally harmonized palette or customize individual tokens below.
                </p>
              </div>

              {/* Preset Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10">
                {(["all", "dark", "light"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      presetCategory === cat
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredPresets.map((preset) => {
                const isSelected =
                  primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                  bgColor.toLowerCase() === preset.bg.toLowerCase();

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-cyan-500 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.tagline}
                      </p>
                    </div>

                    {/* Color Swatch Bar */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/5">
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.primary }}
                        title={`Primary: ${preset.primary}`}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.secondary }}
                        title={`Secondary: ${preset.secondary}`}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.bg }}
                        title={`Background: ${preset.bg}`}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.card }}
                        title={`Card: ${preset.card}`}
                      />
                      <span className="ml-auto text-[10px] uppercase font-bold text-slate-500">
                        {preset.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Colors */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Colors & Palette</span>
              </h2>
              <p className="text-xs text-slate-400">
                Core color tokens returned and consumed by the storefront design system.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Primary Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Primary Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{primaryColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Brand identity, highlights, and primary actions</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#06b6d4"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Secondary Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{secondaryColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Supporting accents, secondary badges, and glows</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              {/* Accent Gradient Preset */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-white">Accent Gradient Preset</label>
                <p className="text-[11px] text-slate-400">Hero title gradients and glow decorations</p>
                <select
                  value={accentGradient}
                  onChange={(e) => setAccentGradient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="cyan-indigo">Cyan to Indigo</option>
                  <option value="emerald-teal">Emerald to Teal</option>
                  <option value="violet-pink">Neon Violet to Pink</option>
                  <option value="amber-orange">Amber to Orange</option>
                  <option value="rose-red">Crimson to Rose</option>
                  <option value="blue-cyan">Sapphire to Cyan</option>
                  <option value="slate-zinc">Titanium Monochrome</option>
                </select>
              </div>

              {/* Background Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Storefront Background</label>
                  <span className="text-[10px] text-slate-400 font-mono">{bgColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Body canvas background of the entire storefront</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#090a0f"
                  />
                </div>
              </div>

              {/* Card / Surface Background */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Card / Surface Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{cardBgColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Background of product cards, panels, and modals</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#0c101d"
                  />
                </div>
              </div>

              {/* Card Border Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Card Border Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{cardBorderColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Outlines of cards, inputs, and section dividers</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cardBorderColor}
                    onChange={(e) => setCardBorderColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="rgba(255, 255, 255, 0.1)"
                  />
                </div>
              </div>

              {/* Headings Text Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Heading Text Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{textHeadingColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Headlines, product titles, and section headers</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textHeadingColor.startsWith("#") ? textHeadingColor : "#ffffff"}
                    onChange={(e) => setTextHeadingColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={textHeadingColor}
                    onChange={(e) => setTextHeadingColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Body Text Color */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Body Text Color</label>
                  <span className="text-[10px] text-slate-400 font-mono">{textBodyColor}</span>
                </div>
                <p className="text-[11px] text-slate-400">Paragraphs, descriptions, specs, and labels</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textBodyColor.startsWith("#") ? textBodyColor : "#94a3b8"}
                    onChange={(e) => setTextBodyColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={textBodyColor}
                    onChange={(e) => setTextBodyColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="#94a3b8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Buttons */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Buttons & Interactive Styling</span>
              </h2>
              <p className="text-xs text-slate-400">
                Primary and secondary button backgrounds, text colors, and interactive hover states.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Primary Button */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Primary Button</h3>
                  <div
                    className="px-4 py-1.5 rounded-lg text-xs font-bold shadow-md"
                    style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                  >
                    Add to Cart
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={btnPrimaryBg.startsWith("#") ? btnPrimaryBg : "#06b6d4"}
                        onChange={(e) => setBtnPrimaryBg(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                      />
                      <input
                        type="text"
                        value={btnPrimaryBg}
                        onChange={(e) => setBtnPrimaryBg(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={btnPrimaryText.startsWith("#") ? btnPrimaryText : "#ffffff"}
                        onChange={(e) => setBtnPrimaryText(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                      />
                      <input
                        type="text"
                        value={btnPrimaryText}
                        onChange={(e) => setBtnPrimaryText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Button */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Secondary Button</h3>
                  <div
                    className="px-4 py-1.5 rounded-lg text-xs font-bold border border-white/15"
                    style={{ backgroundColor: btnSecondaryBg, color: btnSecondaryText }}
                  >
                    View Details
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Background Color</label>
                    <input
                      type="text"
                      value={btnSecondaryBg}
                      onChange={(e) => setBtnSecondaryBg(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={btnSecondaryText.startsWith("#") ? btnSecondaryText : "#ffffff"}
                        onChange={(e) => setBtnSecondaryText(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                      />
                      <input
                        type="text"
                        value={btnSecondaryText}
                        onChange={(e) => setBtnSecondaryText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Tab Token */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Tab Pill</h3>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: tabActiveBg, color: tabActiveText }}
                  >
                    Active Filter
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Tab Active BG</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tabActiveBg.startsWith("#") ? tabActiveBg : "#06b6d4"}
                        onChange={(e) => setTabActiveBg(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tabActiveBg}
                        onChange={(e) => setTabActiveBg(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Tab Active Text</label>
                    <input
                      type="text"
                      value={tabActiveText}
                      onChange={(e) => setTabActiveText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Button Token */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Navbar Buttons</h3>
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                    style={{ backgroundColor: navBtnBg, color: navBtnColor }}
                  >
                    Sign In
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Nav Button BG</label>
                    <input
                      type="text"
                      value={navBtnBg}
                      onChange={(e) => setNavBtnBg(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Nav Button Text</label>
                    <input
                      type="text"
                      value={navBtnColor}
                      onChange={(e) => setNavBtnColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Corner Radius & Surface Borders */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Cards & Corner Radius</span>
              </h2>
              <p className="text-xs text-slate-400">
                Determines the global border radius applied across product cards, buttons, modals, and images.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { id: "rounded-none", name: "Sharp (0px)", desc: "Brutalist / Modernist", preview: "rounded-none" },
                { id: "rounded-md", name: "Subtle (6px)", desc: "Classic / Clean", preview: "rounded-md" },
                { id: "rounded-lg", name: "Standard (8px)", desc: "Balanced Contemporary", preview: "rounded-lg" },
                { id: "rounded-xl", name: "Modern (12px)", desc: "Smooth Studio Edge", preview: "rounded-xl" },
                { id: "rounded-2xl", name: "Curved (16px)", desc: "Friendly Mobile-First", preview: "rounded-2xl" },
              ].map((item) => {
                const isSelected = radius === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRadius(item.id)}
                    className={`p-4 text-center border transition-all cursor-pointer flex flex-col items-center justify-between ${item.preview} ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 border-2 border-dashed mb-3 ${item.preview} ${
                        isSelected ? "border-cyan-400 bg-cyan-500/20" : "border-slate-500 bg-white/5"
                      }`}
                    />
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? "text-cyan-300" : "text-white"}`}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Footer Appearance */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-cyan-400" />
                <span>Footer Appearance</span>
              </h2>
              <p className="text-xs text-slate-400">
                Colors for the bottom storefront footer bar and copyright area.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-white">Footer Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={footerBgColor.startsWith("#") ? footerBgColor : "#1f242e"}
                    onChange={(e) => setFooterBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={footerBgColor}
                    onChange={(e) => setFooterBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-white">Footer Text & Muted Links</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={footerTextColor.startsWith("#") ? footerTextColor : "#94a3b8"}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={footerTextColor}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STOREFRONT MESSAGING                               */}
      {/* ======================================================== */}
      {activeTab === "messaging" && (
        <div className="space-y-6">
          {/* Section 1: Announcement Bar */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Storefront Announcement Bar</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Top-of-page promotional ribbon displayed prominently above the header.
                </p>
              </div>

              {/* Announcement Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-300">
                  {announcementEnabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>

            {/* Announcement Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Badge Label</label>
                <input
                  type="text"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  placeholder="e.g. Free Shipping"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Announcement Message</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Free Express Courier on orders over ৳2,000 • Code: AETHER10 (-10%)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Live Banner Preview */}
            {announcementEnabled && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/50 to-slate-950/80 border border-emerald-500/20 flex items-center justify-center gap-2.5 text-center text-xs">
                {announcementBadge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                    {announcementBadge}
                  </span>
                )}
                <span className="text-slate-200 font-medium">{announcementText || "Your announcement message will appear here."}</span>
              </div>
            )}
          </div>

          {/* Section 2: Hero Section Copy & 3-Line Headline */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hero Section Headline & Copy</span>
              </h2>
              <p className="text-xs text-slate-400">
                The storefront hero headline is structured into 3 distinct lines, with an optional gradient highlight on Line 2.
              </p>
            </div>

            {/* 3-Line Headline Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Headline Line 1</span>
                </label>
                <input
                  type="text"
                  value={heroHeadline1}
                  onChange={(e) => setHeroHeadline1(e.target.value)}
                  placeholder="e.g. Next-Gen Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Headline Line 2 (Gradient Highlight)</span>
                </label>
                <input
                  type="text"
                  value={heroHeadline2Gradient}
                  onChange={(e) => setHeroHeadline2Gradient(e.target.value)}
                  placeholder="e.g. Pure Sensory Excellence"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-indigo-500/30 text-xs text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                  <span>Headline Line 3</span>
                </label>
                <input
                  type="text"
                  value={heroHeadline3}
                  onChange={(e) => setHeroHeadline3(e.target.value)}
                  placeholder="e.g. For High-End Creators"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Subheading & Pill Badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Hero Pill Badge</label>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={(e) => setHeroBadgeText(e.target.value)}
                  placeholder="e.g. 2026 Flagship Release"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Hero Subheading Copy</label>
                <textarea
                  rows={2}
                  value={heroSubheading}
                  onChange={(e) => setHeroSubheading(e.target.value)}
                  placeholder="Supporting elevator pitch and product value proposition..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            {/* Live Hero Headline Preview */}
            <div className="p-6 rounded-xl bg-black/60 border border-white/10 text-center space-y-3">
              {heroBadgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>{heroBadgeText}</span>
                </div>
              )}
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                <div>{heroHeadline1 || "Next-Gen Engineering"}</div>
                <div className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  {heroHeadline2Gradient || "Pure Sensory Excellence"}
                </div>
                <div>{heroHeadline3 || "For High-End Creators"}</div>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                {heroSubheading || "Your hero subheading copy will be displayed here."}
              </p>
            </div>
          </div>

          {/* Section 3: Split-Reveal Splash Intro Animation */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Split className="w-4 h-4 text-cyan-400" />
                  <span>Split-Reveal Splash Intro Animation</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cinematic curtain reveal animation displayed upon customer entry.
                </p>
              </div>

              {/* Split Reveal Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitRevealEnabled}
                  onChange={(e) => setSplitRevealEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-300">
                  {splitRevealEnabled ? "Active" : "Disabled"}
                </span>
              </label>
            </div>

            {splitRevealEnabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Intro Brand Title</label>
                    <input
                      type="text"
                      value={splitRevealTitle}
                      onChange={(e) => setSplitRevealTitle(e.target.value)}
                      placeholder="e.g. AETHER"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Intro Subtitle</label>
                    <input
                      type="text"
                      value={splitRevealSubtitle}
                      onChange={(e) => setSplitRevealSubtitle(e.target.value)}
                      placeholder="e.g. ELEVATE EVERY INHALE"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Duration Slider */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white">Duration</label>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{splitRevealDuration}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={10.0}
                      step={0.1}
                      value={splitRevealDuration}
                      onChange={(e) => setSplitRevealDuration(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Mode / Frequency */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-white block">Display Frequency</label>
                    <select
                      value={splitRevealMode}
                      onChange={(e) => setSplitRevealMode(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="every_time">Every Page Visit</option>
                      <option value="once_per_session">Once Per Session</option>
                    </select>
                  </div>

                  {/* Split Direction */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-white block">Reveal Direction</label>
                    <select
                      value={splitRevealDirection}
                      onChange={(e) => setSplitRevealDirection(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="vertical">Vertical Split (Curtain)</option>
                      <option value="horizontal">Horizontal Split</option>
                    </select>
                  </div>

                  {/* Dim Intensity */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white">Background Dim</label>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{Math.round(splitRevealDim * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={splitRevealDim}
                      onChange={(e) => setSplitRevealDim(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Wallpaper & Logo Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Wallpaper Image */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white">Splash Wallpaper Image</label>
                      {splitRevealImage && (
                        <button
                          type="button"
                          onClick={() => setSplitRevealImage("")}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {splitRevealImage ? (
                        <img
                          src={splitRevealImage}
                          alt="Splash Wallpaper Preview"
                          className="w-16 h-12 rounded-lg object-cover border border-white/10 bg-black/40"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-slate-500 text-xs">
                          None
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          ref={splitImageInputRef}
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setSplitRevealImage, "Wallpaper")}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => splitImageInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Image</span>
                        </button>
                        <p className="text-[10px] text-slate-500">Max 5MB JPG/PNG/WebP</p>
                      </div>
                    </div>
                  </div>

                  {/* Logo Overlay */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white">Splash Logo Overlay</label>
                      {splitRevealLogo && (
                        <button
                          type="button"
                          onClick={() => setSplitRevealLogo("")}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {splitRevealLogo ? (
                        <img
                          src={splitRevealLogo}
                          alt="Splash Logo Preview"
                          className="w-16 h-12 rounded-lg object-contain p-1 border border-white/10 bg-black/40"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-slate-500 text-xs">
                          None
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          ref={splitLogoInputRef}
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setSplitRevealLogo, "Logo")}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => splitLogoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Logo</span>
                        </button>
                        <p className="text-[10px] text-slate-500">Max 2MB PNG/SVG/WebP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Customer Authentication Background */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Customer Login / Signup Screen</span>
              </h2>
              <p className="text-xs text-slate-400">
                Visual presentation of the customer authentication pages (/login, /register).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Position */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <label className="text-xs font-bold text-white block">Form Card Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["left", "center", "right"] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setCustomerAuthCardPosition(pos)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                        customerAuthCardPosition === pos
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Aligns login box on widescreen monitors</p>
              </div>

              {/* Fallback Color */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Background Color</label>
                  <span className="text-[10px] font-mono text-slate-400">{customerAuthBgColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customerAuthBgColor.startsWith("#") ? customerAuthBgColor : "#ffffff"}
                    onChange={(e) => setCustomerAuthBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={customerAuthBgColor}
                    onChange={(e) => setCustomerAuthBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Background Wallpaper Image */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Background Image</label>
                  {customerAuthBgImage && (
                    <button
                      type="button"
                      onClick={() => setCustomerAuthBgImage("")}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {customerAuthBgImage ? (
                    <img
                      src={customerAuthBgImage}
                      alt="Auth Background Preview"
                      className="w-14 h-10 rounded-lg object-cover border border-white/10 bg-black/40"
                    />
                  ) : (
                    <div className="w-14 h-10 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-slate-500 text-xs">
                      None
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={authBgInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, setCustomerAuthBgImage, "Auth Background")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => authBgInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Wallpaper</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Deals & Promotional Badges */}
          <div className="p-5 rounded-2xl bg-[#0f121a]/80 border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Promotional Navigation & Deals</span>
              </h2>
              <p className="text-xs text-slate-400">
                Navbar promotional shortcut links and category mega-menu callout cards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Navbar Deals Shortcut */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Navbar Deals Shortcut Link</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={navDealsEnabled}
                      onChange={(e) => setNavDealsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 mb-1 block">Label Text</span>
                    <input
                      type="text"
                      value={navDealsText}
                      onChange={(e) => setNavDealsText(e.target.value)}
                      placeholder="Deals"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 mb-1 block">Target URL</span>
                    <input
                      type="text"
                      value={navDealsLink}
                      onChange={(e) => setNavDealsLink(e.target.value)}
                      placeholder="/products?discounted=true"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Category Deals Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Mega-Menu Category Deals Card</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryDealsCardEnabled}
                      onChange={(e) => setCategoryDealsCardEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 mb-1 block">Card Title</span>
                    <input
                      type="text"
                      value={categoryDealsCardTitle}
                      onChange={(e) => setCategoryDealsCardTitle(e.target.value)}
                      placeholder="Top Deals"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 mb-1 block">Card Subtitle</span>
                    <input
                      type="text"
                      value={categoryDealsCardSubtitle}
                      onChange={(e) => setCategoryDealsCardSubtitle(e.target.value)}
                      placeholder="Up to 20% Off"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saveLabel="Save Theme"
        discardLabel="Discard"
      />

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0f121a] border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset to Factory Defaults?</h3>
                <p className="text-xs text-slate-400">This will revert your storefront appearance</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              All custom colors, button tokens, hero headlines, announcements, and split-reveal settings will be restored to their factory defaults. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>{resetting ? "Resetting..." : "Yes, Reset Defaults"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContentThemePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <ThemeStudioInner />
    </Suspense>
  );
}
