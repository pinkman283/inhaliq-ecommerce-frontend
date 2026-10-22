"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Search,
  Filter,
  X,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Layers,
  Building2,
  Info,
  Loader2,
  ArrowUpDown,
  Sliders,
  DollarSign,
  Package,
  Sparkles,
  Flame,
  Check,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Category, Brand, Product } from "@/types";
import { AdminPageHeader } from "@/components/admin/ui";
import { toast } from "sonner";

interface EditableProductRow {
  id: number;
  name: string;
  sku: string;
  category_name: string;
  brand_name: string;
  cost_price: number | string;
  compare_at_price: number | string;
  price: number | string;
  stock_quantity: number | string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  has_variants: boolean;
  variants?: Array<{
    id: number;
    name: string;
    sku: string;
    cost_price: number | string;
    price: number | string;
    stock_quantity: number | string;
    is_active: boolean;
  }>;
}

export default function BulkProductEditPage() {
  const router = useRouter();

  // Reference Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter States
  const [keyword, setKeyword] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedChildCategoryId, setSelectedChildCategoryId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [onlyVariants, setOnlyVariants] = useState(false);

  // Applied Filters (trigger queries)
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: "",
    categoryId: "",
    subCategoryId: "",
    childCategoryId: "",
    brandId: "",
    onlyVariants: false,
  });

  // Products Data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Local Editable State
  // Map of product ID -> modified values
  const [editedProducts, setEditedProducts] = useState<Record<number, Partial<EditableProductRow>>>({});
  // Map of variant ID -> modified values
  const [editedVariants, setEditedVariants] = useState<Record<number, Partial<{
    cost_price: number | string;
    price: number | string;
    stock_quantity: number | string;
    is_active: boolean;
  }>>>({});

  // Expanded variant rows
  const [expandedProductIds, setExpandedProductIds] = useState<Record<number, boolean>>({});

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load Categories and Brands
  useEffect(() => {
    let isMounted = true;
    Promise.all([adminApi.getCategories(), adminApi.getBrands()])
      .then(([cats, brs]) => {
        if (!isMounted) return;
        setCategories(cats || []);
        setBrands(brs || []);
      })
      .catch((err) => {
        console.error("Failed to load catalog filters:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Subcategories and Child categories hierarchically
  const topCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const parent = categories.find((c) => String(c.id) === String(selectedCategoryId));
    return (parent as any)?.children || [];
  }, [categories, selectedCategoryId]);

  const childCategories = useMemo(() => {
    if (!selectedSubCategoryId) return [];
    const sub = categories.find((c) => String(c.id) === String(selectedSubCategoryId));
    return (sub as any)?.children || [];
  }, [categories, selectedSubCategoryId]);

  // 2. Fetch Products for Bulk Edit
  const fetchProducts = useCallback(async (page = currentPage, filters = appliedFilters) => {
    setLoading(true);
    try {
      // Determine effective category filter (child, sub, or parent)
      const effectiveCatId = filters.childCategoryId || filters.subCategoryId || filters.categoryId || undefined;

      const res = await adminApi.getProducts({
        search: filters.keyword.trim() || undefined,
        category_id: effectiveCatId,
        brand_id: filters.brandId || undefined,
        has_variants: filters.onlyVariants ? true : undefined,
        page,
        per_page: perPage,
        sort: "latest",
      });

      setProducts(res.data || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.last_page || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load catalog products.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedFilters, perPage]);

  useEffect(() => {
    fetchProducts(currentPage, appliedFilters);
  }, [currentPage, appliedFilters, fetchProducts]);

  // 3. Handle Filter Actions
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      keyword,
      categoryId: selectedCategoryId,
      subCategoryId: selectedSubCategoryId,
      childCategoryId: selectedChildCategoryId,
      brandId: selectedBrandId,
      onlyVariants,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setKeyword("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedChildCategoryId("");
    setSelectedBrandId("");
    setOnlyVariants(false);
    const reset = {
      keyword: "",
      categoryId: "",
      subCategoryId: "",
      childCategoryId: "",
      brandId: "",
      onlyVariants: false,
    };
    setAppliedFilters(reset);
    setCurrentPage(1);
  };

  // 4. In-Memory Edit Handlers for Products
  const handleProductFieldChange = (
    productId: number,
    field: keyof EditableProductRow,
    value: any
  ) => {
    setEditedProducts((prev) => {
      const current = prev[productId] || {};
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // In-Memory Edit Handlers for Variants
  const handleVariantFieldChange = (
    variantId: number,
    field: "cost_price" | "price" | "stock_quantity" | "is_active",
    value: any
  ) => {
    setEditedVariants((prev) => {
      const current = prev[variantId] || {};
      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Discard all unsaved changes
  const handleDiscardChanges = () => {
    setEditedProducts({});
    setEditedVariants({});
    toast.info("All unsaved edits have been discarded.");
  };

  // Total modified changes count
  const totalDirtyCount = useMemo(() => {
    return Object.keys(editedProducts).length + Object.keys(editedVariants).length;
  }, [editedProducts, editedVariants]);

  // 5. Batch Save Changes
  const handleSaveAll = async () => {
    if (totalDirtyCount === 0) return;

    setIsSaving(true);
    try {
      const productPayload = Object.entries(editedProducts).map(([idStr, changes]) => ({
        id: Number(idStr),
        cost_price: changes.cost_price !== undefined ? (changes.cost_price === "" ? null : Number(changes.cost_price)) : undefined,
        compare_at_price: changes.compare_at_price !== undefined ? (changes.compare_at_price === "" ? null : Number(changes.compare_at_price)) : undefined,
        price: changes.price !== undefined ? Number(changes.price) : undefined,
        stock_quantity: changes.stock_quantity !== undefined ? Number(changes.stock_quantity) : undefined,
        is_featured: changes.is_featured,
        is_best_seller: changes.is_best_seller,
        is_active: changes.is_active,
      }));

      const variantPayload = Object.entries(editedVariants).map(([idStr, changes]) => ({
        id: Number(idStr),
        cost_price: changes.cost_price !== undefined ? (changes.cost_price === "" ? null : Number(changes.cost_price)) : undefined,
        price: changes.price !== undefined ? Number(changes.price) : undefined,
        stock_quantity: changes.stock_quantity !== undefined ? Number(changes.stock_quantity) : undefined,
        is_active: changes.is_active,
      }));

      const res = await adminApi.bulkQuickSaveProducts({
        products: productPayload,
        variants: variantPayload,
      });

      toast.success(res.message || "Bulk product changes saved successfully!");
      setEditedProducts({});
      setEditedVariants({});
      // Refresh list to sync fresh state
      await fetchProducts(currentPage, appliedFilters);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save bulk changes.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle expand variants
  const toggleExpand = (productId: number) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-24 text-slate-100">
      {/* Top Header */}
      <AdminPageHeader
        title="Bulk Product Edit"
        description="Fast spreadsheet-style catalog editor. Rapidly adjust purchase prices, selling prices, stock levels, and promotional badges."
        badge={`${totalItems} Total Products`}
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Bulk Edit" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            {totalDirtyCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save All Changes ({totalDirtyCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/admin/products/create")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        }
      />

      {/* Filter Section Card (Matches Senior's UI) */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Keyword Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedSubCategoryId("");
                  setSelectedChildCategoryId("");
                }}
                className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#A78BFA] transition"
              >
                <option value="">Choose Categories</option>
                {topCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Sub Category
              </label>
              <select
                value={selectedSubCategoryId}
                disabled={!selectedCategoryId || subCategories.length === 0}
                onChange={(e) => {
                  setSelectedSubCategoryId(e.target.value);
                  setSelectedChildCategoryId("");
                }}
                className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#A78BFA] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Choose Sub Categories</option>
                {subCategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Child Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Child Category
              </label>
              <select
                value={selectedChildCategoryId}
                disabled={!selectedSubCategoryId || childCategories.length === 0}
                onChange={(e) => setSelectedChildCategoryId(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#A78BFA] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Choose Child Categories</option>
                {childCategories.map((child: any) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Brand
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#A78BFA] transition"
              >
                <option value="">Choose Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Row: Filter, Clear, Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold text-xs transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Checkbox: Show only products with variants */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={onlyVariants}
                onChange={(e) => {
                  setOnlyVariants(e.target.checked);
                  setAppliedFilters((prev) => ({ ...prev, onlyVariants: e.target.checked }));
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded border-white/20 bg-[#121624] text-[#A78BFA] focus:ring-0 cursor-pointer accent-[#A78BFA]"
              />
              <span className="font-medium">Show only products with variants</span>
            </label>
          </div>
        </form>
      </div>

      {/* Spreadsheet Quick-Edit Data Table Card */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0a0d15] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3.5 px-3 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[280px]">Product Name</th>
                <th className="py-3.5 px-3 w-32">
                  <div className="flex items-center gap-1" title="Purchase / Cost Price (P. Price)">
                    <span>P. Price</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-32">Old Price</th>
                <th className="py-3.5 px-3 w-32">New Price</th>
                <th className="py-3.5 px-3 w-28">Stock</th>
                <th className="py-3.5 px-3 w-28 text-center">Flash Sale</th>
                <th className="py-3.5 px-3 w-28 text-center">Hot Deals</th>
                <th className="py-3.5 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A78BFA] mb-2" />
                    <p className="text-xs">Loading catalog products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-300">No products match the selected filters</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing some filter criteria to broaden results.</p>
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const rowIndex = (currentPage - 1) * perPage + idx + 1;
                  const edits = editedProducts[p.id] || {};
                  const isRowDirty = Object.keys(edits).length > 0;

                  // Values in view (prioritize dirty in-memory edits over server values)
                  const costPrice = edits.cost_price !== undefined ? edits.cost_price : (p.cost_price ?? "");
                  const oldPrice = edits.compare_at_price !== undefined ? edits.compare_at_price : (p.compare_at_price ?? "");
                  const newPrice = edits.price !== undefined ? edits.price : (p.price ?? "");
                  const stock = edits.stock_quantity !== undefined ? edits.stock_quantity : (p.stock_quantity ?? 0);
                  const isFeatured = edits.is_featured !== undefined ? edits.is_featured : (p.is_featured ?? false);
                  const isBestSeller = edits.is_best_seller !== undefined ? edits.is_best_seller : (p.is_best_seller ?? false);
                  const isActive = edits.is_active !== undefined ? edits.is_active : (p.is_active ?? true);

                  const variants = p.variants || [];
                  const hasVariants = variants.length > 0;
                  const isExpanded = expandedProductIds[p.id] || false;

                  return (
                    <React.Fragment key={p.id}>
                      {/* Main Product Row */}
                      <tr
                        className={`transition-colors ${
                          isRowDirty
                            ? "bg-[#A78BFA]/[0.06] hover:bg-[#A78BFA]/[0.09]"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* # Row Number */}
                        <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-xs">
                          {isRowDirty ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#A78BFA]" title="Unsaved changes in this row" />
                          ) : (
                            rowIndex
                          )}
                        </td>

                        {/* Product Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white leading-snug">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                              SKU: {p.sku || "N/A"}
                            </span>
                            {p.category && (
                              <span className="text-[10px] text-slate-400">
                                • {p.category.name}
                              </span>
                            )}
                            {hasVariants && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(p.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded transition cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span>{variants.length} Variants</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* P. Price (Cost Price) */}
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={costPrice}
                            onChange={(e) => handleProductFieldChange(p.id, "cost_price", e.target.value)}
                            className={`w-full bg-[#121624] border rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none transition ${
                              edits.cost_price !== undefined
                                ? "border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA]"
                                : "border-white/10 focus:border-[#A78BFA]"
                            }`}
                          />
                        </td>

                        {/* Old Price (Compare At Price) */}
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={oldPrice}
                            onChange={(e) => handleProductFieldChange(p.id, "compare_at_price", e.target.value)}
                            className={`w-full bg-[#121624] border rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none transition ${
                              edits.compare_at_price !== undefined
                                ? "border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA]"
                                : "border-white/10 focus:border-[#A78BFA]"
                            }`}
                          />
                        </td>

                        {/* New Price (Selling Price) */}
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={newPrice}
                            onChange={(e) => handleProductFieldChange(p.id, "price", e.target.value)}
                            className={`w-full bg-[#121624] border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition ${
                              edits.price !== undefined
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                : "border-white/10 focus:border-[#A78BFA]"
                            }`}
                          />
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={stock}
                            onChange={(e) => handleProductFieldChange(p.id, "stock_quantity", e.target.value)}
                            className={`w-full bg-[#121624] border rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none transition ${
                              edits.stock_quantity !== undefined
                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                                : "border-white/10 focus:border-[#A78BFA]"
                            }`}
                          />
                        </td>

                        {/* Flash Sale Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isFeatured}
                            onClick={() => handleProductFieldChange(p.id, "is_featured", !isFeatured)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isFeatured ? "bg-[#8B5CF6]" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isFeatured ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Hot Deals Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isBestSeller}
                            onClick={() => handleProductFieldChange(p.id, "is_best_seller", !isBestSeller)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isBestSeller ? "bg-[#8B5CF6]" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isBestSeller ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => handleProductFieldChange(p.id, "is_active", !isActive)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-[#8B5CF6]" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Child Variant Rows */}
                      {hasVariants && isExpanded && (
                        variants.map((v, vIdx) => {
                          const vEdits = editedVariants[v.id] || {};
                          const isVDirty = Object.keys(vEdits).length > 0;

                          const vCostPrice = vEdits.cost_price !== undefined ? vEdits.cost_price : (v.cost_price ?? "");
                          const vPrice = vEdits.price !== undefined ? vEdits.price : (v.price ?? "");
                          const vStock = vEdits.stock_quantity !== undefined ? vEdits.stock_quantity : (v.stock_quantity ?? 0);
                          const vIsActive = vEdits.is_active !== undefined ? vEdits.is_active : (v.is_active ?? true);

                          return (
                            <tr
                              key={`var-${v.id}`}
                              className={`bg-white/[0.015] border-l-2 border-l-cyan-500/50 hover:bg-white/[0.03] transition-colors`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-[10px] text-cyan-400">
                                {rowIndex}.{vIdx + 1}
                              </td>

                              <td className="py-2.5 px-4 pl-8">
                                <div className="text-xs text-slate-200 font-medium flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  <span>{v.name || `Variant #${v.id}`}</span>
                                  {v.sku && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      ({v.sku})
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Variant Cost Price */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={vCostPrice}
                                  placeholder="0.00"
                                  onChange={(e) => handleVariantFieldChange(v.id, "cost_price", e.target.value)}
                                  className={`w-full bg-[#0a0d15] border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none ${
                                    vEdits.cost_price !== undefined
                                      ? "border-cyan-400 text-cyan-300"
                                      : "border-white/10"
                                  }`}
                                />
                              </td>

                              {/* Variant Old Price (dash) */}
                              <td className="py-2.5 px-3 text-slate-500 text-center font-mono">
                                -
                              </td>

                              {/* Variant New Price */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={vPrice}
                                  onChange={(e) => handleVariantFieldChange(v.id, "price", e.target.value)}
                                  className={`w-full bg-[#0a0d15] border rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none ${
                                    vEdits.price !== undefined
                                      ? "border-cyan-400 text-cyan-300"
                                      : "border-white/10"
                                  }`}
                                />
                              </td>

                              {/* Variant Stock */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={vStock}
                                  onChange={(e) => handleVariantFieldChange(v.id, "stock_quantity", e.target.value)}
                                  className={`w-full bg-[#0a0d15] border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none ${
                                    vEdits.stock_quantity !== undefined
                                      ? "border-cyan-400 text-cyan-300"
                                      : "border-white/10"
                                  }`}
                                />
                              </td>

                              {/* Variant Flash sale (inherited) */}
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[10px]">
                                Inherited
                              </td>

                              {/* Variant Hot deals (inherited) */}
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[10px]">
                                Inherited
                              </td>

                              {/* Variant Status */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={vIsActive}
                                  onClick={() => handleVariantFieldChange(v.id, "is_active", !vIsActive)}
                                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    vIsActive ? "bg-cyan-500" : "bg-white/10"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      vIsActive ? "translate-x-3" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#121624] border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>items per page ({totalItems} total)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="font-semibold text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Save Action Bar (Shows when there are dirty edits) */}
      <AnimatePresence>
        {totalDirtyCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-[#0d101a]/95 backdrop-blur-xl border border-[#A78BFA]/40 shadow-[0_15px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(167,139,250,0.2)] text-xs text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#A78BFA] text-[#090B10] font-black text-xs">
                  {totalDirtyCount}
                </span>
                <div>
                  <div className="font-bold text-white text-xs">Unsaved Bulk Changes</div>
                  <div className="text-[11px] text-slate-400">
                    Modifications are held in memory. Click Save to persist.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-xs transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-purple-500/25 transition cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
