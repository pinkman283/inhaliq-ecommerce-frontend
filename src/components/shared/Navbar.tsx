"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Search,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Package,
  Radio,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Building2,
  FolderTree,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { BrandLogoImage } from "@/components/shared/BrandLogoImage";
import { CustomerAccountDropdown } from "@/components/shared/CustomerAccountDropdown";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import { api } from "@/lib/api";
import { NavbarItem } from "@/types";

interface NavbarProps {
  onOpenSearch: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
  const router = useRouter();
  const [navItems, setNavItems] = useState<NavbarItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hover & Dropdown State
  const [activeHoverId, setActiveHoverId] = useState<number | null>(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement | null>(null);

  const { openWishlist, items: wishlistItems } = useWishlistStore();
  const { openCart, getItemCount } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useAppTheme();

  const cartCount = getItemCount();
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    // Fetch dynamic header navigation from backend API (Redis cached on proxy)
    api.getHeaderNavigation()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNavItems(data);
        }
      })
      .catch((err) => console.warn("Notice: Dynamic navbar fetch fallback:", err))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (item: NavbarItem) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveHoverId(item.id);
    // Auto-select first subcategory if available
    if (item.subcategories && item.subcategories.length > 0) {
      setActiveSubcategoryId(item.subcategories[0].id);
    } else {
      setActiveSubcategoryId(null);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHoverId(null);
      setActiveSubcategoryId(null);
    }, 200);
  };

  const activeItemData = navItems.find((item) => item.id === activeHoverId);

  return (
    <>
      {/* ===================== NON-STICKY TOP NOTIFICATION BAR ===================== */}
      {mounted && theme.announcement_enabled && (
        <div className="bg-gradient-to-r from-indigo-950 via-[#0a0d18] to-cyan-950 border-b border-white/5 text-[11px] py-1 px-4 text-center text-slate-300 flex items-center justify-between max-w-full">
          <div className="hidden md:flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <Radio className="w-3 h-3 animate-pulse" /> {theme.announcement_badge || "Dispatch: Fast Courier Delivery"}
            </span>
          </div>
          <div className="mx-auto md:mx-0 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </span>
            <span className="text-slate-300 font-medium">{theme.announcement_text}</span>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-slate-400 text-[10px]">
            <Link href="/track" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Package className="w-3 h-3" /> Track Order
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 font-mono">USD ($)</span>
          </div>
        </div>
      )}

      {/* ===================== NON-STICKY TIER 1: BRAND LOGO + CENTER SEARCH + UTILITIES ===================== */}
      <div className="bg-white dark:bg-[#090b14]/95 border-b border-gray-200 dark:border-white/5 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 sm:h-[82px] lg:h-[88px] flex items-center justify-between gap-3 sm:gap-4 lg:gap-8">
          {/* Left: Brand Identity Logo */}
          <Link href="/" suppressHydrationWarning className="h-full flex items-center group select-none shrink-0 py-1 -translate-y-0.5">
            <BrandLogoImage placement="navbar" priority={true} />
          </Link>

          {/* Middle: Big Prominent Search Area */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4 hidden sm:block">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200/80 dark:hover:bg-white/[0.12] border border-gray-200 dark:border-white/20 text-slate-800 dark:text-white text-xs transition-all group cursor-pointer shadow-xs"
              title="Search products, brands, categories... (Cmd+K)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-gray-500 dark:text-slate-300 group-hover:text-[#005826] dark:group-hover:text-cyan-400 transition-colors shrink-0" />
                <span className="text-xs text-gray-600 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white font-medium truncate">
                  Search catalog, categories, authorized brands...
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-gray-600 dark:text-slate-200 bg-white dark:bg-white/10 rounded border border-gray-200 dark:border-white/20">
                  ⌘K
                </kbd>
              </div>
            </button>
          </div>

          {/* Right: Mobile Search + Wishlist + Cart + Account Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="sm:hidden p-2 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs transition-all cursor-pointer"
              title="Search catalog (Cmd+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={openWishlist}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#fb2c5c] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent transition-all cursor-pointer group"
              title="Saved Wishlist"
            >
              <Heart
                className="w-4 h-4 transition-all duration-200"
                style={{
                  color: mounted && wishlistCount > 0 ? "#fb2c5c" : undefined,
                  fill: mounted && wishlistCount > 0 ? "#fb2c5c" : "none",
                }}
              />
              {mounted && wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 font-black text-[10px] rounded-full flex items-center justify-center shadow-md bg-[#fb2c5c] text-white ring-2 ring-white dark:ring-[#090b14] z-10"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-slate-800 dark:text-white bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#005826] dark:hover:border-cyan-400 transition-all shadow-xs group cursor-pointer"
              title="Shopping Cart"
            >
              {mounted && cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 font-black text-[10px] rounded-full flex items-center justify-center shadow-md bg-[#005826] text-white ring-2 ring-white dark:ring-[#090b14] z-10"
                >
                  {cartCount}
                </motion.span>
              )}
              <ShoppingBag className="w-4 h-4 text-[#005826] dark:text-indigo-400 transition-colors" />
              <span className="text-xs font-bold hidden sm:inline">
                Cart
              </span>
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative flex items-center">
              {isAuthenticated && user ? (
                <CustomerAccountDropdown />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white hover:border-[#005826] transition-all cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#005826] dark:text-indigo-400" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ===================== STICKY TIER 2: 100% ADMIN-CONTROLLED DYNAMIC HEADER NAVBAR ===================== */}
      <nav
        ref={navContainerRef}
        onMouseLeave={handleMouseLeave}
        className={`sticky top-0 z-40 transition-all duration-300 border-b theme-sticky-subnav ${
          isScrolled
            ? "bg-white/95 dark:bg-[#070911]/95 backdrop-blur-xl shadow-md dark:shadow-2xl border-gray-200 dark:border-white/10 py-1.5"
            : "bg-white/90 dark:bg-[#090b14]/90 backdrop-blur-md border-gray-200 dark:border-white/5 py-1.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between relative min-h-[36px] flex-nowrap whitespace-nowrap">
            {/* Left: Quick Catalog Hub Button */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                style={{
                  backgroundColor: "var(--theme-btn-primary-bg, var(--theme-primary, #005826))",
                  color: "var(--theme-btn-primary-text, #ffffff)",
                }}
              >
                <Menu className="w-3.5 h-3.5" style={{ color: "var(--theme-btn-primary-text, #ffffff)" }} />
                <span>All Products</span>
              </Link>
            </div>

            {/* Center: Fully Dynamic Admin-Configured Navigation Items */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0 pointer-events-auto">
              {loading && navItems.length === 0 ? (
                /* Sleek Loading Skeleton */
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="h-6 w-20 rounded bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                navItems.map((item, itemIdx, arr) => {
                  const isHovered = activeHoverId === item.id;
                  const hasDropdownContent =
                    (item.mega_menu_type && item.mega_menu_type !== "none") ||
                    (item.subcategories && item.subcategories.length > 0) ||
                    (item.brands && item.brands.length > 0) ||
                    (item.children && item.children.length > 0);

                  const isRightSide = itemIdx >= Math.ceil(arr.length / 2) || itemIdx >= 3;

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={handleMouseLeave}
                      className="relative shrink-0"
                    >
                      <Link
                        href={item.computed_url || item.url || "#"}
                        target={item.open_in_new_tab ? "_blank" : undefined}
                        rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          isHovered
                            ? "text-[#005826] dark:text-cyan-400 bg-emerald-50/80 dark:bg-white/10"
                            : "text-slate-700 dark:text-slate-300 hover:text-[#005826] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>{item.title}</span>

                        {/* Configurable Badge */}
                        {item.badge && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide text-white uppercase shadow-xs"
                            style={{ backgroundColor: item.badge_color || "#EF4444" }}
                          >
                            {item.badge}
                          </span>
                        )}

                        {hasDropdownContent && (
                          <ChevronDown
                            className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                              isHovered ? "rotate-180 text-[#005826] dark:text-cyan-400" : ""
                            }`}
                          />
                        )}
                      </Link>

                      {/* ===================== DYNAMIC MEGA-MENU / DROPDOWN POPOVER ===================== */}
                      <AnimatePresence>
                        {isHovered && hasDropdownContent && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={handleMouseLeave}
                            className={`absolute top-full mt-1 z-50 bg-white dark:bg-[#0e121e] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-[0_14px_45px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-150 text-left max-w-[calc(100vw-32px)] ${
                              item.mega_menu_type === "category_brand_grid"
                                ? "w-[680px] sm:w-[740px]"
                                : item.mega_menu_type === "columns"
                                ? "w-[500px]"
                                : "w-[240px]"
                            } ${isRightSide ? "right-0 origin-top-right" : "left-0 origin-top-left"}`}
                          >
                            {/* CASE 1: Mega Menu with Subcategories + Category Brands Grid */}
                            {item.mega_menu_type === "category_brand_grid" && (
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Left Column: Subcategories */}
                                  <div className="space-y-2 border-r border-gray-100 dark:border-white/[0.08] pr-4">
                                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-white/[0.06]">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <FolderTree className="w-3 h-3 text-cyan-400" />
                                        Subcategories
                                      </span>
                                    </div>

                                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                                      {item.subcategories && item.subcategories.length > 0 ? (
                                        item.subcategories.map((sub) => (
                                          <Link
                                            key={sub.id}
                                            href={sub.url || `/category/${item.category_slug}/${sub.slug}`}
                                            onClick={() => setActiveHoverId(null)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-white hover:bg-cyan-600/10 dark:hover:bg-white/5 transition-colors group"
                                          >
                                            <span className="group-hover:text-cyan-400 transition-colors">{sub.name}</span>
                                            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                          </Link>
                                        ))
                                      ) : item.children && item.children.length > 0 ? (
                                        item.children.map((child) => (
                                          <Link
                                            key={child.id}
                                            href={child.computed_url || child.url || "#"}
                                            onClick={() => setActiveHoverId(null)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-white hover:bg-cyan-600/10 dark:hover:bg-white/5 transition-colors group"
                                          >
                                            <span className="group-hover:text-cyan-400 transition-colors">{child.title}</span>
                                            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                          </Link>
                                        ))
                                      ) : (
                                        <div className="text-[11px] text-slate-500 py-3 text-center">
                                          Browse full catalog collection
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right Column: Authorized Brands Matrix */}
                                  <div className="space-y-2 pl-1">
                                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-white/[0.06]">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3 text-purple-400" />
                                        Featured Brands
                                      </span>
                                      <Link
                                        href="/brands"
                                        onClick={() => setActiveHoverId(null)}
                                        className="text-[10px] text-cyan-400 hover:underline"
                                      >
                                        All Brands →
                                      </Link>
                                    </div>

                                    {item.brands && item.brands.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                        {item.brands.map((brand) => (
                                          <Link
                                            key={brand.id}
                                            href={`/brand/${brand.slug}`}
                                            onClick={() => setActiveHoverId(null)}
                                            className="p-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all flex items-center gap-2.5 group"
                                          >
                                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-purple-400 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                                              {brand.logo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                                              ) : (
                                                brand.name.charAt(0)
                                              )}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-300 truncate">
                                              {brand.name}
                                            </span>
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-8 text-center text-slate-500 text-xs">
                                        <Building2 className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                                        Authorized partner brands
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Bottom Bar */}
                                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] flex items-center justify-between text-xs">
                                  <span className="text-slate-400 text-[11px]">
                                    Discover verified items under {item.title}
                                  </span>
                                  <Link
                                    href={item.computed_url || item.url || "#"}
                                    onClick={() => setActiveHoverId(null)}
                                    className="font-semibold text-[#005826] dark:text-cyan-400 hover:underline flex items-center gap-1"
                                  >
                                    View All {item.title} Products
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* CASE 2: Multi-Column Subcategories */}
                            {item.mega_menu_type === "columns" && (
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  {(item.subcategories || item.children || []).map((sub: any) => (
                                    <Link
                                      key={sub.id}
                                      href={sub.url || sub.computed_url || "#"}
                                      onClick={() => setActiveHoverId(null)}
                                      className="p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-cyan-400 transition-colors"
                                    >
                                      {sub.name || sub.title}
                                    </Link>
                                  ))}
                                </div>
                                <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-right">
                                  <Link
                                    href={item.computed_url || item.url || "#"}
                                    onClick={() => setActiveHoverId(null)}
                                    className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    Browse all {item.title} →
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* CASE 3: Standard Compact Dropdown */}
                            {(item.mega_menu_type === "standard_dropdown" || item.mega_menu_type === "none") && (
                              <div className="p-2 space-y-0.5">
                                {(item.children || item.subcategories || []).map((sub: any) => (
                                  <Link
                                    key={sub.id}
                                    href={sub.url || sub.computed_url || "#"}
                                    onClick={() => setActiveHoverId(null)}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-cyan-400 transition-colors"
                                  >
                                    <span>{sub.title || sub.name}</span>
                                    {sub.badge && (
                                      <span
                                        className="text-[9px] px-1 rounded font-bold text-white uppercase"
                                        style={{ backgroundColor: sub.badge_color || "#EF4444" }}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Hotline / Customer Guarantee Pill */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Storefront Active
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ===================== DYNAMIC MOBILE DRAWER (100% ADMIN-CONTROLLED) ===================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-[#090b14] border-b border-gray-200 dark:border-white/10 px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto text-left shadow-2xl"
          >
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-white/5">
              Navigation Menu
            </div>

            {navItems.map((item) => {
              const isExpanded = mobileExpandedId === item.id;
              const hasChildren =
                (item.subcategories && item.subcategories.length > 0) ||
                (item.brands && item.brands.length > 0) ||
                (item.children && item.children.length > 0);

              return (
                <div key={item.id} className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 overflow-hidden">
                  <div className="w-full flex items-center justify-between p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Link
                      href={item.computed_url || item.url || "#"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold text-white uppercase"
                          style={{ backgroundColor: item.badge_color || "#EF4444" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {hasChildren && (
                      <button
                        onClick={() => setMobileExpandedId(isExpanded ? null : item.id)}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label={`Toggle ${item.title} sub-items`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180 text-cyan-400" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && hasChildren && (
                    <div className="p-2 pt-0 border-t border-gray-200 dark:border-white/5 space-y-2 bg-white/50 dark:bg-white/[0.01]">
                      <Link
                        href={item.computed_url || item.url || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-2.5 py-1.5 rounded-md text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                      >
                        View All {item.title} →
                      </Link>

                      {/* Subcategories */}
                      {item.subcategories && item.subcategories.length > 0 && (
                        <div className="space-y-1 pl-2 border-l border-white/10">
                          <span className="text-[10px] font-mono uppercase text-slate-500 block pt-1">
                            Subcategories:
                          </span>
                          {item.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={sub.url || `/category/${item.category_slug}/${sub.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-400 py-1"
                            >
                              • {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Brands */}
                      {item.brands && item.brands.length > 0 && (
                        <div className="space-y-1 pl-2 border-l border-purple-500/30">
                          <span className="text-[10px] font-mono uppercase text-purple-400 block pt-1">
                            Brands:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            {item.brands.map((brand) => (
                              <Link
                                key={brand.id}
                                href={`/brand/${brand.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-purple-300 p-1.5 rounded bg-white/5 flex items-center gap-1.5"
                              >
                                {brand.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Children */}
                      {item.children && item.children.length > 0 && (
                        <div className="space-y-1 pl-2 border-l border-white/10">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.computed_url || child.url || "#"}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-400 py-1"
                            >
                              • {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-bold"
              >
                Admin Portal
              </Link>
              <Link
                href="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-bold"
              >
                Track Order
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
