import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { DynamicFavicon } from "@/components/shared/DynamicFavicon";
import { cn } from "@/lib/utils";
import { cachedFetch } from "@/lib/redis";
import { cookies } from "next/headers";
import { DEFAULT_THEME_SETTINGS, ThemeSettings, getHexLuminance, useThemeStore } from "@/store/useThemeStore";
import { getStorefrontApi } from "@/lib/api";
import { STOREFRONT_CONFIG } from "@/config/storefrontConfig";
import { TrackingScripts } from "@/components/analytics/TrackingScripts";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const serverTheme = await getServerTheme();
  const brand = serverTheme.store_brand_name || "INHALIQ";
  const tagline = serverTheme.store_brand_tagline || "ELEVATE EVERY INHALE";
  const seo = serverTheme.seo_meta || {};
  const siteUrl = seo.canonical_base_url || process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const hasCustomFavicon = Boolean(serverTheme.store_favicon && serverTheme.store_favicon.trim() !== "" && serverTheme.store_favicon !== "/favicon.png" && serverTheme.store_favicon !== "/favicon.ico");
  const faviconUrl = hasCustomFavicon ? serverTheme.store_favicon! : "/favicon.png";
  const logoUrl = serverTheme.store_brand_logo || `${siteUrl}/branding/logo.png`;
  const isAudioLeak = seo.meta_title && (seo.meta_title.includes("Audio") || seo.meta_title.includes("AETHER"));
  const metaTitle = (seo.meta_title && !isAudioLeak) ? seo.meta_title : `${brand} | ${tagline}`;
  const defaultDesc = seo.meta_description || `Official ${brand} online store. Premium lifestyle, accessories, and essentials.`;
  const keywords = seo.meta_keywords ? seo.meta_keywords.split(",").map((k) => k.trim()) : undefined;
  const ogImage = seo.og_image || logoUrl;

  const verification: Metadata["verification"] = {};
  if (seo.google_site_verification) {
    verification.google = seo.google_site_verification;
  }
  if (seo.bing_site_verification) {
    verification.other = {
      ...(verification.other || {}),
      "msvalidate.01": seo.bing_site_verification,
    };
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: metaTitle,
      template: `%s | ${brand}`,
    },
    description: defaultDesc,
    keywords,
    verification: Object.keys(verification).length > 0 ? verification : undefined,
    alternates: {
      canonical: "/",
    },
    icons: hasCustomFavicon
      ? {
          icon: [
            { url: faviconUrl },
            { url: faviconUrl, sizes: "32x32" },
            { url: faviconUrl, sizes: "16x16" },
            { url: faviconUrl, sizes: "512x512" },
          ],
          shortcut: [faviconUrl],
          apple: [{ url: faviconUrl, sizes: "180x180" }],
        }
      : {
          icon: [
            { url: "/favicon.png" },
            { url: "/favicon.png", sizes: "512x512", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon.ico" },
          ],
          shortcut: ["/favicon.png"],
          apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          ],
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: brand,
      title: metaTitle,
      description: defaultDesc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: brand,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: defaultDesc,
      images: [ogImage],
    },
  };
}

async function getServerTheme(): Promise<ThemeSettings> {
  return cachedFetch<ThemeSettings>(
    "aether:theme:settings:premium:v1",
    async () => {
      let localSettings: Partial<ThemeSettings> = {};
      const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";
      try {
        const localRes = await fetch(`${apiUrl}/theme-settings`, {
          signal: AbortSignal.timeout(3000),
          next: { revalidate: 60, tags: ["theme"] },
        });
        if (localRes.ok) {
          localSettings = await localRes.json();
        }
      } catch (e) {
        // Fallback to defaults
      }

      try {
        const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior";
        if (provider === "senior") {
          try {
            const api = getStorefrontApi("senior");
            const init = await api.getInitSettings();
            const rawPrimary = init.main_settings?.primary_color;
            const rawSecondary = init.main_settings?.secondary_color;
            const primaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
              ? STOREFRONT_CONFIG.THEME_COLORS.PRIMARY
              : (rawPrimary || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY);
            const secondaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
              ? STOREFRONT_CONFIG.THEME_COLORS.SECONDARY
              : (rawSecondary || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY);

            return {
              ...DEFAULT_THEME_SETTINGS,
              ...localSettings,
              store_brand_name: localSettings.store_brand_name || init.general_settings?.name || DEFAULT_THEME_SETTINGS.store_brand_name,
              store_brand_logo: localSettings.store_brand_logo || init.general_settings?.white_logo || init.general_settings?.logo || DEFAULT_THEME_SETTINGS.store_brand_logo,
              store_favicon: localSettings.store_favicon || init.general_settings?.favicon || DEFAULT_THEME_SETTINGS.store_favicon,
              theme_primary_color: primaryColor,
              theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
              theme_secondary_color: secondaryColor,
              theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
              theme_btn_primary_bg: primaryColor,
              theme_tab_active_bg: primaryColor,
              theme_view_all_color: primaryColor,
              theme_hover_text: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
              theme_footer_bg_color: init.main_settings?.footer_color || localSettings.theme_footer_bg_color || "#0F172A",
              theme_bg_color: localSettings.theme_bg_color || "#F8FAFC",
              theme_card_bg_color: localSettings.theme_card_bg_color || "#FFFFFF",
              theme_card_border_color: localSettings.theme_card_border_color || "#E2E8F0",
              theme_text_heading_color: localSettings.theme_text_heading_color || "#0F172A",
              theme_text_body_color: localSettings.theme_text_body_color || "#475569",
            };
          } catch (seniorErr) {
            console.warn("Senior API fallback to local settings:", seniorErr);
          }
        }

        if (Object.keys(localSettings).length > 0) {
          const primaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.PRIMARY
            : (localSettings.theme_primary_color || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY);
          const secondaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.SECONDARY
            : (localSettings.theme_secondary_color || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY);

          return {
            ...DEFAULT_THEME_SETTINGS,
            ...localSettings,
            theme_primary_color: primaryColor,
            theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
            theme_secondary_color: secondaryColor,
            theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
            theme_btn_primary_bg: primaryColor,
            theme_tab_active_bg: primaryColor,
            theme_view_all_color: primaryColor,
          };
        }
      } catch (err) {
        console.warn("SSR theme fetch fallback triggered:", err);
      }
      return { ...DEFAULT_THEME_SETTINGS, ...localSettings };
    },
    {
      ttlSeconds: 21600, // 6 hours
      tags: ["theme"],
    }
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTheme = await getServerTheme();
  const initialTheme = { ...serverTheme };

  try {
    const cookieStore = await cookies();
    const hasSeenSplash = cookieStore.get("aether_split_reveal_seen")?.value === "true";
    if (hasSeenSplash && serverTheme.split_reveal_mode === "once_per_session") {
      initialTheme.split_reveal_enabled = false;
    }
  } catch (e) {}

  useThemeStore.setState({ theme: initialTheme, isLoaded: true });
  const isLight = getHexLuminance(serverTheme.theme_bg_color) > 0.45;
  const isFooterLight = getHexLuminance(serverTheme.theme_footer_bg_color || (isLight ? "#0F172A" : "#1f242e")) > 0.45;
  const footerBg = serverTheme.theme_footer_bg_color || (isLight ? "#0F172A" : "#1f242e");
  const footerText = serverTheme.theme_footer_text_color || (isFooterLight ? "#475569" : "#94A3B8");
  const footerBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.08)";
  const footerHeading = isFooterLight ? "#0F172A" : "#FFFFFF";
  const footerRibbonBg = isFooterLight ? "#F1F5F9" : "rgba(255, 255, 255, 0.02)";
  const footerInputBg = isFooterLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.08)";
  const footerInputBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.15)";
  const footerInputText = isFooterLight ? "#0F172A" : "#FFFFFF";
  const footerSocialBg = isFooterLight ? "#F1F5F9" : "rgba(255, 255, 255, 0.08)";
  const footerSocialBorder = isFooterLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";
  const footerLogoBg = isFooterLight ? "#FFFFFF" : "#1E293B";

  const brand = serverTheme.store_brand_name || "INHALIQ";
  const siteUrl = serverTheme.seo_meta?.canonical_base_url || process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const logoUrl = serverTheme.store_brand_logo || `${siteUrl}/branding/logo.png`;
  const business = serverTheme.business_contact || {};

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    legalName: business.legal_name || brand,
    url: siteUrl,
    logo: logoUrl,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: business.hotline || "+880 1800-AETHER",
        contactType: "customer service",
        email: business.support_email || "support@inhaliq.com",
        availableLanguage: ["English", "Bengali"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: business.warehouse_address || "Dhaka, Bangladesh",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={cn(isLight ? "theme-light-mode" : "dark", "scroll-smooth font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        {serverTheme.store_favicon && serverTheme.store_favicon !== "/favicon.png" && (
          <link rel="icon" href={serverTheme.store_favicon} sizes="any" />
        )}
        {serverTheme.store_brand_logo && (
          <link rel="preload" as="image" href={serverTheme.store_brand_logo} fetchPriority="high" />
        )}
        {serverTheme.split_reveal_image && (
          <link rel="preload" as="image" href={serverTheme.split_reveal_image} fetchPriority="high" />
        )}
        <style
          id="theme-server-vars"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --theme-primary: ${serverTheme.theme_primary_color};
                --theme-primary-hover: ${serverTheme.theme_primary_hover || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER};
                --theme-secondary: ${serverTheme.theme_secondary_color};
                --theme-secondary-hover: ${serverTheme.theme_secondary_hover || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER};
                --theme-bg: ${serverTheme.theme_bg_color};
                --theme-bg-muted: ${isLight ? "#F1F5F9" : "#0e121e"};
                --theme-card-bg: ${serverTheme.theme_card_bg_color};
                --theme-card-border: ${serverTheme.theme_card_border_color || (isLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.08)")};
                --theme-card-radius: ${serverTheme.theme_card_radius || STOREFRONT_CONFIG.DEFAULT_CARD_RADIUS || "10px"};
                --theme-text-heading: ${serverTheme.theme_text_heading_color || (isLight ? "#0F172A" : "#ffffff")};
                --theme-text-body: ${serverTheme.theme_text_body_color || (isLight ? "#475569" : "#94a3b8")};
                --theme-btn-primary-bg: ${serverTheme.theme_btn_primary_bg || serverTheme.theme_primary_color};
                --theme-btn-primary-text: ${serverTheme.theme_btn_primary_text || "#FFFFFF"};
                --theme-btn-secondary-bg: ${serverTheme.theme_btn_secondary_bg || (isLight ? "#F1F5F9" : "rgba(255, 255, 255, 0.05)")};
                --theme-btn-secondary-text: ${serverTheme.theme_btn_secondary_text || (isLight ? "#0F172A" : "#ffffff")};
                --theme-tab-active-bg: ${serverTheme.theme_tab_active_bg || serverTheme.theme_view_all_color || serverTheme.theme_primary_color};
                --theme-tab-active-text: ${serverTheme.theme_tab_active_text || "#FFFFFF"};
                --theme-view-all-color: ${serverTheme.theme_view_all_color || serverTheme.theme_tab_active_bg || serverTheme.theme_primary_color};
                --theme-hover-bg: ${serverTheme.theme_hover_bg || (isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.08)")};
                --theme-hover-text: ${serverTheme.theme_hover_text || serverTheme.theme_primary_hover || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER};
                --theme-nav-btn-bg: ${serverTheme.theme_nav_btn_bg || (isLight ? "#FFFFFF" : "#0c101d")};
                --theme-nav-btn-color: ${serverTheme.theme_nav_btn_color || (isLight ? "#0F172A" : "#ffffff")};
                --theme-footer-bg: ${footerBg};
                --theme-footer-text: ${footerText};
                --theme-footer-border: ${footerBorder};
                --theme-footer-heading: ${footerHeading};
                --theme-footer-ribbon-bg: ${footerRibbonBg};
                --theme-footer-input-bg: ${footerInputBg};
                --theme-footer-input-border: ${footerInputBorder};
                --theme-footer-input-text: ${footerInputText};
                --theme-footer-social-bg: ${footerSocialBg};
                --theme-footer-social-border: ${footerSocialBorder};
                --theme-footer-logo-inner-bg: ${footerLogoBg};
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geist.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-clip`}
        style={{ backgroundColor: serverTheme.theme_bg_color }}
        suppressHydrationWarning
      >
        {/* Global Organization & WebSite JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <DynamicFavicon />
        <TrackingScripts />
        <AppProviders initialTheme={initialTheme}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
