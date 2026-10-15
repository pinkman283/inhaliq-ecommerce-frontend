import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Category, Brand } from "@/types";
import { AdminDropdown } from "@/components/admin/AdminDropdown";

interface ProductsFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: Category[];
  brandId: string;
  onBrandChange: (value: string) => void;
  brands: Brand[];
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  badgeFilter: string;
  onBadgeFilterChange: (value: string) => void;
  mediaFilter: string;
  onMediaFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onResetFilters: () => void;
}

export function ProductsFilterToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  categoryId,
  onCategoryChange,
  categories,
  brandId,
  onBrandChange,
  brands,
  stockFilter,
  onStockFilterChange,
  badgeFilter,
  onBadgeFilterChange,
  mediaFilter,
  onMediaFilterChange,
  sortBy,
  onSortByChange,
  onResetFilters,
}: ProductsFilterToolbarProps) {
  return (
    <div className="p-2.5 rounded-md bg-[#0f121b] border border-white/[0.08] flex flex-col lg:flex-row items-center justify-between gap-2">
      {/* Search Input */}
      <form onSubmit={onSearchSubmit} className="relative w-full lg:w-72">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search || ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search SKU, name, brand..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
        />
      </form>

      {/* Filter & Sort Dropdowns */}
      <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
        {/* Category Filter */}
        <AdminDropdown
          value={categoryId}
          onChange={onCategoryChange}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
          ]}
        />

        {/* Brand Filter (Phase 3A Addition) */}
        <AdminDropdown
          value={brandId}
          onChange={onBrandChange}
          options={[
            { value: "", label: "All Brands" },
            ...brands.map((b) => ({ value: b.id.toString(), label: b.name })),
          ]}
        />

        {/* Media Filter */}
        <AdminDropdown
          value={mediaFilter}
          onChange={onMediaFilterChange}
          options={[
            { value: "all", label: "All Media" },
            { value: "has_images", label: "Has Images" },
            { value: "no_images", label: "No Images" },
          ]}
        />

        {/* Stock Level Filter */}
        <AdminDropdown
          value={stockFilter}
          onChange={onStockFilterChange}
          options={[
            { value: "all", label: "All Stock Levels" },
            { value: "in_stock", label: "In Stock (>0)" },
            { value: "low_stock", label: "Low Stock (<=10)" },
            { value: "out_of_stock", label: "Out of Stock (0)" },
          ]}
        />

        {/* Badge Filter */}
        <AdminDropdown
          value={badgeFilter}
          onChange={onBadgeFilterChange}
          options={[
            { value: "all", label: "All Badges" },
            { value: "featured", label: "Featured" },
            { value: "new_arrival", label: "New Arrivals" },
            { value: "best_seller", label: "Best Sellers" },
          ]}
        />

        {/* Server-Side Sort Dropdown */}
        <AdminDropdown
          value={sortBy}
          onChange={onSortByChange}
          options={[
            { value: "latest", label: "Sort: Latest" },
            { value: "price_asc", label: "Price: Low-High" },
            { value: "price_desc", label: "Price: High-Low" },
            { value: "stock_asc", label: "Stock: Low-High" },
            { value: "stock_desc", label: "Stock: High-Low" },
            { value: "name_asc", label: "Name: A-Z" },
          ]}
        />

        {/* Reset Button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          title="Reset filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
