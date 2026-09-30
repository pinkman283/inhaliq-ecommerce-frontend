"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Search,
  Loader2,
  Headphones,
  Keyboard,
  Briefcase,
  Watch,
  Flame,
  Trophy,
  Zap,
  Boxes,
  Package,
  ShieldCheck,
  Tag,
  Star,
  ChevronDown,
  SlidersHorizontal,
  ExternalLink,
  GripVertical,
  CheckCircle2,
} from "lucide-react";
import {
  HomepageSection,
  HomepageSectionTab,
  HomepageSectionSourceType,
  HomepageSectionSortBy,
  Category,
  Brand,
  Product,
} from "@/types";
import { adminApi } from "@/lib/adminApi";
import { homepageService } from "@/services/homepageService";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export interface HomepageSectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  section: HomepageSection | null;
}

export const AVAILABLE_ICONS = [
  { id: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { id: "Headphones", label: "Audio / Headphones", Icon: Headphones },
  { id: "Keyboard", label: "Keyboard", Icon: Keyboard },
  { id: "Briefcase", label: "Carry / Bag", Icon: Briefcase },
  { id: "Watch", label: "Wearable / Watch", Icon: Watch },
  { id: "Layers", label: "Layers / Tech", Icon: Layers },
  { id: "Flame", label: "Flame / Hot", Icon: Flame },
  { id: "Trophy", label: "Trophy / Best", Icon: Trophy },
  { id: "Zap", label: "Zap / Lightning", Icon: Zap },
  { id: "Boxes", label: "Boxes / Category", Icon: Boxes },
  { id: "Package", label: "Package", Icon: Package },
  { id: "ShieldCheck", label: "Shield / Security", Icon: ShieldCheck },
  { id: "Tag", label: "Tag / Promo", Icon: Tag },
  { id: "Star", label: "Star / Rating", Icon: Star },
];

export const SORT_OPTIONS: { id: HomepageSectionSortBy; label: string }[] = [
  { id: "featured", label: "Featured First" },
  { id: "newest", label: "New Arrivals (Latest)" },
  { id: "best_selling", label: "Best Sellers" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "rating", label: "Highest Rated" },
];

export function HomepageSectionDrawer({
  isOpen,
  onClose,
  onSuccess,
  section,
}: HomepageSectionDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Lookups
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Core Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("Sparkles");
  const [productLimit, setProductLimit] = useState(14);
  const [displayStyle, setDisplayStyle] = useState<"carousel" | "grid">("carousel");
  const [isActive, setIsActive] = useState(true);

  // Source & Tabs Mode
  const [hasTabs, setHasTabs] = useState(true);
  const [sourceType, setSourceType] = useState<HomepageSectionSourceType>("category");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [brandId, setBrandId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<HomepageSectionSortBy>("featured");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Tabs List State
  const [tabs, setTabs] = useState<HomepageSectionTab[]>([]);

  // View All Configuration
  const [viewAllLabel, setViewAllLabel] = useState("View All");
  const [viewAllType, setViewAllType] = useState<"category" | "brand" | "all_products" | "custom">("category");
  const [viewAllCategoryId, setViewAllCategoryId] = useState<number | undefined>(undefined);
  const [viewAllBrandId, setViewAllBrandId] = useState<number | undefined>(undefined);
  const [viewAllCustomUrl, setViewAllCustomUrl] = useState("");

  // Product Picker Modal for Manual selection
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerTargetTabId, setPickerTargetTabId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCatFilter, setPickerCatFilter] = useState("");

  // Load Lookups on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadData() {
      setLoadingLookups(true);
      try {
        const [catsRes, brandsRes, prodsRes] = await Promise.all([
          adminApi.getCategories().catch(() => []),
          adminApi.getBrands().catch(() => []),
          adminApi.getProducts({ per_page: 150 }).catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setCategories(Array.isArray(catsRes) ? catsRes : ((catsRes as any)?.data || []));
          setBrands(Array.isArray(brandsRes) ? brandsRes : ((brandsRes as any)?.data || []));
          setAllProducts(
            Array.isArray((prodsRes as any)?.data)
              ? (prodsRes as any).data
              : Array.isArray(prodsRes)
              ? prodsRes
              : []
          );
        }
      } catch (err) {
        console.error("Failed to load lookups:", err);
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync Form State from prop
  useEffect(() => {
    if (!isOpen) return;

    if (section) {
      setTitle(section.title || "");
      setSubtitle(section.subtitle || "");
      setBadgeText(section.badge_text || "");
      setBadgeIcon(section.badge_icon || "Sparkles");
      setProductLimit(section.product_limit || section.product_count || 14);
      setDisplayStyle(section.display_style || "carousel");
      setIsActive(section.is_active ?? true);

      setHasTabs(Boolean(section.has_tabs));
      setSourceType(section.source_type || "category");
      setCategoryId(section.category_id || undefined);
      setBrandId(section.brand_id || undefined);
      setSortBy(
        section.sort_by === ("new_arrivals" as any)
          ? "newest"
          : section.sort_by === ("best_sellers" as any)
          ? "best_selling"
          : section.sort_by || "featured"
      );
      setSelectedProductIds(section.product_ids || []);

      if (section.tabs && Array.isArray(section.tabs) && section.tabs.length > 0) {
        setTabs(
          section.tabs.map((t, idx) => ({
            id: t.id || `tab_${idx}_${Date.now()}`,
            name: t.name || `Tab ${idx + 1}`,
            source_type: t.source_type || "category",
            category_id: t.category_id,
            brand_id: t.brand_id,
            sort_by:
              t.sort_by === ("new_arrivals" as any)
                ? "newest"
                : t.sort_by === ("best_sellers" as any)
                ? "best_selling"
                : t.sort_by || "featured",
            product_ids: t.product_ids || [],
            limit: t.limit || 14,
          }))
        );
      } else {
        setTabs([
          { id: "tab_featured", name: "Featured", source_type: "dynamic", sort_by: "featured", limit: 14 },
          { id: "tab_new", name: "New Arrivals", source_type: "dynamic", sort_by: "newest", limit: 14 },
          { id: "tab_bestsellers", name: "Best Sellers", source_type: "dynamic", sort_by: "best_selling", limit: 14 },
        ]);
      }

      setViewAllLabel(section.view_all_label || "View All");
      setViewAllType(section.view_all_type || "category");
      setViewAllCategoryId(section.view_all_category_id || section.category_id || undefined);
      setViewAllBrandId(section.view_all_brand_id || section.brand_id || undefined);
      setViewAllCustomUrl(section.view_all_url || "");
    } else {
      // New Section Defaults
      setTitle("");
      setSubtitle("");
      setBadgeText("");
      setBadgeIcon("Sparkles");
      setProductLimit(14);
      setDisplayStyle("carousel");
      setIsActive(true);

      setHasTabs(true);
      setSourceType("category");
      setCategoryId(undefined);
      setBrandId(undefined);
      setSortBy("featured");
      setSelectedProductIds([]);

      setTabs([
        { id: `tab_featured_${Date.now()}`, name: "Featured", source_type: "dynamic", sort_by: "featured", limit: 14 },
        { id: `tab_new_${Date.now()}`, name: "New Arrivals", source_type: "dynamic", sort_by: "newest", limit: 14 },
        { id: `tab_bestsellers_${Date.now()}`, name: "Best Sellers", source_type: "dynamic", sort_by: "best_selling", limit: 14 },
      ]);

      setViewAllLabel("View All");
      setViewAllType("category");
      setViewAllCategoryId(undefined);
      setViewAllBrandId(undefined);
      setViewAllCustomUrl("");
    }
  }, [isOpen, section]);

  // Tab Manipulation
  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        name: `Tab ${prev.length + 1}`,
        source_type: "dynamic",
        sort_by: "featured",
        limit: 14,
      },
    ]);
  };

  const handleRemoveTab = (index: number) => {
    if (tabs.length <= 1) {
      toast.error("Multi-tab sections must retain at least one tab.");
      return;
    }
    setTabs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTab = (index: number, updates: Partial<HomepageSectionTab>) => {
    setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)));
  };

  // Product Picker logic
  const openProductPicker = (tabId: string | null) => {
    setPickerTargetTabId(tabId);
    setPickerSearch("");
    setPickerCatFilter("");
    setIsProductPickerOpen(true);
  };

  const toggleProductSelection = (productId: number) => {
    if (pickerTargetTabId) {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id === pickerTargetTabId) {
            const current = t.product_ids || [];
            const next = current.includes(productId)
              ? current.filter((id) => id !== productId)
              : [...current, productId];
            return { ...t, product_ids: next };
          }
          return t;
        })
      );
    } else {
      setSelectedProductIds((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    }
  };

  const isProductSelected = (productId: number) => {
    if (pickerTargetTabId) {
      const tab = tabs.find((t) => t.id === pickerTargetTabId);
      return tab?.product_ids?.includes(productId) || false;
    }
    return selectedProductIds.includes(productId);
  };

  const filteredPickerProducts = allProducts.filter((p) => {
    const q = pickerSearch.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchesCat = !pickerCatFilter || p.category_id?.toString() === pickerCatFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate View All URL
  const computeViewAllUrl = () => {
    if (viewAllType === "category") {
      const targetCatId = viewAllCategoryId || categoryId;
      const cat = categories.find((c) => c.id === targetCatId);
      return cat ? `/products?category=${cat.slug}` : "/products";
    }
    if (viewAllType === "brand") {
      const targetBId = viewAllBrandId || brandId;
      const b = brands.find((brand) => brand.id === targetBId);
      return b ? `/products?brand=${b.slug}` : "/products";
    }
    if (viewAllType === "all_products") {
      return "/products";
    }
    return viewAllCustomUrl.trim() || "/products";
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Section title is required.");
      return;
    }

    setSaving(true);
    try {
      const resolvedUrl = computeViewAllUrl();

      const payload: Partial<HomepageSection> = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        badge_text: badgeText.trim() || null,
        badge_icon: badgeIcon || "Sparkles",
        is_active: isActive,
        product_count: productLimit,
        view_all_label: viewAllLabel.trim() || "View All",
        view_all_type: viewAllType,
        view_all_category_id: viewAllType === "category" ? (viewAllCategoryId || categoryId || null) : null,
        view_all_brand_id: viewAllType === "brand" ? (viewAllBrandId || brandId || null) : null,
        view_all_url: resolvedUrl,
        has_tabs: hasTabs,
        tabs: hasTabs ? tabs : [],
        source_type: sourceType,
        category_id: categoryId || null,
        brand_id: brandId || null,
        sort_by: sortBy,
        product_ids: selectedProductIds,
      };

      if (section?.id) {
        await homepageService.updateSection(section.id, payload);
        toast.success(`Showcase section "${title}" updated successfully.`);
      } else {
        await homepageService.createSection(payload);
        toast.success(`Showcase section "${title}" created successfully.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save homepage section.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#0b0e17] border-l border-white/[0.08] shadow-2xl flex flex-col h-full text-slate-100 overflow-hidden animate-in slide-in-from-right duration-200">
          
          {/* Drawer Top Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#080b12] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {section ? "Edit Showcase Section" : "Add Showcase Section"}
                </h2>
                <p className="text-xs text-slate-400">
                  {section
                    ? `Update configuration for "${section.title}"`
                    : "Add a new product carousel or multi-tab showcase to your homepage."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form
            id="homepage-section-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* 1. Core Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>1. Core Information & Badges</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Section Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flagship Audio & Acoustics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Subtitle / Descriptive Tagline</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audiophile-grade studio monitors, active noise-cancelling headphones..."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Badge Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HI-RES LOSSLESS"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Badge Icon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Badge Icon
                  </label>
                  <select
                    value={badgeIcon}
                    onChange={(e) => setBadgeIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon.id} value={icon.id}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Products To Show</span>
                    <span className="text-[10px] text-slate-500">2 to 30 items</span>
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={productLimit}
                    onChange={(e) => setProductLimit(parseInt(e.target.value, 10) || 14)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Display Layout
                  </label>
                  <select
                    value={displayStyle}
                    onChange={(e) => setDisplayStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="carousel">Interactive Carousel Slider</option>
                    <option value="grid">Responsive Grid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Showcase Structure (Tabs vs Single Source) */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>2. Product Source & Filter Structure</span>
                </h3>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setHasTabs(true)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    hasTabs
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Multi-Tab Showcase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasTabs(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !hasTabs
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Single Source</span>
                </button>
              </div>

              {/* MODE A: MULTI-TAB CONFIGURATION */}
              {hasTabs ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">
                      Configured Tabs ({tabs.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTab}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tab</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {tabs.map((tab, idx) => (
                      <div
                        key={tab.id || idx}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-white/[0.08] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="Tab Label (e.g. New Arrivals)"
                              value={tab.name}
                              onChange={(e) => handleUpdateTab(idx, { name: e.target.value })}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTab(idx)}
                            disabled={tabs.length <= 1}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove tab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tab Source & Rules */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                              Source Scope
                            </span>
                            <select
                              value={tab.source_type}
                              onChange={(e) => handleUpdateTab(idx, { source_type: e.target.value as any })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            >
                              <option value="dynamic">Dynamic (Parent Section Category)</option>
                              <option value="category">Specific Category</option>
                              <option value="brand">Specific Brand</option>
                              <option value="manual">Manual Products ({tab.product_ids?.length || 0})</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                              Sorting Rule
                            </span>
                            <select
                              value={tab.sort_by}
                              onChange={(e) => handleUpdateTab(idx, { sort_by: e.target.value as any })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            >
                              {SORT_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* If Category */}
                        {tab.source_type === "category" && (
                          <div className="pt-1">
                            <select
                              value={tab.category_id || ""}
                              onChange={(e) => handleUpdateTab(idx, { category_id: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            >
                              <option value="">Choose category...</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* If Brand */}
                        {tab.source_type === "brand" && (
                          <div className="pt-1">
                            <select
                              value={tab.brand_id || ""}
                              onChange={(e) => handleUpdateTab(idx, { brand_id: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            >
                              <option value="">Choose brand...</option>
                              {brands.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* If Manual */}
                        {tab.source_type === "manual" && (
                          <div className="pt-1 flex items-center justify-between bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                            <span className="text-xs text-slate-300">
                              Selected: <strong className="text-amber-400">{tab.product_ids?.length || 0}</strong> products
                            </span>
                            <button
                              type="button"
                              onClick={() => openProductPicker(tab.id)}
                              className="px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-xs font-semibold cursor-pointer"
                            >
                              Select Products...
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* MODE B: SINGLE SOURCE CONFIGURATION */
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Product Source
                      </label>
                      <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="category">Category Filter</option>
                        <option value="brand">Brand Filter</option>
                        <option value="dynamic">All Store Products (Dynamic)</option>
                        <option value="manual">Handpicked Manual Products</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Sorting Criteria
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Category */}
                  {sourceType === "category" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Target Category <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={categoryId || ""}
                        onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Target Brand */}
                  {sourceType === "brand" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Target Brand <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={brandId || ""}
                        onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="">Select Brand...</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manual Products */}
                  {sourceType === "manual" && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Handpicked Products
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {selectedProductIds.length} products currently selected
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProductPicker(null)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition cursor-pointer"
                      >
                        Choose Products...
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. View All Destination */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>3. &quot;View All&quot; Destination Link</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={viewAllLabel}
                    onChange={(e) => setViewAllLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Destination Type
                  </label>
                  <select
                    value={viewAllType}
                    onChange={(e) => setViewAllType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="category">Link to Category Page</option>
                    <option value="brand">Link to Brand Page</option>
                    <option value="all_products">Link to All Products (/products)</option>
                    <option value="custom">Custom Destination URL</option>
                  </select>
                </div>
              </div>

              {viewAllType === "category" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Target Category
                  </label>
                  <select
                    value={viewAllCategoryId || categoryId || ""}
                    onChange={(e) => setViewAllCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Default (Parent Section Category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {viewAllType === "brand" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Target Brand
                  </label>
                  <select
                    value={viewAllBrandId || brandId || ""}
                    onChange={(e) => setViewAllBrandId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Default (Parent Section Brand)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {viewAllType === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Custom URL Destination
                  </label>
                  <input
                    type="text"
                    placeholder="/products?collection=summer"
                    value={viewAllCustomUrl}
                    onChange={(e) => setViewAllCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              )}
            </div>

            {/* 4. Active Status Toggle */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Showcase Visibility Status
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isActive
                      ? "Section is live and rendered on the storefront homepage."
                      : "Section is disabled and hidden from storefront visitors."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </form>

          {/* Drawer Bottom Action Bar */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#080b12] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="homepage-section-form"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Section...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {section ? "Update Section" : "Save & Publish Section"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Nested Product Picker Modal (For Manual Product Picking) */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0d1017] border border-white/[0.1] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#080b12]">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Pick Manual Products
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select products to display in this showcase or tab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="p-3.5 border-b border-white/[0.06] flex items-center gap-2 bg-slate-950/40">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={pickerCatFilter}
                onChange={(e) => setPickerCatFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-amber-400 max-w-[150px]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-white/[0.04]">
              {filteredPickerProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No products matched your search.
                </div>
              ) : (
                filteredPickerProducts.map((p) => {
                  const selected = isProductSelected(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-colors ${
                        selected ? "bg-amber-400/10 text-white" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selected
                              ? "bg-amber-400 border-amber-400 text-slate-950"
                              : "border-slate-600 bg-slate-900"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{p.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku || "N/A"} · {formatPrice(p.price)}
                          </span>
                        </div>
                      </div>

                      {selected && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom */}
            <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between bg-[#080b12]">
              <span className="text-xs text-slate-400">
                {pickerTargetTabId
                  ? `${tabs.find((t) => t.id === pickerTargetTabId)?.product_ids?.length || 0} products selected for tab`
                  : `${selectedProductIds.length} products selected`}
              </span>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
