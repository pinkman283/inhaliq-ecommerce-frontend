"use client";

import { useThemeStore, resolveLogo, ThemeSettings } from "@/store/useThemeStore";
import { useAppTheme } from "@/components/providers/ThemeProvider";

export type LogoPlacement =
  | "navbar"
  | "mobile_navbar"
  | "footer"
  | "auth"
  | "auth_modal"
  | "invoice"
  | "split_reveal"
  | "admin_sidebar";

interface BrandLogoImageProps {
  placement: LogoPlacement;
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
  priority?: boolean;
  theme?: ThemeSettings;
}

/**
 * Strictly bounded responsive constraints per placement.
 * Architecture Principle:
 * - Admin controls: WHICH logo asset is assigned to WHICH placement.
 * - Frontend controls: HOW that logo is rendered (max-height, max-width, responsive bounds).
 * - Under NO circumstances can a logo push parent navbar/section heights or trigger layout shifts.
 */
const PLACEMENT_CONFIG: Record<
  LogoPlacement,
  {
    container: string;
    image: string;
    fallback: string;
  }
> = {
  navbar: {
    // Large, clear, authoritative logo like modern e-commerce sites (e.g. dcsbd.net) with mobile auto-fit
    container: "h-full max-h-[44px] min-[380px]:max-h-[52px] sm:max-h-[64px] lg:max-h-[72px] w-auto max-w-[125px] min-[360px]:max-w-[150px] min-[400px]:max-w-[180px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px] flex items-center shrink-0",
    image: "h-full max-h-[44px] min-[380px]:max-h-[52px] sm:max-h-[64px] lg:max-h-[72px] w-auto max-w-full object-contain object-left",
    fallback: "font-black text-lg min-[380px]:text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white leading-none",
  },
  mobile_navbar: {
    container: "h-full max-h-[44px] sm:max-h-[50px] w-auto max-w-[170px] sm:max-w-[200px] flex items-center shrink-0",
    image: "h-full max-h-[44px] sm:max-h-[50px] w-auto max-w-full object-contain object-left",
    fallback: "font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white leading-none",
  },
  footer: {
    // Substantial, prominent footer branding - aligned to top, eliminating upper whitespace
    container: "h-30 sm:h-34 lg:h-38 w-auto max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] flex items-start shrink-0 -mt-4 sm:-mt-15",
    image: "h-full max-h-[110px] sm:max-h-[130px] lg:max-h-[150px] w-auto max-w-full object-contain object-left filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
    fallback: "font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-none",
  },
  auth: {
    // Bounded inside auth card row (adjacent to portal badge)
    container: "h-9 sm:h-10 w-auto max-w-[170px] sm:max-w-[210px] flex items-center shrink-0",
    image: "h-full max-h-[36px] sm:max-h-[40px] w-auto max-w-full object-contain object-left",
    fallback: "font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white",
  },
  auth_modal: {
    container: "h-9 sm:h-10 w-auto max-w-[180px] flex items-center justify-center shrink-0",
    image: "h-full max-h-[36px] sm:max-h-[40px] w-auto max-w-full object-contain object-center",
    fallback: "font-black text-xl tracking-tight text-slate-900 dark:text-white",
  },
  invoice: {
    container: "h-9 sm:h-10 w-auto max-w-[190px] flex items-center shrink-0",
    image: "h-full max-h-[36px] sm:max-h-[40px] w-auto max-w-full object-contain object-left",
    fallback: "font-bold text-lg text-slate-900",
  },
  split_reveal: {
    // Bounded splash reveal (hero presence without overflowing viewport)
    container: "h-30 sm:h-34 md:h-38 lg:h-42 w-auto max-w-[350px] sm:max-w-[480px] md:max-w-[600px] lg:max-w-[720px] flex items-center justify-center shrink-0",
    image: "h-full max-h-[82px] sm:max-h-[102px] md:max-h-[128px] lg:max-h-[158px] w-auto max-w-full object-contain object-center filter drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]",
    fallback: "text-3xl sm:text-5xl font-black tracking-widest text-white uppercase leading-none",
  },
  admin_sidebar: {
    container: "h-8 max-h-[32px] w-auto max-w-[150px] flex items-center shrink-0",
    image: "h-full max-h-[30px] w-auto max-w-full object-contain object-left",
    fallback: "font-bold text-sm text-white",
  },
};

export function BrandLogoImage({
  placement,
  className = "",
  imageClassName = "",
  fallbackTextClassName = "",
  priority = false,
  theme: propTheme,
}: BrandLogoImageProps) {
  const context = useAppTheme();
  const theme = propTheme || context?.theme || useThemeStore.getState().theme;
  const isLoaded = propTheme ? true : (context?.isLoaded ?? useThemeStore.getState().isLoaded);
  const config = PLACEMENT_CONFIG[placement] || PLACEMENT_CONFIG.navbar;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const defaultLogo = "/branding/logo.png";
    if (target.src !== defaultLogo && !target.src.endsWith(defaultLogo)) {
      target.src = defaultLogo;
    }
  };

  // Specific handling for navbar responsive behavior:
  // Can serve desktopLogo for sm+ and mobileLogo for < sm
  if (placement === "navbar") {
    const desktopLogo = resolveLogo(theme, "navbar", "/branding/logo.png");
    const mobileLogo = resolveLogo(theme, "mobile_navbar", "/branding/logo.png");
    const activeLogo = desktopLogo || mobileLogo;

    if (activeLogo) {
      return (
        <div
          className={`${config.container} ${className}`}
          suppressHydrationWarning
        >
          {/* Desktop/Default Image */}
          <img
            src={desktopLogo || activeLogo}
            alt={theme.store_brand_name || "Company Logo"}
            fetchPriority={priority ? "high" : "auto"}
            onError={handleImageError}
            className={`${config.image} ${imageClassName} ${mobileLogo && mobileLogo !== desktopLogo ? "hidden sm:block" : ""
              }`}
            suppressHydrationWarning
          />

          {/* Dedicated Mobile Image (only rendered when configured differently) */}
          {mobileLogo && mobileLogo !== desktopLogo && (
            <img
              src={mobileLogo}
              alt={theme.store_brand_name || "Company Logo"}
              fetchPriority={priority ? "high" : "auto"}
              onError={handleImageError}
              className={`${PLACEMENT_CONFIG.mobile_navbar.image} ${imageClassName} block sm:hidden`}
              suppressHydrationWarning
            />
          )}
        </div>
      );
    }

    // While theme is hydrating/loading, render an invisible container instead of flashing text
    if (!isLoaded) {
      return (
        <div
          className={`${config.container} ${className} opacity-0 pointer-events-none`}
          suppressHydrationWarning
        />
      );
    }

    return (
      <span
        className={`${config.fallback} ${fallbackTextClassName}`}
        suppressHydrationWarning
      >
        {theme.store_brand_name || "INHALIQ"}
      </span>
    );
  }

  // Generic placement resolver
  const logoUrl = resolveLogo(theme, placement, "/branding/logo.png");

  if (logoUrl) {
    return (
      <div
        className={`${config.container} ${className}`}
        suppressHydrationWarning
      >
        <img
          src={logoUrl}
          alt={theme.store_brand_name || "Company Logo"}
          fetchPriority={priority ? "high" : "auto"}
          onError={handleImageError}
          className={`${config.image} ${imageClassName}`}
          suppressHydrationWarning
        />
      </div>
    );
  }

  // While theme is hydrating/loading, render an invisible container instead of flashing text
  if (!isLoaded) {
    return (
      <div
        className={`${config.container} ${className} opacity-0 pointer-events-none`}
        suppressHydrationWarning
      />
    );
  }

  // Fallback text
  return (
    <span
      className={`${config.fallback} ${fallbackTextClassName}`}
      suppressHydrationWarning
    >
      {theme.store_brand_name || "INHALIQ"}
    </span>
  );
}
