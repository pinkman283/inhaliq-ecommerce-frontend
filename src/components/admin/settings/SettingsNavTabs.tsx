"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Truck, 
  SlidersHorizontal, 
  Search, 
  Smartphone, 
  Bell, 
  Cpu, 
  Palette, 
  Store, 
  LayoutTemplate, 
  Layers, 
  ListTree, 
  Sparkles,
  FileText,
  BookOpen,
  ExternalLink
} from "lucide-react";

export function SettingsNavTabs() {
  const pathname = usePathname();

  // Determine domain context: Appearance / Storefront vs System Settings
  const isAppearanceContext = 
    pathname.includes("/content") ||
    pathname.includes("/appearance") ||
    pathname.includes("/theme") ||
    pathname.includes("/branding") ||
    pathname.includes("/storefront") ||
    pathname.includes("/homepage") ||
    pathname.includes("/blog") ||
    pathname.includes("/online-store");

  const appearanceTabs = [
    { label: "Theme & Storefront", href: "/admin/content/theme", icon: Palette },
    { label: "Branding & Logos", href: "/admin/content/branding", icon: Store },
    { label: "Homepage Sections", href: "/admin/content/homepage", icon: Layers },
    { label: "Banners & Ads", href: "/admin/content/banners", icon: Sparkles },
    { label: "Navigation", href: "/admin/content/navigation", icon: ListTree },
    { label: "Blog & Editorial", href: "/admin/content/blog", icon: BookOpen },
    { label: "Pages (CMS)", href: "/admin/content/pages", icon: FileText },
    { label: "Footer & Social", href: "/admin/content/footer", icon: ExternalLink },
  ];

  const systemTabs = [
    { label: "General Settings", href: "/admin/settings", icon: Settings },
    { label: "Shipping & Delivery", href: "/admin/orders/shipping", icon: Truck },
    { label: "Order Status Pipeline", href: "/admin/orders/statuses", icon: SlidersHorizontal },
    { label: "Notifications", href: "/admin/settings/notifications", icon: Bell },
    { label: "SEO & Search", href: "/admin/settings/seo", icon: Search },
    { label: "Mobile & PWA", href: "/admin/settings/pwa", icon: Smartphone },
    { label: "System & Cache", href: "/admin/settings/system", icon: Cpu },
  ];

  const activeTabs = isAppearanceContext ? appearanceTabs : systemTabs;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#272B35] no-scrollbar">
      {activeTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = 
          tab.href === "/admin/settings" 
            ? pathname === "/admin/settings"
            : pathname.startsWith(tab.href) || 
              (tab.href === "/admin/content/theme" && (
                pathname === "/admin/content/theme" ||
                pathname === "/admin/theme" ||
                pathname.startsWith("/admin/settings/appearance") ||
                pathname.startsWith("/admin/settings/storefront")
              )) ||
              (tab.href === "/admin/content/branding" && pathname.startsWith("/admin/settings/branding")) ||
              (tab.href === "/admin/content/homepage" && pathname.startsWith("/admin/settings/homepage")) ||
              (tab.href === "/admin/content/banners" && (pathname.startsWith("/admin/online-store/banners") || pathname.startsWith("/admin/banners") || pathname.startsWith("/admin/marketing/banners"))) ||
              (tab.href === "/admin/content/navigation" && pathname.startsWith("/admin/online-store/navigation")) ||
              (tab.href === "/admin/content/blog" && (pathname.startsWith("/admin/content/blog") || pathname.startsWith("/admin/blog"))) ||
              (tab.href === "/admin/content/pages" && pathname.startsWith("/admin/online-store/pages")) ||
              (tab.href === "/admin/content/footer" && (pathname.startsWith("/admin/online-store/footer") || pathname.startsWith("/admin/online-store/social") || pathname.startsWith("/admin/content/social"))) ||
              (tab.href === "/admin/orders/shipping" && pathname.startsWith("/admin/settings/shipping")) ||
              (tab.href === "/admin/orders/statuses" && pathname.startsWith("/admin/settings/statuses"));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isActive
                ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
                : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-[#171B26] border border-transparent"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#A78BFA]" : "text-[#626B7B]"}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
