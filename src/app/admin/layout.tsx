"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Layers, 
  FolderTree, 
  Boxes, 
  ShoppingBag, 
  Users, 
  Tag, 
  Star, 
  UserCog, 
  ScrollText, 
  Settings, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  Search,
  Magnet,
  Calculator,
  Truck,
  FileText,
  PackageCheck,
  Coins,
  TrendingUp,
  Receipt,
  BadgeDollarSign,
  Palette,
  Building2,
  SlidersHorizontal,
  Command,
  Store,
  Landmark,
  BookOpen,
  FileSpreadsheet,
  Wallet,
  ListTree,
  Megaphone,
  Puzzle,
  BarChart3,
  Percent,
  Ticket,
  Gift,
  Zap,
  Award,
  CreditCard,
  History,
  Sparkles,
  RotateCcw,
  Mail,
  Bell,
  MessageSquare,
  MessageCircle,
  Smartphone,
  Briefcase,
  Lock,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { useThemeStore, resolveLogo } from "@/store/useThemeStore";
import { adminApi } from "@/lib/adminApi";
import { SidebarNavGroup, SidebarNavLink, NavChildItem } from "@/components/admin/SidebarNavGroup";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CursorScrollProvider } from "@/components/admin/CursorScrollProvider";
import { AdminAccountDropdown } from "@/components/admin/AdminAccountDropdown";


function AdminDynamicBreadcrumb({ allItems, pathname }: { allItems: any[]; pathname: string }) {
  const searchParams = useSearchParams();

  const currentNavItem = useMemo(() => {
    const queryString = searchParams.toString();
    if (queryString) {
      const fullUrl = `${pathname}?${queryString}`;
      const exactMatch = allItems.find((item) => item.href === fullUrl);
      if (exactMatch) return exactMatch;

      // Partial query match (e.g. category parameter)
      const queryMatch = allItems.find((item) => {
        if (!item.href.includes("?")) return false;
        const [targetPath, targetQuery] = item.href.split("?");
        if (pathname !== targetPath) return false;
        const targetParams = new URLSearchParams(targetQuery);
        return Array.from(targetParams.entries()).every(
          ([k, v]) => searchParams.get(k) === v
        );
      });
      if (queryMatch) return queryMatch;
    }

    // Exact pathname match without query params
    const exactPathMatch = allItems.find(
      (item) => item.href === pathname && !item.href.includes("?")
    );
    if (exactPathMatch) return exactPathMatch;

    // Fallback to startsWith match
    return (
      allItems.find((item) => item.href === pathname) ||
      allItems.find((item) => item.href !== "/admin" && pathname.startsWith(item.href.split("?")[0]))
    );
  }, [allItems, pathname, searchParams]);

  if (!currentNavItem) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs">
      <span className="text-[#929BAD] font-medium">{currentNavItem.section}</span>
      <ChevronRight className="w-3 h-3 text-[#626B7B]" />
      <span className="font-semibold text-[#E5E7EB]">{currentNavItem.label}</span>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, logoutAdmin, setAdminAuth } = useAdminAuthStore();
  const { theme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Command Palette State (Ctrl + K)
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // If on admin login page, bypass layout shell
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapsed = localStorage.getItem("admin_sidebar_collapsed");
      if (savedCollapsed === "1") {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  // Global Ctrl + K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape" && commandOpen) {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen]);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function verifyAuth() {
      const token = typeof window !== "undefined" ? localStorage.getItem("aether_admin_token") : null;
      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const res = await adminApi.getMe();
        if (!["admin", "super_admin", "staff"].includes(res.user.role)) {
          logoutAdmin();
          router.push("/admin/login?error=forbidden");
          return;
        }
        setAdminAuth(res.user, token);
        setLoading(false);
      } catch (err) {
        logoutAdmin();
        router.push("/admin/login?error=session_expired");
      }
    }

    verifyAuth();
  }, [pathname, isLoginPage]);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_sidebar_collapsed", nextState ? "1" : "0");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Loading Administration Session...
        </span>
      </div>
    );
  }

  const hasItemAccess = (permission?: string) => {
    if (!permission) return true;
    if (adminUser?.role === "super_admin") return true;
    return Boolean(adminUser?.permissions?.includes(permission));
  };

  interface NavGroupItem {
    kind: "group";
    label: string;
    icon: any;
    badge?: string | number;
    items: NavChildItem[];
  }

  interface NavSingleItem {
    kind: "single";
    label: string;
    href: string;
    icon: any;
    permission?: string;
    badge?: string | number;
  }

  type NavItem = NavGroupItem | NavSingleItem;

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: "Core Store",
      items: [
        {
          kind: "single",
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
        },
        {
          kind: "group",
          label: "Products",
          icon: Boxes,
          items: [
            { label: "Products", href: "/admin/products", icon: Boxes, permission: "products.view" },
            { label: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories.view" },
            { label: "Brands", href: "/admin/brands", icon: Building2, permission: "products.view" },
            { label: "Colors", href: "/admin/products/colors", icon: Palette, permission: "products.view" },
            { label: "Stock & Inventory", href: "/admin/inventory", icon: Layers, permission: "products.view" },
            { label: "Reviews", href: "/admin/reviews", icon: Star, permission: "reviews.view" },
          ],
        },
        {
          kind: "group",
          label: "Orders",
          icon: ShoppingBag,
          items: [
            { label: "Orders", href: "/admin/orders", icon: ShoppingBag, permission: "orders.view" },
            { label: "Order Status", href: "/admin/orders/statuses", icon: SlidersHorizontal, permission: "settings.manage" },
            { label: "Shipping", href: "/admin/orders/shipping", icon: Truck, permission: "settings.manage" },
            { label: "Returns & RTO", href: "/admin/orders/returns", icon: RotateCcw, permission: "orders.view" },
            { label: "Leads", href: "/admin/orders/abandoned-checkouts", icon: Magnet, permission: "leads.view" },
            { label: "Sales Invoices", href: "/admin/orders/sales-invoices", icon: BadgeDollarSign, permission: "orders.view" },
          ],
        },
        {
          kind: "group",
          label: "Customers",
          icon: Users,
          items: [
            { label: "Customers", href: "/admin/customers", icon: Users, permission: "customers.view" },
            { label: "Staff & Roles", href: "/admin/customers/staff", icon: UserCog, permission: "staff.view" },
            { label: "Risk & Security", href: "/admin/customers/risk-security", icon: ShieldAlert, permission: "security.ip_block" },
          ],
        },
        {
          kind: "group",
          label: "Content / CMS",
          icon: Layers,
          items: [
            { label: "Homepage", href: "/admin/content/homepage", icon: Layers, permission: "theme.manage" },
            { label: "Banners & Ads", href: "/admin/content/banners", icon: Sparkles, permission: "theme.manage" },
            { label: "Pages", href: "/admin/content/pages", icon: FileText, permission: "theme.manage" },
            { label: "Navigation", href: "/admin/content/navigation", icon: ListTree, permission: "theme.manage" },
            { label: "Footer", href: "/admin/content/footer", icon: Layers, permission: "theme.manage" },
            { label: "Social Media", href: "/admin/content/social", icon: ExternalLink, permission: "theme.manage" },
            { label: "Blog", href: "/admin/content/blog", icon: BookOpen, permission: "theme.manage" },
            { label: "Theme & Storefront", href: "/admin/content/theme", icon: Palette, permission: "theme.manage" },
            { label: "Branding", href: "/admin/content/branding", icon: Store, permission: "theme.manage" },
          ],
        },
        {
          kind: "group",
          label: "Marketing",
          icon: Megaphone,
          items: [
            { label: "Campaigns", href: "/admin/marketing/campaigns", icon: Megaphone, permission: "coupons.view" },
            { label: "Coupons", href: "/admin/marketing/coupons", icon: Ticket, permission: "coupons.view" },
            { label: "Customer Rewards", href: "/admin/marketing/rewards", icon: CreditCard, permission: "coupons.view" },
          ],
        },
        {
          kind: "group",
          label: "Integrations",
          icon: Puzzle,
          items: [
            { label: "All Integrations", href: "/admin/integrations", icon: Puzzle, permission: "settings.manage" },
            { label: "Tracking & Pixels", href: "/admin/integrations?category=analytics", icon: BarChart3, permission: "settings.manage" },
            { label: "Fraud Protection", href: "/admin/integrations?category=fraud", icon: ShieldCheck, permission: "settings.manage" },
            { label: "Headless API & CORS", href: "/admin/integrations?category=api", icon: Lock, permission: "settings.manage" },
            { label: "Payment Gateways", href: "/admin/integrations?category=payment", icon: CreditCard, permission: "settings.manage" },
            { label: "Courier Gateways", href: "/admin/integrations?category=courier", icon: Truck, permission: "settings.manage" },
          ],
        },
        {
          kind: "single",
          label: "Reports",
          href: "/admin/reports",
          icon: BarChart3,
          permission: "analytics.view",
        },
        {
          kind: "group",
          label: "Settings",
          icon: Settings,
          items: [
            { label: "General Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
            { label: "SEO Settings", href: "/admin/settings/seo", icon: Search, permission: "settings.manage" },
            { label: "PWA Settings", href: "/admin/settings/pwa", icon: Smartphone, permission: "settings.manage" },
            { label: "Notifications", href: "/admin/settings/notifications", icon: Bell, permission: "settings.manage" },
            { label: "System & Cache", href: "/admin/settings/system", icon: Zap, permission: "settings.manage" },
            { label: "Audit Trail", href: "/admin/audit-logs", icon: ScrollText, permission: "audit_logs.view" },
          ],
        },
      ],
    },
    {
      title: "Operations (Advanced)",
      items: [
        {
          kind: "group",
          label: "Operations",
          icon: Briefcase,
          badge: "Advanced",
          items: [
            { label: "POS Terminal", href: "/admin/pos", icon: Receipt, permission: "orders.create" },
            { label: "Vendors & Suppliers", href: "/admin/vendors", icon: Truck, permission: "procurement.vendors" },
            { label: "Purchase Orders", href: "/admin/purchase-orders", icon: FileSpreadsheet, permission: "procurement.orders" },
            { label: "Goods Receiving (GRN)", href: "/admin/goods-receipts", icon: PackageCheck, permission: "procurement.receive" },
            { label: "Inventory Valuation", href: "/admin/inventory-valuation", icon: Calculator, permission: "procurement.fifo" },
            { label: "Operating Expenses", href: "/admin/expenses", icon: Coins, permission: "expenses.view" },
            { label: "Financial Accounting", href: "/admin/accounting", icon: Landmark, permission: "accounting.view" },
            { label: "Courier Settlements", href: "/admin/accounting/settlements", icon: BadgeDollarSign, permission: "accounting.view" },
          ],
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await adminApi.logout();
    logoutAdmin();
    router.push("/admin/login");
  };

  const companyBrandName = theme?.store_brand_name || "INHALIQ";
  const companyBrandLogo = resolveLogo(theme, "admin_sidebar", "/branding/logo.png") || theme?.store_brand_logo || "/branding/logo.png";

  // Backward-compatibility alias definitions for breadcrumbs & command palette
  const additionalSubPages = [
    // Legacy Content / CMS aliases
    { label: "Homepage", href: "/admin/settings/homepage", icon: Layers, section: "Content / CMS", permission: "theme.manage" },
    { label: "Banners & Ads", href: "/admin/banners", icon: Sparkles, section: "Content / CMS", permission: "theme.manage" },
    { label: "Banners & Ads", href: "/admin/marketing/banners", icon: Sparkles, section: "Content / CMS", permission: "theme.manage" },
    { label: "Banners & Ads", href: "/admin/online-store/banners", icon: Sparkles, section: "Content / CMS", permission: "theme.manage" },
    { label: "Theme & Storefront", href: "/admin/content/theme", icon: Palette, section: "Content / CMS", permission: "theme.manage" },
    { label: "Theme & Styling", href: "/admin/theme", icon: Palette, section: "Content / CMS", permission: "theme.manage" },
    { label: "Theme & Appearance", href: "/admin/settings/appearance", icon: Palette, section: "Content / CMS", permission: "theme.manage" },
    { label: "Branding Studio", href: "/admin/content/branding", icon: Store, section: "Content / CMS", permission: "theme.manage" },
    { label: "Branding & Logos", href: "/admin/settings/branding", icon: Store, section: "Content / CMS", permission: "theme.manage" },
    { label: "Pages", href: "/admin/content/pages", icon: FileText, section: "Content / CMS", permission: "theme.manage" },
    { label: "Navigation", href: "/admin/online-store/navigation", icon: ListTree, section: "Content / CMS", permission: "theme.manage" },
    { label: "Footer", href: "/admin/online-store/footer", icon: Layers, section: "Content / CMS", permission: "theme.manage" },
    { label: "Social Media", href: "/admin/online-store/social", icon: ExternalLink, section: "Content / CMS", permission: "theme.manage" },
    { label: "Blog", href: "/admin/content/blog", icon: BookOpen, section: "Content / CMS", permission: "theme.manage" },
    { label: "Blog Articles", href: "/admin/content/blog?tab=posts", icon: FileText, section: "Content / CMS", permission: "theme.manage" },
    { label: "Blog Categories", href: "/admin/content/blog?tab=categories", icon: FolderTree, section: "Content / CMS", permission: "theme.manage" },
    { label: "Blog Tags", href: "/admin/content/blog?tab=tags", icon: Tag, section: "Content / CMS", permission: "theme.manage" },
    { label: "Blog Comments", href: "/admin/content/blog?tab=comments", icon: Star, section: "Content / CMS", permission: "theme.manage" },

    // Legacy Orders aliases
    { label: "Order Status", href: "/admin/settings/statuses", icon: SlidersHorizontal, section: "Orders", permission: "settings.manage" },
    { label: "Shipping", href: "/admin/settings/shipping", icon: Truck, section: "Orders", permission: "settings.manage" },
    { label: "Leads", href: "/admin/leads", icon: Magnet, section: "Orders", permission: "leads.view" },
    { label: "Sales Invoices", href: "/admin/sales", icon: BadgeDollarSign, section: "Orders", permission: "orders.view" },

    // Legacy Customers aliases
    { label: "Staff & Roles", href: "/admin/staff", icon: UserCog, section: "Customers", permission: "staff.view" },
    { label: "Risk & Security", href: "/admin/blocked-ips", icon: ShieldAlert, section: "Customers", permission: "security.ip_block" },

    // Legacy Marketing aliases
    { label: "Campaigns", href: "/admin/promotions", icon: Megaphone, section: "Marketing", permission: "coupons.view" },
    { label: "Coupons", href: "/admin/coupons", icon: Tag, section: "Marketing", permission: "coupons.view" },
    { label: "Coupons", href: "/admin/promotions/codes", icon: Ticket, section: "Marketing", permission: "coupons.view" },
    { label: "Customer Rewards", href: "/admin/promotions/store-credit", icon: CreditCard, section: "Marketing", permission: "coupons.view" },
    { label: "Promotion Builder", href: "/admin/promotions/new", icon: Percent, section: "Marketing", permission: "coupons.manage" },
    { label: "Promotion Analytics", href: "/admin/promotions/analytics", icon: BarChart3, section: "Marketing", permission: "coupons.view" },

    // Operations / Accounting Subpages
    { label: "General Ledger", href: "/admin/accounting/ledger", icon: BookOpen, section: "Operations", permission: "accounting.view" },
    { label: "Chart of Accounts", href: "/admin/accounting/accounts", icon: ListTree, section: "Operations", permission: "accounting.view" },
    { label: "Customer Dues (A/R)", href: "/admin/accounting/receivables", icon: Users, section: "Operations", permission: "accounting.view" },
    { label: "Supplier Dues (A/P)", href: "/admin/accounting/payables", icon: Truck, section: "Operations", permission: "accounting.view" },
    { label: "Bank & Cash", href: "/admin/accounting/banking", icon: Wallet, section: "Operations", permission: "accounting.view" },
    { label: "Financial Reports", href: "/admin/accounting/reports", icon: FileSpreadsheet, section: "Operations", permission: "accounting.view" },
    { label: "Financial Overview (P&L)", href: "/admin/finance", icon: TrendingUp, section: "Operations", permission: "finance.view" },

    // Settings sub-pages
    { label: "Mail / SMTP Settings", href: "/admin/settings/mail", icon: Mail, section: "Settings", permission: "settings.manage" },
    { label: "Settings Integrations", href: "/admin/settings/integrations", icon: Puzzle, section: "Settings", permission: "settings.manage" },
    { label: "My Profile", href: "/admin/profile", icon: ShieldCheck, section: "Settings" },
  ];

  // Breadcrumb current item detection
  const allNavAndSubItems = [
    ...navSections.flatMap((s) =>
      s.items.flatMap((item) => {
        if (item.kind === "single") {
          return [{ label: item.label, href: item.href, icon: item.icon, section: s.title, permission: item.permission }];
        }
        return item.items.map((sub) => ({ ...sub, section: item.label }));
      })
    ),
    ...additionalSubPages,
  ];

  // Command palette items filter
  const allFlattenedItems = allNavAndSubItems.filter((item) => hasItemAccess(item.permission));
  const filteredCommandItems = allFlattenedItems.filter((item) => 
    item.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
    item.section.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-[#090B10] text-[#E5E7EB] flex overflow-hidden fixed inset-0">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden lg:flex flex-col justify-between bg-[#11141D] border-r border-[#272B35] shrink-0 h-full transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] overflow-hidden z-20 ${
          sidebarCollapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <div className="p-3 flex flex-col h-full overflow-x-hidden overflow-y-auto no-scrollbar">
          
          {/* Admin Brand Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#272B35] mb-3 w-full shrink-0">
            {sidebarCollapsed ? (
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#A78BFA]/20 to-[#A78BFA]/10 border border-[#A78BFA]/40 flex items-center justify-center shadow-xs shrink-0 mx-auto">
                <span className="font-black text-[#A78BFA] text-sm font-mono">
                  {companyBrandName.charAt(0)}
                </span>
              </div>
            ) : companyBrandLogo ? (
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <img
                  src={companyBrandLogo}
                  alt={companyBrandName}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/branding/logo.png")) {
                      target.src = "/branding/logo.png";
                    }
                  }}
                  className="h-6 w-auto max-w-[150px] object-contain object-left"
                  suppressHydrationWarning
                />
                <span className="text-[9px] uppercase tracking-wider text-[#929BAD] font-bold">
                  Admin Console
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#A78BFA]/20 to-[#A78BFA]/10 border border-[#A78BFA]/40 flex items-center justify-center shadow-xs shrink-0">
                  <span className="font-black text-[#A78BFA] text-xs font-mono">
                    {companyBrandName.charAt(0)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-xs text-white tracking-tight block truncate uppercase">
                    {companyBrandName}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#929BAD] block truncate font-bold">
                    Admin Console
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-3 flex-1 w-full overflow-x-hidden">
            {navSections.map((section) => {
              const visibleSectionItems = section.items.filter((item) => {
                if (item.kind === "single") {
                  return hasItemAccess(item.permission);
                }
                return item.items.some((child) => hasItemAccess(child.permission));
              });

              const isOperations = section.title.toLowerCase().includes("operations");

              return (
                <div key={section.title} className={`space-y-1 ${isOperations ? "pt-2.5 mt-2.5 border-t border-[#272B35]" : ""}`}>
                  {/* Category Header */}
                  {!sidebarCollapsed && (
                    <div className="animate-in fade-in duration-150 mb-1">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#929BAD] px-3 block whitespace-nowrap">
                        {section.title}
                      </span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {visibleSectionItems.map((item) => {
                      if (item.kind === "single") {
                        return (
                          <SidebarNavLink
                            key={item.href}
                            label={item.label}
                            href={item.href}
                            icon={item.icon}
                            badge={item.badge}
                            sidebarCollapsed={sidebarCollapsed}
                            pathname={pathname}
                          />
                        );
                      }

                      return (
                        <Suspense key={item.label} fallback={null}>
                          <SidebarNavGroup
                            label={item.label}
                            icon={item.icon}
                            badge={item.badge}
                            items={item.items}
                            sidebarCollapsed={sidebarCollapsed}
                            pathname={pathname}
                            hasItemAccess={hasItemAccess}
                          />
                        </Suspense>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-2.5 border-t border-[#272B35] bg-[#090B10]/40 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity group overflow-hidden"
              title="View Profile"
            >
              <img
                src={adminUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={adminUser?.name || "Admin"}
                className="w-7 h-7 rounded-md object-cover ring-1 ring-[#272B35] group-hover:ring-[#A78BFA] transition-all shrink-0"
              />
              
              <div 
                className={`overflow-hidden transition-opacity duration-200 whitespace-nowrap ${
                  sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100 max-w-[120px]"
                }`}
              >
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-[#B9A3FF] transition-colors">
                  {adminUser?.name}
                </span>
                <span className="text-[9.5px] text-[#929BAD] truncate block capitalize">
                  {adminUser?.role?.replace("_", " ")}
                </span>
              </div>
            </Link>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#929BAD] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 border-b border-[#272B35] bg-[#090B10]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
          
          {/* Left: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-md bg-[#171B26] hover:bg-[#171B26]/80 border border-[#272B35] text-[#929BAD] hover:text-[#E5E7EB] cursor-pointer transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-3.5 h-3.5 text-[#929BAD]" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-1.5 rounded-md bg-[#171B26] border border-[#272B35] text-[#929BAD] hover:text-[#E5E7EB] cursor-pointer"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Dynamic Breadcrumbs */}
            <Suspense fallback={null}>
              <AdminDynamicBreadcrumb allItems={allNavAndSubItems} pathname={pathname} />
            </Suspense>
          </div>

          {/* Center: Command Palette Trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#171B26] hover:bg-[#171B26]/80 border border-[#272B35] text-[#929BAD] hover:text-[#E5E7EB] text-xs transition-colors cursor-pointer w-60 justify-between shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#929BAD]" />
              <span className="text-[11px]">Quick navigation...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-[#090B10] border border-[#272B35] text-[9.5px] font-mono text-[#929BAD]">
              Ctrl+K
            </kbd>
          </button>

          {/* Right: Quick Storefront Link + Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1.5 rounded-md bg-[#171B26] hover:bg-[#171B26]/80 text-[11px] font-semibold text-[#929BAD] hover:text-[#E5E7EB] border border-[#272B35] transition-colors flex items-center gap-1.5"
              title="Open customer storefront in new tab"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </Link>

            <AdminAccountDropdown />
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090B10]">
          <CursorScrollProvider />
          {children}
        </main>
      </div>


      {/* Mobile Left Navigation Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] bg-[#11141D] border-r border-[#272B35] p-0 flex flex-col justify-between"
          showCloseButton={false}
        >
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#272B35]">
            <div className="flex items-center gap-2.5">
              {companyBrandLogo ? (
                <div 
                  className="w-7 h-7 rounded border border-cyan-400/40 bg-white/5 p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
                  suppressHydrationWarning
                >
                  <img
                    src={companyBrandLogo}
                    alt={companyBrandName}
                    className="w-full h-full object-contain rounded"
                    suppressHydrationWarning
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded bg-[#A78BFA]/20 border border-[#A78BFA]/40 flex items-center justify-center shrink-0">
                  <span className="font-black text-[#A78BFA] text-xs font-mono">
                    {companyBrandName.charAt(0)}
                  </span>
                </div>
              )}
              <SheetTitle className="text-xs font-bold text-white uppercase tracking-wider">
                {companyBrandName} Admin
              </SheetTitle>
            </div>
            <button 
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 rounded-md text-[#929BAD] hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3.5 no-scrollbar">
            {navSections.map((section) => {
              const visibleSectionItems = section.items.filter((item) => {
                if (item.kind === "single") {
                  return hasItemAccess(item.permission);
                }
                return item.items.some((child) => hasItemAccess(child.permission));
              });

              if (visibleSectionItems.length === 0) return null;

              const isOperations = section.title.toLowerCase().includes("operations");

              return (
                <div key={section.title} className={`space-y-1 ${isOperations ? "pt-2.5 mt-2.5 border-t border-[#272B35]" : ""}`}>
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#929BAD] px-3 block">
                    {section.title}
                  </span>
                  <div className="space-y-0.5">
                    {visibleSectionItems.map((item) => {
                      if (item.kind === "single") {
                        return (
                          <SidebarNavLink
                            key={item.href}
                            label={item.label}
                            href={item.href}
                            icon={item.icon}
                            badge={item.badge}
                            sidebarCollapsed={false}
                            pathname={pathname}
                            onNavigate={() => setMobileNavOpen(false)}
                          />
                        );
                      }

                      return (
                        <Suspense key={item.label} fallback={null}>
                          <SidebarNavGroup
                            label={item.label}
                            icon={item.icon}
                            badge={item.badge}
                            items={item.items}
                            sidebarCollapsed={false}
                            pathname={pathname}
                            hasItemAccess={hasItemAccess}
                            onNavigate={() => setMobileNavOpen(false)}
                          />
                        </Suspense>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Sign Out */}
          <div className="p-3 border-t border-[#272B35] bg-[#090B10]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Quick Command Palette Modal (Ctrl + K) */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[#11141D] border border-[#272B35] rounded-lg shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#272B35]">
              <Search className="w-4 h-4 text-[#929BAD] shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search admin pages..."
                className="w-full bg-transparent text-xs text-[#E5E7EB] placeholder:text-[#929BAD] focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-[#171B26] border border-[#272B35] text-[10px] text-[#929BAD]">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {/* Contextual Entity Quick Jumps when query entered */}
              {commandQuery.trim().length > 1 && (
                <div className="pb-2 mb-2 border-b border-[#272B35] space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                    Search Live Records
                  </div>
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs hover:bg-[#211B32] hover:text-[#A78BFA] text-[#E5E7EB] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                      <span>Search Orders for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-[#929BAD] uppercase">Orders</span>
                  </Link>
                  <Link
                    href={`/admin/products?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs hover:bg-[#211B32] hover:text-[#A78BFA] text-[#E5E7EB] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Search Products for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-[#929BAD] uppercase">Catalog</span>
                  </Link>
                  <Link
                    href={`/admin/customers?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs hover:bg-[#211B32] hover:text-[#A78BFA] text-[#E5E7EB] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                      <span>Search Customers for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-[#929BAD] uppercase">Customers</span>
                  </Link>
                  <Link
                    href={`/admin/promotions?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs hover:bg-[#211B32] hover:text-[#A78BFA] text-[#E5E7EB] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Search Promotions for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-[#929BAD] uppercase">Promotions</span>
                  </Link>
                </div>
              )}

              {filteredCommandItems.length > 0 ? (
                filteredCommandItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setCommandOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-[#211B32] text-[#E5E7EB] hover:text-[#A78BFA] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />}
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-[#929BAD] uppercase">{item.section}</span>
                    </Link>
                  );
                })
              ) : (
                commandQuery.trim().length <= 1 && (
                  <div className="p-4 text-center text-xs text-[#929BAD]">
                    No matching admin pages found.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
