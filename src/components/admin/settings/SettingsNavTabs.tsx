"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Truck, 
  GitCommit, 
  Search, 
  Smartphone, 
  Bell, 
  Cpu, 
  Puzzle, 
  Palette, 
  Store, 
  LayoutTemplate,
  FileText,
  BookOpen,
  Layers,
  ListTree,
  ExternalLink,
  Mail
} from "lucide-react";

export function SettingsNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "General Store", href: "/admin/settings", icon: Settings },
    { label: "Theme & UI", href: "/admin/settings/appearance", icon: Palette },
    { label: "Branding & Logo", href: "/admin/settings/branding", icon: Store },
    { label: "Storefront Layout", href: "/admin/settings/storefront", icon: LayoutTemplate },
    { label: "Homepage Sections", href: "/admin/settings/homepage", icon: Layers },
    { label: "CMS Static Pages", href: "/admin/online-store/pages", icon: FileText },
    { label: "Blog & Editorial", href: "/admin/blog", icon: BookOpen },
    { label: "Header Nav", href: "/admin/online-store/navigation", icon: ListTree },
    { label: "Navigation & Footer", href: "/admin/online-store/footer", icon: Layers },
    { label: "Social Links", href: "/admin/online-store/social", icon: ExternalLink },
    { label: "Shipping Zones", href: "/admin/settings/shipping", icon: Truck },
    { label: "Order Pipeline", href: "/admin/settings/statuses", icon: GitCommit },
    { label: "SEO & Search", href: "/admin/settings/seo", icon: Search },
    { label: "Mobile & PWA", href: "/admin/settings/pwa", icon: Smartphone },
    { label: "Notifications", href: "/admin/settings/notifications", icon: Bell },
    { label: "Integrations Hub", href: "/admin/integrations", icon: Puzzle },
    { label: "Mail Config", href: "/admin/settings/mail", icon: Mail },
    { label: "System & Cache", href: "/admin/settings/system", icon: Cpu },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = 
          tab.href === "/admin/settings" 
            ? pathname === "/admin/settings"
            : pathname.startsWith(tab.href) || (tab.href === "/admin/settings/appearance" && pathname === "/admin/theme");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isActive
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
