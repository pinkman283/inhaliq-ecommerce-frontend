"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  X, 
  Check, 
  Sparkles, 
  Star, 
  ArrowUpDown,
  RotateCcw,
  Tag,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";
import { Brand, Category, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils";
import { useAppTheme } from "@/components/providers/ThemeProvider";

function ProductCatalogContent({
  overrideCategory,
  overrideBrand,
}: {
  overrideCategory?: string;
  overrideBrand?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useAppTheme();

  const rawCatParam = overrideCategory || searchParams.get("categories") || searchParams.get("category") || "";
  const initialCategories = rawCatParam ? rawCatParam.split(",").map((c) => c.trim()).filter(Boolean) : [];
  
  const rawBrandParam = overrideBrand || searchParams.get("brands") || searchParams.get("brand") || "";
  const initialBrands = rawBrandParam ? rawBrandParam.split(",").map((b) => b.trim()).filter(Boolean) : [];

  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "popular";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const isDiscountedQuery = searchParams.get("discounted") === "true" || searchParams.get("discounted") === "1" || searchParams.get("on_sale") === "true" || searchParams.get("deals") === "true";

  // Filters State (Multiple Categories & Brands Supported)
  const [search, setSearch] = useState(currentSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  const [sort, setSort] = useState(currentSort);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [discountedOnly, setDiscountedOnly] = useState(isDiscountedQuery);
  const [inStockOnly, setInStockOnly] = useState(false);
  
  // Left Slide-Out Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Expand/Collapse state for hierarchical categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catData, brandData] = await Promise.all([
          api.getCategories().catch(() => []),
          api.getBrands().catch(() => [])
        ]);
        setCategories(catData || []);
        setBrands(brandData || []);
      } catch (err) {
        console.warn("Notice: Filter metadata fetch fallback:", err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    const rawCat = searchParams.get("categories") || searchParams.get("category") || "";
    setSelectedCategories(rawCat ? rawCat.split(",").map((c) => c.trim()).filter(Boolean) : []);
    
    const rawBrd = searchParams.get("brands") || searchParams.get("brand") || "";
    setSelectedBrands(rawBrd ? rawBrd.split(",").map((b) => b.trim()).filter(Boolean) : []);

    setSearch(searchParams.get("search") || "");

    const isDisc = searchParams.get("discounted") === "true" || searchParams.get("discounted") === "1" || searchParams.get("on_sale") === "true" || searchParams.get("deals") === "true";
    setDiscountedOnly(isDisc);
  }, [searchParams]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedBrands, search, sort, minPrice, maxPrice, minRating, discountedOnly, inStockOnly]);

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const params: any = {
          sort,
          per_page: perPage,
          page: currentPage,
        };
        if (selectedCategories.length > 0) {
          params.categories = selectedCategories.join(",");
        }
        if (selectedBrands.length > 0) {
          params.brands = selectedBrands.join(",");
        }
        if (search.trim()) params.search = search;
        if (minPrice !== "") params.min_price = Number(minPrice);
        if (maxPrice !== "") params.max_price = Number(maxPrice);
        if (minRating !== "" && theme.reviews_enabled !== false) params.min_rating = Number(minRating);
        if (discountedOnly) params.discounted = true;
        if (inStockOnly) params.in_stock = true;

        const res = await api.getProducts(params);
        setProducts(res.data || []);
        if (res.current_page) setCurrentPage(res.current_page);
        if (res.last_page) setLastPage(res.last_page);
        if (res.total !== undefined) setTotalCount(res.total);
      } catch (err) {
        console.warn("Notice: Products catalog fetch fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [selectedCategories, selectedBrands, search, sort, minPrice, maxPrice, minRating, discountedOnly, inStockOnly, currentPage, perPage, theme.reviews_enabled]);

  const handleCategoryToggle = (slug: string) => {
    let next: string[];
    if (slug === "") {
      next = [];
    } else {
      if (selectedCategories.includes(slug)) {
        next = selectedCategories.filter((c) => c !== slug);
      } else {
        next = [...selectedCategories, slug];
      }
    }
    setSelectedCategories(next);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("category");
    newParams.delete("categories");
    if (next.length > 0) {
      newParams.set("categories", next.join(","));
    }
    const queryStr = newParams.toString();
    router.push(queryStr ? `/products?${queryStr}` : "/products");
  };

  const handleBrandToggle = (slugOrName: string) => {
    let next: string[];
    if (slugOrName === "") {
      next = [];
    } else {
      if (selectedBrands.includes(slugOrName)) {
        next = selectedBrands.filter((b) => b !== slugOrName);
      } else {
        next = [...selectedBrands, slugOrName];
      }
    }
    setSelectedBrands(next);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("brand");
    newParams.delete("brands");
    if (next.length > 0) {
      newParams.set("brands", next.join(","));
    }
    const queryStr = newParams.toString();
    router.push(queryStr ? `/products?${queryStr}` : "/products");
  };

  const syncSearchToUrl = (val: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      newParams.set("search", val.trim());
    } else {
      newParams.delete("search");
    }
    const queryStr = newParams.toString();
    router.push(queryStr ? `/products?${queryStr}` : "/products");
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setDiscountedOnly(false);
    setInStockOnly(false);
    router.push("/products");
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (search ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0) +
    (minRating !== "" && theme.reviews_enabled !== false ? 1 : 0) +
    (discountedOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const findCategoryBySlug = (list: Category[], targetSlug: string): Category | null => {
    for (const c of list) {
      if (c.slug === targetSlug) return c;
      if (c.children && c.children.length > 0) {
        const found = findCategoryBySlug(c.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find all ancestor category slugs of a selected category
  const findCategoryAncestors = (list: Category[], targetSlug: string, path: string[] = []): string[] => {
    for (const c of list) {
      if (c.slug === targetSlug) {
        return path;
      }
      if (c.children && c.children.length > 0) {
        const found = findCategoryAncestors(c.children, targetSlug, [...path, c.slug]);
        if (found.length > 0 || c.children.some((child) => child.slug === targetSlug)) {
          return found.length > 0 ? found : [...path, c.slug];
        }
      }
    }
    return [];
  };

  // Auto-expand parent branches of selected categories
  useEffect(() => {
    if (selectedCategories.length > 0 && categories.length > 0) {
      const ancestorsToExpand = new Set<string>(expandedCategories);
      selectedCategories.forEach((slug) => {
        const ancestors = findCategoryAncestors(categories, slug);
        ancestors.forEach((a) => ancestorsToExpand.add(a));
      });
      setExpandedCategories(Array.from(ancestorsToExpand));
    }
  }, [selectedCategories, categories]);

  const toggleCategoryExpand = (slug: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const expandAllCategories = () => {
    const allParentSlugs: string[] = [];
    const collectParents = (list: Category[]) => {
      list.forEach((c) => {
        if (c.children && c.children.length > 0) {
          allParentSlugs.push(c.slug);
          collectParents(c.children);
        }
      });
    };
    collectParents(categories);
    setExpandedCategories(allParentSlugs);
  };

  const collapseAllCategories = () => {
    setExpandedCategories([]);
  };

  const selectedCategoryObj = selectedCategories.length === 1 ? findCategoryBySlug(categories, selectedCategories[0]) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 space-y-2">
        <span 
          className="text-xs font-black uppercase tracking-widest block"
          style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))" }}
        >
          {theme.store_brand_name || "INHALIQ"} Hardware Archive
        </span>
        <h1 
          className="text-2xl sm:text-4xl font-black tracking-tight"
          style={{ color: "var(--theme-text-heading, #0f172a)" }}
        >
          {selectedCategoryObj
            ? selectedCategoryObj.name
            : selectedCategories.length > 1
            ? `${selectedCategories.length} Categories Selected`
            : selectedBrands.length === 1
            ? `${brands.find((b) => b.slug === selectedBrands[0] || b.name === selectedBrands[0])?.name || selectedBrands[0]} Gear`
            : selectedBrands.length > 1
            ? `${selectedBrands.length} Brands Selected`
            : "Complete Hardware Lineup"}
        </h1>
        <p 
          className="text-xs sm:text-sm max-w-2xl leading-relaxed"
          style={{ color: "var(--theme-text-body, #64748b)" }}
        >
          Audiophile acoustic planar headphones, CNC anodized aluminum keyboards, weatherproof modular bags, and smart workstation accessories.
        </p>
      </div>

      {/* Top Search & Filter Bar */}
      <div 
        className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border mb-6 sm:mb-8 shadow-2xs"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e5e7eb)"
        }}
      >
        {/* Left: Filter Drawer Trigger Button + Search Input */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-1 max-w-xl">
          {/* Primary Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs hover:border-[#005826] select-none shrink-0"
            style={{
              backgroundColor: hasActiveFilters 
                ? "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))" 
                : "var(--theme-card-bg, #ffffff)",
              borderColor: hasActiveFilters
                ? "var(--theme-primary, #005826)"
                : "var(--theme-card-border, #e5e7eb)",
              color: hasActiveFilters
                ? "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))"
                : "var(--theme-text-heading, #0f172a)"
            }}
          >
            <Filter 
              className="w-4 h-4" 
              style={{ color: "var(--theme-primary, #005826)" }}
            />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span 
                className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-xs"
                style={{ backgroundColor: "var(--theme-primary, #005826)" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search 
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" 
              style={{ color: "var(--theme-text-body, #94a3b8)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  syncSearchToUrl(search);
                }
              }}
              placeholder="Search keywords or specs..."
              className="w-full rounded-xl pl-9.5 pr-8 py-2 text-xs border transition-colors focus:outline-none"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e5e7eb)",
                color: "var(--theme-text-heading, #0f172a)"
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  syncSearchToUrl("");
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right controls: Sort Dropdown + Reset Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown 
              className="w-3.5 h-3.5 hidden sm:inline" 
              style={{ color: "var(--theme-text-body, #94a3b8)" }}
            />
            <span 
              className="text-xs hidden sm:inline"
              style={{ color: "var(--theme-text-body, #64748b)" }}
            >
              Sort:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e5e7eb)",
                color: "var(--theme-text-heading, #0f172a)"
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest Releases</option>
              {theme.reviews_enabled !== false && <option value="rating">Top Rated</option>}
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border-rose-200 dark:border-rose-900/30"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span 
            className="text-[11px] font-bold"
            style={{ color: "var(--theme-text-body, #64748b)" }}
          >
            Active Filters:
          </span>

          {/* Multiple Category Badges */}
          {selectedCategories.map((slug) => {
            const catName = findCategoryBySlug(categories, slug)?.name || slug;
            return (
              <span 
                key={`cat-${slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                  color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                  borderColor: "var(--theme-card-border, #e5e7eb)"
                }}
              >
                Category: {catName}
                <button 
                  onClick={() => handleCategoryToggle(slug)} 
                  className="cursor-pointer hover:opacity-75"
                >
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            );
          })}

          {/* Multiple Brand Badges */}
          {selectedBrands.map((slugOrName) => {
            const brd = brands.find((b) => b.slug === slugOrName || b.name === slugOrName);
            const brandName = brd?.name || slugOrName;
            return (
              <span 
                key={`brand-${slugOrName}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                  color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                  borderColor: "var(--theme-card-border, #e5e7eb)"
                }}
              >
                Brand: {brandName}
                <button 
                  onClick={() => handleBrandToggle(slugOrName)} 
                  className="cursor-pointer hover:opacity-75"
                >
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            );
          })}

          {search && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              Search: &ldquo;{search}&rdquo;
              <button 
                type="button"
                onClick={() => {
                  setSearch("");
                  syncSearchToUrl("");
                }} 
                aria-label="Remove search filter"
                className="cursor-pointer hover:opacity-75"
              >
                <X className="w-3 h-3 ml-0.5" />
              </button>
            </span>
          )}
          {minPrice !== "" && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              Min: ${minPrice}
              <button onClick={() => setMinPrice("")} className="cursor-pointer hover:opacity-75"><X className="w-3 h-3 ml-0.5" /></button>
            </span>
          )}
          {maxPrice !== "" && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              Max: ${maxPrice}
              <button onClick={() => setMaxPrice("")} className="cursor-pointer hover:opacity-75"><X className="w-3 h-3 ml-0.5" /></button>
            </span>
          )}
          {discountedOnly && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              Discounted Items
              <button onClick={() => setDiscountedOnly(false)} className="cursor-pointer hover:opacity-75"><X className="w-3 h-3 ml-0.5" /></button>
            </span>
          )}
          {inStockOnly && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              In Stock Only
              <button onClick={() => setInStockOnly(false)} className="cursor-pointer hover:opacity-75"><X className="w-3 h-3 ml-0.5" /></button>
            </span>
          )}
        </div>
      )}

      {/* Results Summary Bar */}
      {!loading && products.length > 0 && (
        <div 
          className="flex items-center justify-between pb-4 mb-2 text-xs"
          style={{ color: "var(--theme-text-body, #64748b)" }}
        >
          <span>
            Showing <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>{products.length}</strong> of <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>{totalCount || products.length}</strong> hardware models
          </span>
          {lastPage > 1 && (
            <span className="text-[11px] font-mono">
              Page {currentPage} of {lastPage}
            </span>
          )}
        </div>
      )}

      {/* Main Full-Width Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i} 
              className="rounded-2xl border p-2.5 sm:p-3 space-y-3 animate-pulse shadow-2xs"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              <div className="w-full aspect-square rounded-xl bg-gray-100 dark:bg-white/5" />
              <div className="h-3.5 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
              <div className="h-7 bg-gray-100 dark:bg-white/5 rounded-xl mt-3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div 
          className="p-12 rounded-3xl border text-center space-y-4 shadow-2xs"
          style={{
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            borderColor: "var(--theme-card-border, #e5e7eb)"
          }}
        >
          <div 
            className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto"
            style={{
              backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
              borderColor: "var(--theme-card-border, #e5e7eb)"
            }}
          >
            <Search 
              className="w-8 h-8" 
              style={{ color: "var(--theme-primary, #005826)" }}
            />
          </div>
          <h3 
            className="text-lg font-bold"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            No products match your filters
          </h3>
          <p 
            className="text-xs max-w-sm mx-auto leading-relaxed"
            style={{ color: "var(--theme-text-body, #64748b)" }}
          >
            Try widening your price range or clearing selected categories or brands to see all available hardware.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs theme-btn-primary hover:opacity-90"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div 
              className="flex items-center justify-center gap-2 pt-6 border-t"
              style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
            >
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                style={{
                  backgroundColor: "var(--theme-card-bg, #ffffff)",
                  borderColor: "var(--theme-card-border, #e5e7eb)",
                  color: "var(--theme-text-heading, #0f172a)"
                }}
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: lastPage }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive ? "shadow-sm scale-105" : "hover:opacity-80"
                      }`}
                      style={isActive ? {
                        backgroundColor: "var(--theme-tab-active-bg, var(--theme-primary, #005826))",
                        color: "var(--theme-tab-active-text, #ffffff)",
                        borderColor: "var(--theme-tab-active-bg, var(--theme-primary, #005826))"
                      } : {
                        backgroundColor: "var(--theme-card-bg, #ffffff)",
                        borderColor: "var(--theme-card-border, #e5e7eb)",
                        color: "var(--theme-text-heading, #0f172a)"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage >= lastPage}
                onClick={() => {
                  setCurrentPage((p) => Math.min(lastPage, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                style={{
                  backgroundColor: "var(--theme-card-bg, #ffffff)",
                  borderColor: "var(--theme-card-border, #e5e7eb)",
                  color: "var(--theme-text-heading, #0f172a)"
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modern Left Slide-Out Filter Drawer (Desktop & Mobile) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Left Drawer Sheet */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="relative w-full max-w-sm sm:max-w-md h-full flex flex-col z-10 shadow-2xl border-r"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              {/* 1. Drawer Header */}
              <div 
                className="p-4 sm:p-5 border-b flex items-center justify-between shrink-0"
                style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs"
                    style={{
                      backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                      borderColor: "var(--theme-card-border, #e5e7eb)"
                    }}
                  >
                    <Filter className="w-4.5 h-4.5" style={{ color: "var(--theme-primary, #005826)" }} />
                  </div>
                  <div>
                    <h2 
                      className="text-sm sm:text-base font-black uppercase tracking-wider"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Filter Hardware
                    </h2>
                    <p className="text-[11px]" style={{ color: "var(--theme-text-body, #64748b)" }}>
                      Refine specs, categories & brands
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-2 rounded-xl border text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
                    aria-label="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                
                {/* 1. Categories Multi-Select Section with Interactive Dropdowns */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[11px] font-black uppercase tracking-wider"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    </span>
                    <div className="flex items-center gap-2">
                      {categories.some((c) => c.children && c.children.length > 0) && (
                        <button
                          type="button"
                          onClick={expandedCategories.length > 0 ? collapseAllCategories : expandAllCategories}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {expandedCategories.length > 0 ? "Collapse All" : "Expand All"}
                        </button>
                      )}
                      {selectedCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle("")}
                          className="text-[10px] font-bold hover:underline cursor-pointer"
                          style={{ color: "var(--theme-primary, #005826)" }}
                        >
                          Select All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {/* All Hardware Option */}
                    <button
                      type="button"
                      onClick={() => handleCategoryToggle("")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategories.length === 0
                          ? "border shadow-2xs font-bold"
                          : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                      }`}
                      style={selectedCategories.length === 0 ? {
                        backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                        color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                        borderColor: "var(--theme-card-border, #e5e7eb)"
                      } : {
                        color: "var(--theme-text-heading, #0f172a)"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            selectedCategories.length === 0 ? "border-transparent shadow-xs" : "border-gray-300 dark:border-white/20 bg-transparent"
                          }`}
                          style={selectedCategories.length === 0 ? {
                            backgroundColor: "var(--theme-primary, #005826)",
                            color: "#ffffff"
                          } : undefined}
                        >
                          {selectedCategories.length === 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>All Hardware</span>
                      </div>
                      {totalCount > 0 && (
                        <span 
                          className="text-[10px] font-normal shrink-0 ml-2 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5"
                          style={{ color: "var(--theme-text-body, #94a3b8)" }}
                        >
                          {totalCount}
                        </span>
                      )}
                    </button>

                    {/* Hierarchical Categories Tree with Interactive Dropdowns */}
                    {(() => {
                      const renderCategoryNode = (cat: Category, level: number = 0) => {
                        const isSelected = selectedCategories.includes(cat.slug);
                        const hasChildren = Boolean(cat.children && cat.children.length > 0);
                        const isExpanded = expandedCategories.includes(cat.slug);

                        // Count how many descendants are selected
                        const getSelectedDescendantCount = (item: Category): number => {
                          let count = 0;
                          if (item.children) {
                            item.children.forEach((child) => {
                              if (selectedCategories.includes(child.slug)) count++;
                              count += getSelectedDescendantCount(child);
                            });
                          }
                          return count;
                        };
                        const activeChildrenCount = hasChildren ? getSelectedDescendantCount(cat) : 0;

                        return (
                          <div key={cat.id || cat.slug} className="select-none">
                            {/* Category Row */}
                            <div
                              className={`w-full group rounded-xl text-xs font-semibold transition-all flex items-center justify-between p-1.5 cursor-pointer ${
                                isSelected
                                  ? "border shadow-2xs font-bold"
                                  : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                              }`}
                              style={isSelected ? {
                                backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                                color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                                borderColor: "var(--theme-card-border, #e5e7eb)"
                              } : {
                                color: "var(--theme-text-heading, #0f172a)"
                              }}
                              onClick={() => handleCategoryToggle(cat.slug)}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {/* Expand / Collapse Chevron Button */}
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleCategoryExpand(cat.slug, e)}
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                                    title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                                  >
                                    <ChevronRight 
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-90 text-slate-700 dark:text-slate-200" : ""
                                      }`} 
                                    />
                                  </button>
                                ) : (
                                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                  </div>
                                )}

                                {/* Custom Checkbox */}
                                <div 
                                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                                    isSelected ? "border-transparent shadow-xs" : "border-gray-300 dark:border-white/20 bg-transparent group-hover:border-gray-400"
                                  }`}
                                  style={isSelected ? {
                                    backgroundColor: "var(--theme-primary, #005826)",
                                    color: "#ffffff"
                                  } : undefined}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>

                                {/* Category Name */}
                                <span className={`truncate text-xs ${isSelected ? "font-bold" : "font-medium"}`}>
                                  {cat.name}
                                </span>

                                {/* Active descendant badge indicator if collapsed */}
                                {!isExpanded && activeChildrenCount > 0 && (
                                  <span 
                                    className="px-1.5 py-0.2 rounded-full text-[9px] font-black text-white ml-1 shrink-0 shadow-2xs"
                                    style={{ backgroundColor: "var(--theme-primary, #005826)" }}
                                    title={`${activeChildrenCount} subcategories selected`}
                                  >
                                    +{activeChildrenCount}
                                  </span>
                                )}
                              </div>

                              {/* Product Count Badge */}
                              {cat.products_count !== undefined && cat.products_count > 0 && (
                                <span 
                                  className="text-[10px] font-normal shrink-0 ml-2 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5"
                                  style={{ color: "var(--theme-text-body, #94a3b8)" }}
                                >
                                  {cat.products_count}
                                </span>
                              )}
                            </div>

                            {/* Collapsible Children Subcategories */}
                            <AnimatePresence initial={false}>
                              {hasChildren && isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  className="overflow-hidden ml-3.5 pl-2.5 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-0.5"
                                >
                                  {cat.children!.map((child) => renderCategoryNode(child, level + 1))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      };

                      return categories.map((cat) => renderCategoryNode(cat, 0));
                    })()}
                  </div>
                </div>

                {/* 2. Brands Multi-Select Section */}
                {brands.length > 0 && (
                  <div 
                    className="space-y-2.5 pt-4 border-t"
                    style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[11px] font-black uppercase tracking-wider"
                        style={{ color: "var(--theme-text-body, #64748b)" }}
                      >
                        Brands {selectedBrands.length > 0 && `(${selectedBrands.length})`}
                      </span>
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleBrandToggle("")}
                          className="text-[10px] font-bold hover:underline cursor-pointer"
                          style={{ color: "var(--theme-primary, #005826)" }}
                        >
                          Select All
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {/* All Brands Option */}
                      <button
                        type="button"
                        onClick={() => handleBrandToggle("")}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          selectedBrands.length === 0
                            ? "border shadow-2xs font-bold"
                            : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                        }`}
                        style={selectedBrands.length === 0 ? {
                          backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                          color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                          borderColor: "var(--theme-card-border, #e5e7eb)"
                        } : {
                          color: "var(--theme-text-heading, #0f172a)"
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                              selectedBrands.length === 0 ? "border-transparent shadow-xs" : "border-gray-300 dark:border-white/20 bg-transparent"
                            }`}
                            style={selectedBrands.length === 0 ? {
                              backgroundColor: "var(--theme-primary, #005826)",
                              color: "#ffffff"
                            } : undefined}
                          >
                            {selectedBrands.length === 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>All Brands</span>
                        </div>
                      </button>

                      {/* Specific Brands List */}
                      {brands.map((brand) => {
                        const isSelected = selectedBrands.includes(brand.slug) || selectedBrands.includes(brand.name);
                        return (
                          <button
                            type="button"
                            key={brand.id}
                            onClick={() => handleBrandToggle(brand.slug || brand.name)}
                            className={`w-full text-left p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "border shadow-2xs font-bold"
                                : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                            }`}
                            style={isSelected ? {
                              backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                              color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                              borderColor: "var(--theme-card-border, #e5e7eb)"
                            } : {
                              color: "var(--theme-text-heading, #0f172a)"
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div 
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                                  isSelected ? "border-transparent shadow-xs" : "border-gray-300 dark:border-white/20 bg-transparent"
                                }`}
                                style={isSelected ? {
                                  backgroundColor: "var(--theme-primary, #005826)",
                                  color: "#ffffff"
                                } : undefined}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className={`truncate text-xs ${isSelected ? "font-bold" : "font-medium"}`}>
                                {brand.name}
                              </span>
                            </div>
                            {brand.products_count !== undefined && brand.products_count > 0 && (
                              <span 
                                className="text-[10px] font-normal shrink-0 ml-2 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5"
                                style={{ color: "var(--theme-text-body, #94a3b8)" }}
                              >
                                {brand.products_count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Price Range Section */}
                <div 
                  className="space-y-2.5 pt-4 border-t"
                  style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
                >
                  <span 
                    className="text-[11px] font-black uppercase tracking-wider block"
                    style={{ color: "var(--theme-text-body, #64748b)" }}
                  >
                    Price Range ($)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Min Price</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-xl px-3 py-2 text-xs border transition-colors focus:outline-none"
                        style={{
                          backgroundColor: "var(--theme-card-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #e5e7eb)",
                          color: "var(--theme-text-heading, #0f172a)"
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Max Price</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-xl px-3 py-2 text-xs border transition-colors focus:outline-none"
                        style={{
                          backgroundColor: "var(--theme-card-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #e5e7eb)",
                          color: "var(--theme-text-heading, #0f172a)"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Minimum Rating (Shown only when reviews/ratings are enabled) */}
                {theme.reviews_enabled !== false && (
                  <div 
                    className="space-y-2 pt-4 border-t"
                    style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
                  >
                    <span 
                      className="text-[11px] font-black uppercase tracking-wider block"
                      style={{ color: "var(--theme-text-body, #64748b)" }}
                    >
                      Customer Rating
                    </span>
                    <div className="space-y-1">
                      {[
                        { label: "All Ratings", val: "" },
                        { label: "4.5★ & Above", val: 4.5 },
                        { label: "4.0★ & Above", val: 4.0 },
                      ].map((r) => {
                        const isRatingSelected = minRating === r.val;
                        return (
                          <button
                            key={r.label}
                            onClick={() => setMinRating(minRating === r.val ? "" : (r.val as any))}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isRatingSelected
                                ? "border shadow-2xs font-bold"
                                : "hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                            style={isRatingSelected ? {
                              backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.08))",
                              color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))",
                              borderColor: "var(--theme-card-border, #e5e7eb)"
                            } : {
                              color: "var(--theme-text-heading, #0f172a)"
                            }}
                          >
                            <span>{r.label}</span>
                            {isRatingSelected && (
                              <Check 
                                className="w-3.5 h-3.5" 
                                style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #005826)))" }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Switches Section */}
                <div 
                  className="space-y-4 pt-4 border-t"
                  style={{ borderColor: "var(--theme-card-border, #e5e7eb)" }}
                >
                  {/* Discounted Items Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span 
                        className="text-xs font-bold block"
                        style={{ color: "var(--theme-text-heading, #0f172a)" }}
                      >
                        Discounted Items
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--theme-text-body, #64748b)" }}>
                        Show only products with active sale price
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={discountedOnly}
                      onClick={() => setDiscountedOnly(!discountedOnly)}
                      className="w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shadow-2xs shrink-0 ml-3"
                      style={{
                        backgroundColor: discountedOnly
                          ? "var(--theme-primary, #005826)"
                          : "var(--theme-card-border, #cbd5e1)"
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                          discountedOnly ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* In Stock Only Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span 
                        className="text-xs font-bold block"
                        style={{ color: "var(--theme-text-heading, #0f172a)" }}
                      >
                        In Stock Only
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--theme-text-body, #64748b)" }}>
                        Exclude out-of-stock items
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStockOnly}
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className="w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shadow-2xs shrink-0 ml-3"
                      style={{
                        backgroundColor: inStockOnly
                          ? "var(--theme-primary, #005826)"
                          : "var(--theme-card-border, #cbd5e1)"
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                          inStockOnly ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Drawer Sticky Footer */}
              <div 
                className="p-4 sm:p-5 border-t flex items-center gap-3 shrink-0"
                style={{ 
                  borderColor: "var(--theme-card-border, #e5e7eb)",
                  backgroundColor: "var(--theme-card-bg, #ffffff)"
                }}
              >
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="py-2.5 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ 
                      borderColor: "var(--theme-card-border, #e5e7eb)",
                      color: "var(--theme-text-heading, #0f172a)"
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer text-center hover:opacity-95 active:scale-[0.99]"
                  style={{ backgroundColor: "var(--theme-primary, #005826)" }}
                >
                  View {totalCount || products.length} Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductCatalogClient({
  overrideCategory,
  overrideBrand,
}: {
  overrideCategory?: string;
  overrideBrand?: string;
} = {}) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-sm">Loading Catalog...</div>}>
      <ProductCatalogContent overrideCategory={overrideCategory} overrideBrand={overrideBrand} />
    </Suspense>
  );
}

