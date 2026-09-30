/**
 * Centralized Image Slot Registry
 * 
 * Defines authoritative recommended dimensions, aspect ratios, and responsive
 * guidance for all image upload locations across the admin panel and storefront.
 */

export interface ImageSlotConfig {
  key: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  ratioValue: number;
  tip?: string;
  desktopRecommended: string;
  mobileRecommended?: string;
  separateMobileSupported?: boolean;
}

export const IMAGE_SLOTS: Record<string, ImageSlotConfig> = {
  // 1. Hero Banner Placements
  hero_banner_desktop: {
    key: "hero_banner_desktop",
    name: "Primary Hero Banner (Desktop)",
    width: 1920,
    height: 640,
    aspectRatio: "3:1",
    ratioValue: 3.0,
    tip: "Panoramic widescreen hero slider. Aspect ratio is most important to prevent cropping.",
    desktopRecommended: "Recommended: 1920 × 640 px · 3:1",
    mobileRecommended: "Mobile: 800 × 450 px · 16:9",
    separateMobileSupported: true,
  },
  hero_banner_mobile: {
    key: "hero_banner_mobile",
    name: "Primary Hero Banner (Mobile)",
    width: 800,
    height: 450,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Displays on small screens (<640px) to prevent aggressive horizontal cropping.",
    desktopRecommended: "Mobile: 800 × 450 px · 16:9",
  },
  secondary_hero_desktop: {
    key: "secondary_hero_desktop",
    name: "Secondary Promotional Card (Desktop)",
    width: 800,
    height: 560,
    aspectRatio: "10:7",
    ratioValue: 1.428,
    tip: "Side card beside hero slider. Aspect ratio is key.",
    desktopRecommended: "Recommended: 800 × 560 px · 10:7",
    mobileRecommended: "Mobile: 800 × 450 px · 16:9",
    separateMobileSupported: true,
  },
  secondary_hero_mobile: {
    key: "secondary_hero_mobile",
    name: "Secondary Promotional Card (Mobile)",
    width: 800,
    height: 450,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Displays on mobile screens (<640px) when side card stacks full-width.",
    desktopRecommended: "Mobile: 800 × 450 px · 16:9",
  },
  bottom_banner_desktop: {
    key: "bottom_banner_desktop",
    name: "Bottom Promotional Banner (Desktop)",
    width: 1200,
    height: 750,
    aspectRatio: "16:10",
    ratioValue: 1.6,
    tip: "Promotional voucher showcase card. Aspect ratio is key.",
    desktopRecommended: "Recommended: 1200 × 750 px · 16:10",
    mobileRecommended: "Mobile: 800 × 450 px · 16:9",
    separateMobileSupported: true,
  },
  bottom_banner_mobile: {
    key: "bottom_banner_mobile",
    name: "Bottom Promotional Banner (Mobile)",
    width: 800,
    height: 450,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Mobile showcase display on small screens.",
    desktopRecommended: "Mobile: 800 × 450 px · 16:9",
  },

  // 2. Catalog & Products
  product_main: {
    key: "product_main",
    name: "Product Main Image",
    width: 1200,
    height: 1200,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Primary catalog card & gallery stage. Square 1:1 aspect ratio ensures consistent alignment.",
    desktopRecommended: "Recommended: 1200 × 1200 px · 1:1",
  },
  product_gallery: {
    key: "product_gallery",
    name: "Product Gallery Image",
    width: 1200,
    height: 1200,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Secondary showcase & thumbnail frame. Keep 1:1 square for uniform previews.",
    desktopRecommended: "Recommended: 1200 × 1200 px · 1:1",
  },
  category_image: {
    key: "category_image",
    name: "Category Cover Image",
    width: 600,
    height: 600,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Category navigation tile & showcase header. Transparent PNG or centered subject recommended.",
    desktopRecommended: "Recommended: 600 × 600 px · 1:1",
  },
  brand_logo: {
    key: "brand_logo",
    name: "Brand Manufacturer Logo",
    width: 500,
    height: 500,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Brand filter & directory badge. Transparent PNG or SVG recommended.",
    desktopRecommended: "Recommended: 500 × 500 px · 1:1",
  },

  // 3. Branding & Favicon
  store_favicon: {
    key: "store_favicon",
    name: "Browser Favicon",
    width: 512,
    height: 512,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Browser tab & bookmark icon. Transparent PNG, ICO, or SVG. Affects only browser icon.",
    desktopRecommended: "Recommended: 512 × 512 px · 1:1",
  },
  brand_logo_entry: {
    key: "brand_logo_entry",
    name: "Brand Logo Asset",
    width: 512,
    height: 512,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "High-resolution square or horizontal brand mark. Aspect ratio is key.",
    desktopRecommended: "Recommended: 512 × 512 px · 1:1",
  },
  admin_brand_logo: {
    key: "admin_brand_logo",
    name: "Admin Brand Logo",
    width: 512,
    height: 512,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Square manufacturer brand emblem or wordmark. Transparent PNG, WEBP, or JPG recommended.",
    desktopRecommended: "Recommended: 512 × 512 px · 1:1",
  },
  navbar_logo: {
    key: "navbar_logo",
    name: "Desktop Navbar Logo",
    width: 400,
    height: 400,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Desktop navigation header. Square emblem or horizontal mark with transparent background.",
    desktopRecommended: "Recommended: 400 × 400 px · 1:1",
  },
  mobile_navbar_logo: {
    key: "mobile_navbar_logo",
    name: "Mobile Navbar Logo",
    width: 320,
    height: 320,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Mobile navigation header (<640px). Compact icon or monogram recommended.",
    desktopRecommended: "Recommended: 320 × 320 px · 1:1",
  },
  footer_logo: {
    key: "footer_logo",
    name: "Storefront Footer Logo",
    width: 500,
    height: 500,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Storefront footer emblem. Transparent PNG or SVG recommended.",
    desktopRecommended: "Recommended: 500 × 500 px · 1:1",
  },
  auth_logo: {
    key: "auth_logo",
    name: "Login / Registration Logo",
    width: 400,
    height: 400,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Customer authentication portal header.",
    desktopRecommended: "Recommended: 400 × 400 px · 1:1",
  },
  invoice_logo: {
    key: "invoice_logo",
    name: "Invoice & Receipt Logo",
    width: 600,
    height: 200,
    aspectRatio: "3:1",
    ratioValue: 3.0,
    tip: "Order invoices & PDF receipts. Crisp horizontal or square brand logo.",
    desktopRecommended: "Recommended: 600 × 200 px · 3:1",
  },
  split_reveal_logo: {
    key: "split_reveal_logo",
    name: "Splash Screen / Split Reveal Logo",
    width: 512,
    height: 512,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Centered split reveal opening shutter mark.",
    desktopRecommended: "Recommended: 512 × 512 px · 1:1",
  },

  // 4. Storefront & Wallpaper
  split_wallpaper: {
    key: "split_wallpaper",
    name: "Splash Screen Wallpaper",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Full viewport intro wallpaper. Center-weighted composition recommended.",
    desktopRecommended: "Recommended: 1920 × 1080 px · 16:9",
  },
  auth_wallpaper: {
    key: "auth_wallpaper",
    name: "Customer Auth Background",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Full-screen background for login and registration portals.",
    desktopRecommended: "Recommended: 1920 × 1080 px · 16:9",
  },

  // 5. Blog, Staff & SEO
  blog_cover: {
    key: "blog_cover",
    name: "Blog Featured Cover",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    ratioValue: 1.778,
    tip: "Article card thumbnail and hero banner. 16:9 aspect-video.",
    desktopRecommended: "Recommended: 1280 × 720 px · 16:9",
  },
  avatar: {
    key: "avatar",
    name: "Staff & User Avatar",
    width: 400,
    height: 400,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Square portrait avatar. High resolution face-centered photo.",
    desktopRecommended: "Recommended: 400 × 400 px · 1:1",
  },
  seo_og_image: {
    key: "seo_og_image",
    name: "OpenGraph Social Share Image",
    width: 1200,
    height: 630,
    aspectRatio: "1.91:1",
    ratioValue: 1.905,
    tip: "Social card preview for Facebook, X/Twitter, and LinkedIn shares.",
    desktopRecommended: "Recommended: 1200 × 630 px · 1.91:1",
  },
  pwa_icon_192: {
    key: "pwa_icon_192",
    name: "PWA Icon (192×192)",
    width: 192,
    height: 192,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Mobile home screen application icon.",
    desktopRecommended: "Recommended: 192 × 192 px · 1:1",
  },
  pwa_icon_512: {
    key: "pwa_icon_512",
    name: "PWA High-Res Splash Icon (512×512)",
    width: 512,
    height: 512,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Installable app splash screen high-resolution icon.",
    desktopRecommended: "Recommended: 512 × 512 px · 1:1",
  },
  admin_profile_avatar: {
    key: "admin_profile_avatar",
    name: "Admin Profile Avatar",
    width: 400,
    height: 400,
    aspectRatio: "1:1",
    ratioValue: 1.0,
    tip: "Square portrait avatar. Center-cropped for circle display.",
    desktopRecommended: "Recommended: 400 × 400 px · 1:1",
  },
};

export function getImageSlot(key: string): ImageSlotConfig {
  return (
    IMAGE_SLOTS[key] || {
      key,
      name: "Custom Image",
      width: 1200,
      height: 1200,
      aspectRatio: "1:1",
      ratioValue: 1.0,
      desktopRecommended: "Recommended: 1200 × 1200 px · 1:1",
    }
  );
}
