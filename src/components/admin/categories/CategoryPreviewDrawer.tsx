/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Edit,
  FolderTree,
  Layers,
  Sparkles,
  Search,
  Package,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Category } from "@/types";

interface CategoryPreviewDrawerProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  getCategoryPath: (cat: Category) => Category[];
  getCategoryLevel: (cat: Category) => number;
  onEdit: (category: Category) => void;
  onSelectCategory?: (category: Category) => void;
}

export function CategoryPreviewDrawer({
  category,
  isOpen,
  onClose,
  categories,
  getCategoryPath,
  getCategoryLevel,
  onEdit,
  onSelectCategory,
}: CategoryPreviewDrawerProps) {
  const categoryPath = useMemo(() => {
    if (!category) return [];
    return getCategoryPath(category);
  }, [category, getCategoryPath]);

  const directChildren = useMemo(() => {
    if (!category) return [];
    return categories
      .filter((c) => c.parent_id === category.id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
  }, [categories, category]);

  const storefrontUrl = useMemo(() => {
    if (!category) return "/";
    if (categoryPath.length > 0) {
      const segments = categoryPath.map((c) => c.slug).filter(Boolean);
      return `/category/${segments.join("/")}`;
    }
    return `/products?category=${category.slug}`;
  }, [category, categoryPath]);

  if (!category) return null;

  const level = getCategoryLevel(category);
  const isRoot = !category.parent_id;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[500px] md:w-[540px] sm:!max-w-[540px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-3">
              <SheetTitle className="text-sm font-bold text-white tracking-wide shrink-0">
                Category Preview
              </SheetTitle>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full shrink-0">
                #{category.id}
              </span>
              {category.is_featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  Featured
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
            {/* Cover Image or Fallback */}
            <div>
              {category.image ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-[16/9] shadow-inner group">
                  <img
                    src={category.image}
                    alt={category.image_alt || category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <p className="font-bold text-sm drop-shadow">{category.name}</p>
                    {category.image_alt && (
                      <p className="text-[10px] text-slate-300 drop-shadow line-clamp-1">
                        Alt: {category.image_alt}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] aspect-[16/7] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">No cover image uploaded</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Upload an image in the editor to enhance navigation cards & storefront display.
                  </p>
                </div>
              )}
            </div>

            {/* General Information Grid */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                General Overview
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Category Name</span>
                  <p className="text-white font-bold text-xs truncate">{category.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Level & Role</span>
                  <p className="font-semibold text-xs text-amber-400">
                    {isRoot ? "Root Department (L1)" : level === 2 ? "Subcategory (L2)" : `Deep Item (L${level})`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">URL Slug</span>
                  <p className="text-cyan-400 font-mono font-medium text-[11px] truncate">/{category.slug}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Badge Tag</span>
                  <p className="text-slate-200 font-medium text-xs">
                    {category.badge ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        {category.badge}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Display Order</span>
                  <p className="text-slate-300 font-mono text-xs">{category.display_order ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Menu Status</span>
                  <p className="text-xs font-semibold text-slate-300">
                    {category.is_featured ? (
                      <span className="text-amber-400">Featured in Highlights</span>
                    ) : (
                      <span className="text-slate-400">Standard Navigation</span>
                    )}
                  </p>
                </div>
              </div>

              {category.description && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Description
                  </span>
                  <p className="text-slate-300 leading-relaxed text-xs">{category.description}</p>
                </div>
              )}
            </div>

            {/* Hierarchy & Lineage */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                Hierarchy & Tree Position
              </h4>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Lineage Trail
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {categoryPath.map((item, index) => {
                      const isLast = index === categoryPath.length - 1;
                      return (
                        <React.Fragment key={item.id}>
                          <span
                            className={`font-semibold ${
                              isLast ? "text-amber-400 font-bold" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                          {!isLast && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Direct Parent:</span>
                  <span className="text-slate-200 font-semibold">
                    {category.parent ? category.parent.name : "None (Top-Level Root)"}
                  </span>
                </div>
              </div>

              {/* Direct Child Categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Direct Subcategories ({directChildren.length})
                  </span>
                </div>
                {directChildren.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-3 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                    No nested subcategories under this category.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {directChildren.map((child) => (
                      <div
                        key={child.id}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-white font-semibold truncate text-xs">{child.name}</span>
                          {child.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold shrink-0">
                              {child.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {child.products_count ?? 0} items
                          </span>
                          {onSelectCategory && (
                            <button
                              type="button"
                              onClick={() => onSelectCategory(child)}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Catalog Products */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Product Assignments
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Primary Category
                  </span>
                  <p className="text-lg font-black text-white">{category.products_count ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Products via category_id</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Subcategory Role
                  </span>
                  <p className="text-lg font-black text-white">{category.subcategory_products_count ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Products via subcategory_id</p>
                </div>
              </div>
            </div>

            {/* Search Engine Optimization (SEO) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                Search Engine Optimization
              </h4>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Meta Title
                  </span>
                  <p className="text-slate-200 font-medium text-xs mt-0.5">
                    {category.meta_title || category.name}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Meta Description
                  </span>
                  <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                    {category.meta_description || category.description || "None specified (auto-generated fallback)"}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Image Alt Attribute
                  </span>
                  <p className="text-slate-300 font-mono text-[11px] mt-0.5">
                    {category.image_alt || category.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="h-14 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
            <Link
              href={storefrontUrl}
              target="_blank"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition py-2"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(category);
              }}
              className="h-8 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Category</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
