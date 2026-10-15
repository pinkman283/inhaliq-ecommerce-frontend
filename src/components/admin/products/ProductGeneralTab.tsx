"use client";

import React from "react";
import { Plus, Hash, Link2 } from "lucide-react";
import { Category, Brand, Product, ProductFormData } from "@/types";
import { Switch } from "@/components/ui/switch";

interface ProductGeneralTabProps {
  formData: ProductFormData;
  onChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  categories: Category[];
  brands: Brand[];
  onOpenQuickCategory: () => void;
  onOpenQuickBrand: () => void;
  editingProduct: Product | null;
}

export function ProductGeneralTab({
  formData,
  onChange,
  categories,
  brands,
  onOpenQuickCategory,
  onOpenQuickBrand,
  editingProduct,
}: ProductGeneralTabProps) {
  // Root categories (categories without a parent_id)
  const rootCategories = categories.filter((c) => !c.parent_id);
  const activeRootList = rootCategories.length > 0 ? rootCategories : categories;

  // Subcategories for the currently selected category
  const subcategories = categories.filter(
    (c) => c.parent_id === Number(formData.category_id)
  );

  return (
    <div className="space-y-5">
      {/* Read-only metadata if editing an existing product */}
      {editingProduct && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">SKU:</span>
            <span className="text-slate-200 font-semibold">{editingProduct.sku || "N/A"}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 font-mono truncate max-w-[320px]">
            <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400 shrink-0">Slug:</span>
            <span className="text-slate-200 truncate">{editingProduct.slug || "auto-generated"}</span>
          </div>
        </div>
      )}

      {/* Product Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300 block">
          Product Title <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. AeroPack X-Pac 24L Modular Travel Pack"
          className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 focus:bg-white/[0.05] rounded-md px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
        />
      </div>

      {/* 3-Tier Classification: Category -> Subcategory -> Brand */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Category */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Category (Root) <span className="text-rose-400">*</span></label>
            <button
              type="button"
              onClick={onOpenQuickCategory}
              className="text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="relative">
            <select
              value={formData.category_id}
              onChange={(e) => {
                onChange("category_id", e.target.value);
                onChange("subcategory_id", "");
              }}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
            >
              {activeRootList.map((c) => (
                <option key={c.id} value={c.id.toString()} className="bg-[#0e121e]">
                  {c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subcategory */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Subcategory</label>
            <span className="text-[10px] text-slate-500 font-mono">Optional</span>
          </div>
          <div className="relative">
            <select
              value={formData.subcategory_id}
              onChange={(e) => onChange("subcategory_id", e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
            >
              <option value="" className="bg-[#0e121e]">-- No Subcategory --</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id.toString()} className="bg-[#0e121e]">
                  {sub.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Brand</label>
            <button
              type="button"
              onClick={onOpenQuickBrand}
              className="text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="relative">
            <select
              value={formData.brand_id || formData.brand}
              onChange={(e) => {
                const val = e.target.value;
                const matchedBrand = brands.find((b) => b.id.toString() === val || b.name === val);
                if (matchedBrand) {
                  onChange("brand_id", matchedBrand.id.toString());
                  onChange("brand", matchedBrand.name);
                } else {
                  onChange("brand", val);
                }
              }}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id.toString()} className="bg-[#0e121e]">
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 block">Short Summary</label>
          <span className="text-[10px] text-slate-500 font-mono">Storefront card teaser</span>
        </div>
        <textarea
          rows={2}
          value={formData.short_description}
          onChange={(e) => onChange("short_description", e.target.value)}
          placeholder="Concise overview or headline for product listings and search results..."
          className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y leading-relaxed"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300 block">
          Full Description <span className="text-rose-400">*</span>
        </label>
        <textarea
          rows={4}
          required
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Detailed specifications, features, dimensions, materials, care instructions..."
          className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y leading-relaxed"
        />
      </div>

      {/* Visibility & Badges Section */}
      <div className="pt-4 border-t border-white/[0.06] space-y-3">
        <h4 className="text-xs font-semibold text-white tracking-wide">Visibility & Badges</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Active Status</p>
              <p className="text-[10px] text-slate-400">Live on storefront</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(val) => onChange("is_active", val)}
              size="sm"
            />
          </div>

          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Featured</p>
              <p className="text-[10px] text-slate-400">Hero & curated spotlight</p>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(val) => onChange("is_featured", val)}
              size="sm"
            />
          </div>

          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">New Arrival</p>
              <p className="text-[10px] text-slate-400">Highlight new badge</p>
            </div>
            <Switch
              checked={formData.is_new_arrival}
              onCheckedChange={(val) => onChange("is_new_arrival", val)}
              size="sm"
            />
          </div>

          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Best Seller</p>
              <p className="text-[10px] text-slate-400">Popular collection badge</p>
            </div>
            <Switch
              checked={formData.is_best_seller}
              onCheckedChange={(val) => onChange("is_best_seller", val)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
