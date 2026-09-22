"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { useThemeStore, resolveLogo } from "@/store/useThemeStore";
import { adminApi } from "@/lib/adminApi";
import { SidebarNavGroup, SidebarNavLink, NavChildItem } from "@/components/admin/SidebarNavGroup";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CursorScrollProvider } from "@/components/admin/CursorScrollProvider";
import { AdminAccountDropdown } from "@/components/admin/AdminAccountDropdown";


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
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
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
      title: "Overview",
      items: [
        { kind: "single", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "Operations",
      items: [
        { kind: "single", label: "POS Terminal", href: "/admin/pos", icon: Receipt, permission: "orders.create" },
        {
          kind: "group",
          label: "Orders & Fulfillment",
          icon: ShoppingBag,
          items: [
            { label: "Orders & Invoices", href: "/admin/orders", icon: ShoppingBag, permission: "orders.view" },
            { label: "Returns & RTO", href: "/admin/orders/returns", icon: RotateCcw, permission: "orders.view" },
            { label: "Customers Directory", href: "/admin/customers", icon: Users, permission: "customers.view" },
            { label: "Leads & Abandoned", href: "/admin/leads", icon: Magnet, permission: "leads.view" },
            { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star, permission: "reviews.view" },
          ],
        },
        {
          kind: "group",
          label: "Catalog & Inventory",
          icon: Boxes,
          items: [
            { label: "Products", href: "/admin/products", icon: Boxes, permission: "products.view" },
            { label: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories.view" },
            { label: "Brands", href: "/admin/brands", icon: Building2, permission: "products.view" },
            { label: "Color Swatches", href: "/admin/products/colors", icon: Palette, permission: "products.view" },
            { label: "Inventory & Stock", href: "/admin/inventory", icon: Layers, permission: "products.view" },
            { label: "FIFO Cost Ledger", href: "/admin/inventory-valuation", icon: Calculator, permission: "procurement.fifo" },
          ],
        },
        {
          kind: "group",
          label: "Purchasing",
          icon: Truck,
          items: [
            { label: "Vendors", href: "/admin/vendors", icon: Truck, permission: "procurement.vendors" },
            { label: "Purchase Orders", href: "/admin/purchase-orders", icon: FileText, permission: "procurement.orders" },
            { label: "Goods Receiving", href: "/admin/goods-receipts", icon: PackageCheck, permission: "procurement.receive" },
          ],
        },
        {
          kind: "group",
          label: "Promotions & Marketing",
          icon: Percent,
          items: [
            { label: "All Promotions", href: "/admin/promotions", icon: Percent, permission: "coupons.view" },
            { label: "Discount Codes", href: "/admin/promotions/codes", icon: Ticket, permission: "coupons.view" },
            { label: "Claimable Coupons", href: "/admin/promotions/claimable", icon: Gift, permission: "coupons.view" },
            { label: "Automatic Discounts", href: "/admin/promotions/automatic", icon: Zap, permission: "coupons.view" },
            { label: "Customer Rewards", href: "/admin/promotions/rewards", icon: Award, permission: "coupons.view" },
            { label: "Store Credit", href: "/admin/promotions/store-credit", icon: CreditCard, permission: "coupons.view" },
            { label: "Promotional Banners", href: "/admin/marketing/banners", icon: Sparkles, permission: "theme.manage" },
            { label: "Redemptions Log", href: "/admin/promotions/redemptions", icon: History, permission: "coupons.view" },
            { label: "Marketing Analytics", href: "/admin/promotions/analytics", icon: BarChart3, permission: "analytics.view" },
          ],
        },
        {
          kind: "group",
          label: "Financials & Accounting",
          icon: Landmark,
          items: [
            { label: "Financial Overview (P&L)", href: "/admin/finance", icon: TrendingUp, permission: "finance.view" },
            { label: "Operating Expenses", href: "/admin/expenses", icon: Coins, permission: "expenses.view" },
            { label: "Courier Settlements", href: "/admin/accounting/settlements", icon: BadgeDollarSign, permission: "accounting.view" },
            { label: "Customer Dues (A/R)", href: "/admin/accounting/receivables", icon: Users, permission: "accounting.view" },
            { label: "Supplier Dues (A/P)", href: "/admin/accounting/payables", icon: Truck, permission: "accounting.view" },
            { label: "Bank & Cash", href: "/admin/accounting/banking", icon: Wallet, permission: "accounting.view" },
            { label: "Financial Report Center", href: "/admin/reports", icon: BarChart3, permission: "analytics.view" },
            { label: "Advanced Accounting (GL/COA)", href: "/admin/accounting", icon: Landmark, permission: "accounting.view" },
          ],
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          kind: "group",
          label: "Store Settings",
          icon: Settings,
          items: [
            { label: "Settings Hub", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
            { label: "Theme & UI", href: "/admin/settings/appearance", icon: Palette, permission: "theme.manage" },
            { label: "Branding & Logo", href: "/admin/settings/branding", icon: Store, permission: "theme.manage" },
            { label: "Storefront Layout", href: "/admin/settings/storefront", icon: LayoutDashboard, permission: "theme.manage" },
            { label: "Homepage Sections", href: "/admin/settings/homepage", icon: Layers, permission: "theme.manage" },
            { label: "CMS Static Pages", href: "/admin/online-store/pages", icon: FileText, permission: "theme.manage" },
            { label: "Blog & Editorial", href: "/admin/blog", icon: BookOpen },
            { label: "Header Navigation", href: "/admin/online-store/navigation", icon: ListTree, permission: "theme.manage" },
            { label: "Navigation & Footer", href: "/admin/online-store/footer", icon: Layers, permission: "theme.manage" },
            { label: "Social Links", href: "/admin/online-store/social", icon: ExternalLink, permission: "theme.manage" },
            { label: "Shipping Zones", href: "/admin/settings/shipping", icon: Truck, permission: "settings.manage" },
            { label: "Order Pipeline", href: "/admin/settings/statuses", icon: SlidersHorizontal, permission: "settings.manage" },
            { label: "SEO & Search", href: "/admin/settings/seo", icon: Search, permission: "settings.manage" },
            { label: "Mobile & PWA", href: "/admin/settings/pwa", icon: LayoutDashboard, permission: "settings.manage" },
            { label: "Notification Templates", href: "/admin/settings/notifications", icon: FileText, permission: "settings.manage" },
            { label: "Mail Configuration", href: "/admin/settings/mail", icon: Mail, permission: "settings.manage" },
            { label: "Integrations Hub", href: "/admin/integrations", icon: Puzzle, permission: "settings.manage" },
            { label: "System & Cache", href: "/admin/settings/system", icon: Settings, permission: "settings.manage" },
          ],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          kind: "group",
          label: "System Governance",
          icon: UserCog,
          items: [
            { label: "Staff & RBAC", href: "/admin/staff", icon: UserCog, permission: "staff.view" },
            { label: "Security & Blocked IPs", href: "/admin/blocked-ips", icon: ShieldAlert, permission: "security.ip_block" },
            { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText, permission: "audit_logs.view" },
            { label: "My Profile", href: "/admin/profile", icon: ShieldCheck },
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

  // Additional sub-pages for breadcrumb and command palette indexing
  const additionalSubPages = [
    { label: "Sales & Invoices (Unified into Orders)", href: "/admin/sales", icon: BadgeDollarSign, section: "Orders & Fulfillment", permission: "orders.view" },
    { label: "Legacy Coupons Bridge", href: "/admin/coupons", icon: Tag, section: "Promotions & Marketing", permission: "coupons.view" },
    { label: "Marketing Banners (Alias)", href: "/admin/banners", icon: Sparkles, section: "Promotions & Marketing", permission: "theme.manage" },
    { label: "Theme Studio (Alias)", href: "/admin/theme", icon: Palette, section: "Settings", permission: "theme.manage" },
    { label: "Promotion Builder", href: "/admin/promotions/new", icon: Percent, section: "Promotions & Marketing", permission: "coupons.manage" },
    { label: "General Ledger", href: "/admin/accounting/ledger", icon: BookOpen, section: "Financials & Accounting", permission: "accounting.view" },
    { label: "Chart of Accounts", href: "/admin/accounting/accounts", icon: ListTree, section: "Financials & Accounting", permission: "accounting.view" },
    { label: "Financial Accounting Reports", href: "/admin/accounting/reports", icon: FileSpreadsheet, section: "Financials & Accounting", permission: "accounting.view" },
    { label: "Blog Articles", href: "/admin/blog/posts", icon: FileText, section: "Store Settings" },
    { label: "Blog Categories", href: "/admin/blog/categories", icon: FolderTree, section: "Store Settings" },
    { label: "Blog Tags", href: "/admin/blog/tags", icon: Tag, section: "Store Settings" },
    { label: "Blog Comments", href: "/admin/blog/comments", icon: Star, section: "Store Settings" },
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

  const currentNavItem = allNavAndSubItems.find(
    (item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href))
  );

  // Command palette items filter
  const allFlattenedItems = allNavAndSubItems.filter((item) => hasItemAccess(item.permission));
  const filteredCommandItems = allFlattenedItems.filter((item) => 
    item.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
    item.section.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-[#07090e] text-slate-100 flex overflow-hidden fixed inset-0">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden lg:flex flex-col justify-between bg-[#090b10] border-r border-white/[0.06] shrink-0 h-full transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] overflow-hidden z-20 ${
          sidebarCollapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <div className="p-3 flex flex-col h-full overflow-x-hidden overflow-y-auto no-scrollbar">
          
          {/* Admin Brand Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 mb-3 w-full shrink-0">
            {sidebarCollapsed ? (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-xs shrink-0 mx-auto">
                <span className="font-black text-amber-400 text-sm font-mono">
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
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Admin Console
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-xs shrink-0">
                  <span className="font-black text-amber-400 text-xs font-mono">
                    {companyBrandName.charAt(0)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-xs text-white tracking-tight block truncate uppercase">
                    {companyBrandName}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block truncate font-bold">
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

              if (visibleSectionItems.length === 0) return null;

              return (
                <div key={section.title} className="space-y-1">
                  {/* Category Header */}
                  {!sidebarCollapsed && (
                    <div className="animate-in fade-in duration-150 mb-1">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 px-3 block whitespace-nowrap">
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
                        <SidebarNavGroup
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          badge={item.badge}
                          items={item.items}
                          sidebarCollapsed={sidebarCollapsed}
                          pathname={pathname}
                          hasItemAccess={hasItemAccess}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-2.5 border-t border-white/10 bg-black/20 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity group overflow-hidden"
              title="View Profile"
            >
              <img
                src={adminUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={adminUser?.name || "Admin"}
                className="w-7 h-7 rounded-md object-cover ring-1 ring-white/10 group-hover:ring-amber-400 transition-all shrink-0"
              />
              
              <div 
                className={`overflow-hidden transition-opacity duration-200 whitespace-nowrap ${
                  sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100 max-w-[120px]"
                }`}
              >
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-amber-300 transition-colors">
                  {adminUser?.name}
                </span>
                <span className="text-[9.5px] text-slate-400 truncate block capitalize">
                  {adminUser?.role?.replace("_", " ")}
                </span>
              </div>
            </Link>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
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
        <header className="h-14 shrink-0 border-b border-white/[0.06] bg-[#090b10]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
          
          {/* Left: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white cursor-pointer"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Dynamic Breadcrumbs */}
            {currentNavItem && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">{currentNavItem.section}</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="font-semibold text-slate-200">{currentNavItem.label}</span>
              </div>
            )}
          </div>

          {/* Center: Command Palette Trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer w-60 justify-between shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Quick navigation...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9.5px] font-mono text-slate-300">
              Ctrl+K
            </kbd>
          </button>

          {/* Right: Quick Storefront Link + Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white border border-white/[0.08] transition-colors flex items-center gap-1.5"
              title="Open customer storefront in new tab"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </Link>

            <AdminAccountDropdown />
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090b10]">
          <CursorScrollProvider />
          {children}
        </main>
      </div>


      {/* Mobile Left Navigation Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] bg-[#090b10] border-r border-white/[0.08] p-0 flex flex-col justify-between"
          showCloseButton={false}
        >
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              {companyBrandLogo ? (
                <div 
                  className="w-7 h-7 rounded-full border border-cyan-400/40 bg-white/5 p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
                  suppressHydrationWarning
                >
                  <img
                    src={companyBrandLogo}
                    alt={companyBrandName}
                    className="w-full h-full object-contain rounded-full"
                    suppressHydrationWarning
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <span className="font-black text-amber-400 text-xs font-mono">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
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

              return (
                <div key={section.title} className="space-y-1">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 px-3 block">
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
                        <SidebarNavGroup
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          badge={item.badge}
                          items={item.items}
                          sidebarCollapsed={false}
                          pathname={pathname}
                          hasItemAccess={hasItemAccess}
                          onNavigate={() => setMobileNavOpen(false)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Sign Out */}
          <div className="p-3 border-t border-white/[0.06] bg-[#07090e]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
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
          <div className="relative w-full max-w-lg bg-[#0e121e] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search admin pages..."
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {/* Contextual Entity Quick Jumps when query entered */}
              {commandQuery.trim().length > 1 && (
                <div className="pb-2 mb-2 border-b border-white/10 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Search Live Records
                  </div>
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Search Orders for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Orders</span>
                  </Link>
                  <Link
                    href={`/admin/products?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Search Products for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Catalog</span>
                  </Link>
                  <Link
                    href={`/admin/customers?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Search Customers for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Customers</span>
                  </Link>
                  <Link
                    href={`/admin/promotions?search=${encodeURIComponent(commandQuery.trim())}`}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Search Promotions for <strong className="text-white">"{commandQuery.trim()}"</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Promotions</span>
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
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{item.section}</span>
                    </Link>
                  );
                })
              ) : (
                commandQuery.trim().length <= 1 && (
                  <div className="p-4 text-center text-xs text-slate-500">
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
