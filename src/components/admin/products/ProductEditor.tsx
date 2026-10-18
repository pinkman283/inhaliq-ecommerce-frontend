"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  X,
  Package,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Category,
  Brand,
  Product,
  ProductOption,
  ProductFormData,
  ProductFormImage,
  ProductFormVariant,
} from "@/types";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { inferOptionsFromLegacyVariants } from "./variants";

// Tab Components
import { ProductGeneralTab } from "./ProductGeneralTab";
import { ProductPricingTab } from "./ProductPricingTab";
import { ProductMediaTab } from "./ProductMediaTab";
import { ProductVariantsTab } from "./ProductVariantsTab";
import { ProductSeoTab } from "./ProductSeoTab";

export type ProductEditorTab = "general" | "pricing" | "media" | "variants" | "seo";

interface ProductEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  initialTab?: ProductEditorTab;
  categories: Category[];
  brands: Brand[];
  onProductSaved: (product: Product, isNew: boolean) => void;
  onCategoriesUpdated: (categories: Category[]) => void;
  onBrandsUpdated: (brands: Brand[]) => void;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  category_id: "1",
  subcategory_id: "",
  brand_id: "",
  brand: "AETHER Studio",
  price: "0",
  compare_at_price: "0",
  cost_price: "",
  stock_quantity: "0",
  short_description: "",
  description: "",
  meta_title: "",
  meta_description: "",
  is_featured: false,
  is_new_arrival: true,
  is_best_seller: false,
  is_active: true,
  images: [],
  variants: [],
  options: [],
};

function getInitialFormData(
  editingProduct: Product | null,
  categories: Category[],
  brands: Brand[]
): ProductFormData {
  if (editingProduct) {
    let initialImages: ProductFormImage[] = [];
    if (editingProduct.images && editingProduct.images.length > 0) {
      initialImages = editingProduct.images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: Boolean(img.is_primary),
        alt_text: img.alt_text || undefined,
        color_name: img.color_name || undefined,
        display_order: img.display_order,
        source: "url",
      }));
    } else if (editingProduct.primary_image) {
      initialImages = [
        {
          id: editingProduct.primary_image.id,
          image_url: editingProduct.primary_image.image_url,
          is_primary: true,
          alt_text: editingProduct.primary_image.alt_text || undefined,
          color_name: editingProduct.primary_image.color_name || undefined,
          display_order: 0,
          source: "url",
        },
      ];
    }

    let initialOptions: ProductOption[] = [];
    if (editingProduct.options && Array.isArray(editingProduct.options) && editingProduct.options.length > 0) {
      initialOptions = editingProduct.options;
    } else if (editingProduct.variants && editingProduct.variants.length > 0) {
      initialOptions = inferOptionsFromLegacyVariants(editingProduct.variants);
    }

    let initialVariants: ProductFormVariant[] = [];
    if (editingProduct.variants && editingProduct.variants.length > 0) {
      initialVariants = editingProduct.variants.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.size || null,
        color_name: v.color_name || (v.color_hex ? v.name : null),
        color_hex: v.color_hex || null,
        stock_quantity: v.stock_quantity ?? 0,
        price: v.price !== null && v.price !== undefined ? Number(v.price) : null,
        price_modifier: Number(v.price_modifier || 0),
        cost_price: v.cost_price ? Number(v.cost_price) : null,
        barcode: v.barcode || null,
        sku: v.sku || null,
        attributes: v.attributes || (v.color_name || v.size ? { ...(v.color_name ? { Color: v.color_name } : {}), ...(v.size ? { Size: v.size } : {}) } : null),
        image_id: v.image_id ? Number(v.image_id) : null,
        image_url: v.image_url || null,
        is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
      }));
    }

    return {
      name: editingProduct.name || "",
      category_id:
        editingProduct.category?.id?.toString() ||
        editingProduct.category_id?.toString() ||
        categories[0]?.id?.toString() ||
        "1",
      subcategory_id: editingProduct.subcategory_id?.toString() || "",
      brand_id:
        editingProduct.brand_id?.toString() ||
        brands.find((b) => b.name.toLowerCase() === (editingProduct.brand || "").toLowerCase())?.id?.toString() ||
        "",
      brand: editingProduct.brand || "AETHER Studio",
      price: editingProduct.price?.toString() || "0",
      compare_at_price: editingProduct.compare_at_price ? editingProduct.compare_at_price.toString() : "0",
      cost_price: editingProduct.cost_price ? editingProduct.cost_price.toString() : "",
      stock_quantity: editingProduct.stock_quantity?.toString() || "0",
      short_description: editingProduct.short_description || "",
      description: editingProduct.description || "",
      meta_title: editingProduct.meta_title || "",
      meta_description: editingProduct.meta_description || "",
      is_featured: Boolean(editingProduct.is_featured),
      is_new_arrival: Boolean(editingProduct.is_new_arrival),
      is_best_seller: Boolean(editingProduct.is_best_seller),
      is_active: editingProduct.is_active !== undefined ? Boolean(editingProduct.is_active) : true,
      images: initialImages,
      variants: initialVariants,
      options: initialOptions,
    };
  }

  return {
    ...DEFAULT_FORM_DATA,
    category_id: categories[0]?.id?.toString() || "1",
    brand_id: brands[0]?.id?.toString() || "",
    brand: brands[0]?.name || "AETHER Studio",
  };
}

interface ProductEditorInnerProps {
  onClose: () => void;
  editingProduct: Product | null;
  initialTab?: ProductEditorTab;
  categories: Category[];
  brands: Brand[];
  onProductSaved: (product: Product, isNew: boolean) => void;
  onCategoriesUpdated: (categories: Category[]) => void;
  onBrandsUpdated: (brands: Brand[]) => void;
}

function ProductEditorInner({
  onClose,
  editingProduct,
  initialTab,
  categories,
  brands,
  onProductSaved,
  onCategoriesUpdated,
  onBrandsUpdated,
}: ProductEditorInnerProps) {
  const [activeTab, setActiveTab] = useState<ProductEditorTab>(initialTab || "general");
  const [formData, setFormData] = useState<ProductFormData>(() =>
    getInitialFormData(editingProduct, categories, brands)
  );
  const [saving, setSaving] = useState(false);
  const sessionUploadedUrlsRef = useRef<string[]>([]);

  const handleClose = () => {
    if (sessionUploadedUrlsRef.current.length > 0) {
      sessionUploadedUrlsRef.current.forEach((url) => {
        adminApi.deleteUncommittedImage({ image_url: url }).catch(() => {});
      });
      sessionUploadedUrlsRef.current = [];
    }
    onClose();
  };

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    (formData.variants || []).forEach((v) => {
      if (v.color_name?.trim()) set.add(v.color_name.trim());
    });
    return Array.from(set);
  }, [formData.variants]);

  // Quick Category Modal State
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategorySaving, setQuickCategorySaving] = useState(false);

  // Quick Brand Modal State
  const [isQuickBrandOpen, setIsQuickBrandOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");
  const [quickBrandWebsite, setQuickBrandWebsite] = useState("");
  const [quickBrandDescription, setQuickBrandDescription] = useState("");
  const [quickBrandSaving, setQuickBrandSaving] = useState(false);

  // Form Field Updater
  const updateFormField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Quick Category creation
  const handleSaveQuickCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setQuickCategorySaving(true);
    try {
      const res = await adminApi.createCategory({
        name: quickCategoryName.trim(),
        description: quickCategoryDescription.trim() || undefined,
        icon: "Sparkles",
        is_featured: true,
      });
      const newCat = res.category;
      const updatedCategories = [...categories, newCat];
      onCategoriesUpdated(updatedCategories);
      updateFormField("category_id", newCat.id.toString());
      updateFormField("subcategory_id", "");
      setIsQuickCategoryOpen(false);
      setQuickCategoryName("");
      setQuickCategoryDescription("");
      toast.success(`Category '${newCat.name}' created.`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to create category.");
    } finally {
      setQuickCategorySaving(false);
    }
  };

  // Quick Brand creation
  const handleSaveQuickBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) {
      toast.error("Brand name is required.");
      return;
    }
    setQuickBrandSaving(true);
    try {
      const res = await adminApi.createBrand({
        name: quickBrandName.trim(),
        website: quickBrandWebsite.trim() || undefined,
        description: quickBrandDescription.trim() || undefined,
        is_featured: true,
      });
      const newBrand = res.brand;
      const updatedBrands = [...brands, newBrand];
      onBrandsUpdated(updatedBrands);
      updateFormField("brand_id", newBrand.id.toString());
      updateFormField("brand", newBrand.name);
      setIsQuickBrandOpen(false);
      setQuickBrandName("");
      setQuickBrandWebsite("");
      setQuickBrandDescription("");
      toast.success(`Brand '${newBrand.name}' created.`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to create brand.");
    } finally {
      setQuickBrandSaving(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cross-tab validation checks
    if (!formData.name.trim()) {
      setActiveTab("general");
      toast.error("Product name is required.");
      return;
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      setActiveTab("pricing");
      toast.error("A valid selling price is required.");
      return;
    }

    if (formData.images.length === 0) {
      setActiveTab("media");
      toast.error("Please add at least 1 product image in the Media tab.");
      return;
    }

    setSaving(true);

    const sanitizedImages = formData.images.map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      is_primary: img.is_primary,
      display_order: idx,
      alt_text: img.alt_text || formData.name,
      color_name: img.color_name || null,
    }));

    if (!sanitizedImages.some((img) => img.is_primary)) {
      sanitizedImages[0].is_primary = true;
    }

    const primaryUrl =
      sanitizedImages.find((img) => img.is_primary)?.image_url || sanitizedImages[0].image_url;

    const payload = {
      name: formData.name.trim(),
      category_id: Number(formData.category_id),
      subcategory_id: formData.subcategory_id ? Number(formData.subcategory_id) : null,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      brand: formData.brand || undefined,
      price: Number(formData.price),
      compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
      cost_price: formData.cost_price ? Number(formData.cost_price) : null,
      stock_quantity: Number(formData.stock_quantity || 0),
      short_description: formData.short_description.trim() || null,
      description: formData.description.trim() || "High performance studio hardware.",
      images: sanitizedImages,
      image_url: primaryUrl,
      is_featured: formData.is_featured,
      is_new_arrival: formData.is_new_arrival,
      is_best_seller: formData.is_best_seller,
      is_active: formData.is_active,
      options: formData.options && formData.options.length > 0 ? formData.options : null,
      variants: formData.variants.map((v) => ({
        id: v.id,
        name: v.name,
        attributes: v.attributes || null,
        size: v.size || (v.attributes?.Size || v.attributes?.size || null),
        color_name: v.color_name || (v.attributes?.Color || v.attributes?.color || (v.color_hex ? v.name : null)),
        color_hex: v.color_hex || null,
        stock_quantity: Number(v.stock_quantity || 0),
        price: v.price !== null && v.price !== undefined && !isNaN(Number(v.price)) ? Number(v.price) : null,
        price_modifier: Number(v.price_modifier || 0),
        cost_price: v.cost_price ? Number(v.cost_price) : null,
        barcode: v.barcode || null,
        image_id: v.image_id ? Number(v.image_id) : null,
        is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
      })),
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
    };

    try {
      if (editingProduct) {
        const res = await adminApi.updateProduct(editingProduct.id, payload);
        toast.success(`Updated '${res.product.name}'`);
        sessionUploadedUrlsRef.current = [];
        onProductSaved(res.product, false);
      } else {
        const res = await adminApi.createProduct(payload);
        toast.success(`Created '${res.product.name}'`);
        sessionUploadedUrlsRef.current = [];
        onProductSaved(res.product, true);
      }
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: ProductEditorTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: "general", label: "General", icon: Package },
    { id: "pricing", label: "Pricing & Stock", icon: DollarSign },
    {
      id: "media",
      label: "Media",
      icon: ImageIcon,
      badge: formData.images.length > 0 ? `${formData.images.length}/5` : undefined,
    },
    {
      id: "variants",
      label: "Variants",
      icon: Layers,
      badge: formData.variants.length > 0 ? formData.variants.length : undefined,
    },
    { id: "seo", label: "SEO", icon: Sparkles },
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.08] bg-[#0c101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-white tracking-wide truncate">
                  {editingProduct ? "Edit Product" : "Create New Product"}
                </h3>
                {editingProduct && (
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                    #{editingProduct.id}
                  </span>
                )}
              </div>
              {editingProduct && (
                <p className="text-[11px] text-slate-400 truncate max-w-[400px]">
                  {editingProduct.name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-6 border-b border-white/[0.06] bg-[#0e1220] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-[#A78BFA] text-white font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-[#A78BFA]" : "text-slate-400"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "general" && (
            <ProductGeneralTab
              formData={formData}
              onChange={updateFormField}
              categories={categories}
              brands={brands}
              onOpenQuickCategory={() => setIsQuickCategoryOpen(true)}
              onOpenQuickBrand={() => setIsQuickBrandOpen(true)}
              editingProduct={editingProduct}
            />
          )}

          {activeTab === "pricing" && (
            <ProductPricingTab
              formData={formData}
              onChange={updateFormField}
            />
          )}

          {activeTab === "media" && (
            <ProductMediaTab
              images={formData.images}
              onImagesChange={(imgs) => updateFormField("images", imgs)}
              productName={formData.name}
              availableColors={availableColors}
              onImageUploaded={(url) => {
                sessionUploadedUrlsRef.current.push(url);
              }}
              onImageDeleted={(img) => {
                sessionUploadedUrlsRef.current = sessionUploadedUrlsRef.current.filter((u) => u !== img.image_url);
              }}
            />
          )}

          {activeTab === "variants" && (
            <ProductVariantsTab
              variants={formData.variants}
              onVariantsChange={(vars) => updateFormField("variants", vars)}
              onStockSync={(stockSum) => updateFormField("stock_quantity", stockSum.toString())}
              basePrice={Number(formData.price) || 0}
              options={formData.options}
              onOptionsChange={(opts) => updateFormField("options", opts)}
              availableImages={formData.images}
            />
          )}

          {activeTab === "seo" && (
            <ProductSeoTab
              formData={formData}
              onChange={updateFormField}
              slug={editingProduct?.slug}
            />
          )}
        </div>

        {/* Persistent Sticky Footer Actions */}
        <div className="h-14 px-6 border-t border-white/[0.08] bg-[#0c101d] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer px-3 py-1.5 rounded-md hover:bg-white/5"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* QUICK CATEGORY MODAL */}
      {isQuickCategoryOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Category</h3>
              <button
                type="button"
                onClick={() => setIsQuickCategoryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickCategory} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="e.g. Ergonomics & Comfort"
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Description</label>
                <textarea
                  rows={2}
                  value={quickCategoryDescription}
                  onChange={(e) => setQuickCategoryDescription(e.target.value)}
                  placeholder="Optional category description..."
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCategorySaving}
                  className="px-4 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {quickCategorySaving ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK BRAND MODAL */}
      {isQuickBrandOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Brand</h3>
              <button
                type="button"
                onClick={() => setIsQuickBrandOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickBrand} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  placeholder="e.g. Apex Hardware"
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Website</label>
                <input
                  type="url"
                  value={quickBrandWebsite}
                  onChange={(e) => setQuickBrandWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Description</label>
                <textarea
                  rows={2}
                  value={quickBrandDescription}
                  onChange={(e) => setQuickBrandDescription(e.target.value)}
                  placeholder="Optional brand description..."
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#A78BFA]/50 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsQuickBrandOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickBrandSaving}
                  className="px-4 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {quickBrandSaving ? "Creating..." : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ProductEditor(props: ProductEditorProps) {
  const { isOpen, onClose, editingProduct } = props;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[720px] md:w-[840px] lg:w-[940px] sm:!max-w-[940px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
      >
        {isOpen && (
          <ProductEditorInner
            key={editingProduct ? `edit-${editingProduct.id}` : "create-new"}
            {...props}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
