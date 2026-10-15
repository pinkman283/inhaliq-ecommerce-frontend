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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";
  const hasCustomFavicon = Boolean(serverTheme.store_favicon && serverTheme.store_favicon.trim() !== "" && serverTheme.store_favicon !== "/favicon.png" && serverTheme.store_favicon !== "/favicon.ico");
  const faviconUrl = hasCustomFavicon ? serverTheme.store_favicon! : "/favicon.png";
  const logoUrl = serverTheme.store_brand_logo || `${siteUrl}/branding/logo.png`;
  const defaultDesc = `Official ${brand} online store. Premium lifestyle, accessories, and essentials.`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${brand} | ${tagline}`,
      template: `%s | ${brand}`,
    },
    description: defaultDesc,
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
      title: `${brand} | ${tagline}`,
      description: defaultDesc,
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: brand,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand} | ${tagline}`,
      description: defaultDesc,
      images: [logoUrl],
    },
  };
}

async function getServerTheme(): Promise<ThemeSettings> {
  return cachedFetch<ThemeSettings>(
    "aether:theme:settings:v3",
    async () => {
      try {
        const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || "senior";
        if (provider === "senior") {
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
            store_brand_name: init.general_settings?.name || DEFAULT_THEME_SETTINGS.store_brand_name,
            store_brand_logo: init.general_settings?.logo || DEFAULT_THEME_SETTINGS.store_brand_logo,
            theme_primary_color: primaryColor,
            theme_primary_hover: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
            theme_secondary_color: secondaryColor,
            theme_secondary_hover: STOREFRONT_CONFIG.THEME_COLORS.SECONDARY_HOVER,
            theme_btn_primary_bg: primaryColor,
            theme_tab_active_bg: primaryColor,
            theme_view_all_color: primaryColor,
            theme_hover_text: STOREFRONT_CONFIG.THEME_COLORS.PRIMARY_HOVER,
          };
        }

        const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(`${apiUrl}/theme-settings`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          const primaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.PRIMARY
            : (data.theme_primary_color || STOREFRONT_CONFIG.THEME_COLORS.PRIMARY);
          const secondaryColor = STOREFRONT_CONFIG.OVERRIDE_BACKEND_THEME_COLORS
            ? STOREFRONT_CONFIG.THEME_COLORS.SECONDARY
            : (data.theme_secondary_color || STOREFRONT_CONFIG.THEME_COLORS.SECONDARY);

          return {
            ...DEFAULT_THEME_SETTINGS,
            ...data,
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
      return DEFAULT_THEME_SETTINGS;
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
  const isFooterLight = getHexLuminance(serverTheme.theme_footer_bg_color || "#1f242e") > 0.45;
  const footerBg = serverTheme.theme_footer_bg_color || "#1f242e";
  const footerText = serverTheme.theme_footer_text_color || (isFooterLight ? "#475569" : "#94a3b8");
  const footerBorder = isFooterLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const footerHeading = isFooterLight ? "#0f172a" : "#ffffff";
  const footerRibbonBg = isFooterLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)";
  const footerInputBg = isFooterLight ? "#ffffff" : "rgba(255, 255, 255, 0.05)";
  const footerInputBorder = isFooterLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.12)";
  const footerInputText = isFooterLight ? "#0f172a" : "#ffffff";
  const footerSocialBg = isFooterLight ? "#ffffff" : "rgba(255, 255, 255, 0.05)";
  const footerSocialBorder = isFooterLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.1)";
  const footerLogoBg = isFooterLight ? "#f8fafc" : "#0d1017";

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
                --theme-card-bg: ${serverTheme.theme_card_bg_color};
                --theme-card-border: ${serverTheme.theme_card_border_color || (isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)")};
                --theme-card-radius: ${serverTheme.theme_card_radius || STOREFRONT_CONFIG.DEFAULT_CARD_RADIUS || "10px"};
                --theme-text-heading: ${serverTheme.theme_text_heading_color || (isLight ? "#0f172a" : "#ffffff")};
                --theme-text-body: ${serverTheme.theme_text_body_color || (isLight ? "#475569" : "#94a3b8")};
                --theme-btn-primary-bg: ${serverTheme.theme_btn_primary_bg || serverTheme.theme_primary_color};
                --theme-btn-primary-text: ${serverTheme.theme_btn_primary_text || "#ffffff"};
                --theme-btn-secondary-bg: ${serverTheme.theme_btn_secondary_bg || (isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.05)")};
                --theme-btn-secondary-text: ${serverTheme.theme_btn_secondary_text || (isLight ? "#0f172a" : "#ffffff")};
                --theme-tab-active-bg: ${serverTheme.theme_tab_active_bg || serverTheme.theme_view_all_color || serverTheme.theme_primary_color};
                --theme-tab-active-text: ${serverTheme.theme_tab_active_text || "#ffffff"};
                --theme-view-all-color: ${serverTheme.theme_view_all_color || serverTheme.theme_tab_active_bg || serverTheme.theme_primary_color};
                --theme-hover-bg: ${serverTheme.theme_hover_bg || (isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)")};
                --theme-hover-text: ${serverTheme.theme_hover_text || serverTheme.theme_primary_color};
                --theme-nav-btn-bg: ${serverTheme.theme_nav_btn_bg || (isLight ? "#ffffff" : "#0c101d")};
                --theme-nav-btn-color: ${serverTheme.theme_nav_btn_color || (isLight ? "#0f172a" : "#ffffff")};
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
        <DynamicFavicon />
        <TrackingScripts />
        <AppProviders initialTheme={initialTheme}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
