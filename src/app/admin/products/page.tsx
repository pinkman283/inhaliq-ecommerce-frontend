"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Layers,
  Package,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Tag,
  Star,
  RotateCcw,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  Building2,
  FolderTree,
  Palette,
  CheckCircle2,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Brand, Category, Product, ProductImage } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminPageHeader, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { optimizeImageForUpload } from "@/lib/imageOptimizer";


interface ProductFormImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
  alt_text?: string;
  source?: "upload" | "url";
}

interface ProductFormVariant {
  id?: number;
  name: string;
  size?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  stock_quantity: number;
  price_modifier?: number;
  cost_price?: number | null;
  barcode?: string | null;
}

const COLOR_PRESETS = [
  { name: "Stealth Black", hex: "#0f172a" },
  { name: "Pure White", hex: "#f8fafc" },
  { name: "Space Gray", hex: "#64748b" },
  { name: "Cyber Cyan", hex: "#06b6d4" },
  { name: "Crimson Red", hex: "#ef4444" },
  { name: "Olive Green", hex: "#3f6212" },
  { name: "Royal Gold", hex: "#d97706" },
  { name: "Deep Navy", hex: "#1e3a8a" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Catalog Overview Stats
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [catalogStats, setCatalogStats] = useState<{
    total_products: number;
    total_warehouse_units: number;
    total_categories: number;
    low_stock_count: number;
    out_of_stock_count: number;
  } | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // View Product Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewingActiveImage, setViewingActiveImage] = useState<string>("");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Quick-Add Category Modal State
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategoryIcon, setQuickCategoryIcon] = useState("Sparkles");
  const [quickCategorySaving, setQuickCategorySaving] = useState(false);

  // Quick-Add Brand Modal State
  const [isQuickBrandModalOpen, setIsQuickBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");
  const [quickBrandWebsite, setQuickBrandWebsite] = useState("");
  const [quickBrandDescription, setQuickBrandDescription] = useState("");
  const [quickBrandSaving, setQuickBrandSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("1");
  const [subcategory, setSubcategory] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brand, setBrand] = useState("AETHER Studio");
  const [price, setPrice] = useState("0");
  const [comparePrice, setComparePrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [formImages, setFormImages] = useState<ProductFormImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product Options & Variants State
  const [formVariants, setFormVariants] = useState<ProductFormVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantSize, setNewVariantSize] = useState("");
  const [newVariantColorHex, setNewVariantColorHex] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("20");
  const [newVariantPriceMod, setNewVariantPriceMod] = useState("0");
  const [newVariantCostPrice, setNewVariantCostPrice] = useState("");
  const [newVariantBarcode, setNewVariantBarcode] = useState("");

  // Delete Confirm Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (targetPage = currentPage, targetPerPage = perPage) => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        adminApi.getProducts({
          search: search.trim() || undefined,
          category_id: categoryId || undefined,
          stock_status: stockFilter !== "all" ? stockFilter : undefined,
          page: targetPage,
          per_page: targetPerPage,
        }),
        adminApi.getCategories(),
        adminApi.getBrands(),
      ]);

      setProducts(prodRes.data || []);
      setTotalItems(prodRes.total || 0);
      setTotalPages(prodRes.last_page || 1);
      if (prodRes.stats) {
        setCatalogStats(prodRes.stats);
      }
      setCategories(catRes || []);
      setBrands(brandRes || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage, perPage);
  }, [categoryId, stockFilter, currentPage, perPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      loadData(1, perPage);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryId("");
    setStockFilter("all");
    setBadgeFilter("all");
    setSortBy("latest");
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      loadData(1, perPage);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setCategory(categories[0]?.id?.toString() || "1");
    setSubcategory("");
    setBrandId(brands[0]?.id?.toString() || "");
    setBrand(brands[0]?.name || "AETHER Studio");
    setPrice("0");
    setComparePrice("0");
    setStock("0");
    setDescription("");
    setMetaTitle("");
    setMetaDescription("");
    setFormImages([]);
    setNewImageUrl("");
    setImageInputMode("upload");
    setIsFeatured(false);
    setIsNewArrival(true);
    setIsBestSeller(false);
    setFormVariants([]);
    setNewVariantName("");
    setNewVariantSize("");
    setNewVariantColorHex("");
    setNewVariantStock("20");
    setNewVariantPriceMod("0");
    setNewVariantCostPrice("");
    setNewVariantBarcode("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category?.id?.toString() || product.category_id?.toString() || "1");
    setSubcategory(product.subcategory_id?.toString() || "");
    setBrandId(product.brand_id?.toString() || (brands.find((b) => b.name.toLowerCase() === (product.brand || "").toLowerCase())?.id?.toString() || ""));
    setBrand(product.brand || "AETHER Studio");
    setPrice(product.price.toString());
    setComparePrice(product.compare_at_price ? product.compare_at_price.toString() : "0");
    setStock(product.stock_quantity.toString());
    setDescription(product.description || "");
    setMetaTitle(product.meta_title || "");
    setMetaDescription(product.meta_description || "");

    let initialImages: ProductFormImage[] = [];
    if (product.images && product.images.length > 0) {
      initialImages = product.images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
        alt_text: img.alt_text || undefined,
        source: "url",
      }));
    } else if (product.primary_image) {
      initialImages = [
        {
          id: product.primary_image.id,
          image_url: product.primary_image.image_url,
          is_primary: true,
          alt_text: product.primary_image.alt_text || undefined,
          source: "url",
        },
      ];
    }
    setFormImages(initialImages);
    setNewImageUrl("");
    setImageInputMode("upload");

    setIsFeatured(Boolean(product.is_featured));
    setIsNewArrival(Boolean(product.is_new_arrival));
    setIsBestSeller(Boolean(product.is_best_seller));

    if (product.variants && product.variants.length > 0) {
      setFormVariants(
        product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          size: v.size || null,
          color_name: v.color_name || (v.color_hex ? v.name : null),
          color_hex: v.color_hex || null,
          stock_quantity: v.stock_quantity ?? 0,
          price_modifier: Number(v.price_modifier || 0),
          cost_price: v.cost_price ? Number(v.cost_price) : null,
          barcode: v.barcode || null,
        }))
      );
    } else {
      setFormVariants([]);
    }

    setNewVariantName("");
    setNewVariantSize("");
    setNewVariantColorHex("");
    setNewVariantStock("20");
    setNewVariantPriceMod("0");
    setNewVariantCostPrice("");
    setNewVariantBarcode("");

    setIsModalOpen(true);
  };

  const handleOpenView = (product: Product) => {
    setViewingProduct(product);
    const primary = product.primary_image?.image_url || product.images?.[0]?.image_url || "";
    setViewingActiveImage(primary);
  };

  const handleAddVariant = () => {
    const trimmedName = newVariantName.trim();
    const trimmedSize = newVariantSize.trim();
    if (!trimmedName && !trimmedSize && !newVariantColorHex) {
      toast.error("Please enter an option name, size, or color.");
      return;
    }

    const stockQty = Math.max(0, parseInt(newVariantStock || "0", 10));
    const priceMod = parseFloat(newVariantPriceMod || "0") || 0;
    const costPrice = newVariantCostPrice ? parseFloat(newVariantCostPrice) : null;
    const barcode = newVariantBarcode.trim() || null;

    const displayName = trimmedName || (trimmedSize ? `Size ${trimmedSize}` : (newVariantColorHex ? `Color ${newVariantColorHex}` : "Option"));

    const newVar: ProductFormVariant = {
      name: displayName,
      size: trimmedSize || null,
      color_name: trimmedName || (newVariantColorHex ? displayName : null),
      color_hex: newVariantColorHex || null,
      stock_quantity: stockQty,
      price_modifier: priceMod,
      cost_price: costPrice,
      barcode: barcode,
    };

    const nextVariants = [...formVariants, newVar];
    setFormVariants(nextVariants);

    const sumStock = nextVariants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
    setStock(sumStock.toString());

    setNewVariantName("");
    setNewVariantSize("");
    setNewVariantColorHex("");
    setNewVariantStock("20");
    setNewVariantPriceMod("0");
    setNewVariantCostPrice("");
    setNewVariantBarcode("");
    toast.success(`Option '${newVar.name}' added.`);
  };

  const handleRemoveVariant = (index: number) => {
    const updated = formVariants.filter((_, idx) => idx !== index);
    setFormVariants(updated);
    if (updated.length > 0) {
      const sumStock = updated.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
      setStock(sumStock.toString());
    }
    toast.info("Option removed.");
  };

  const handleUpdateVariantStock = (index: number, stockVal: string) => {
    const qty = Math.max(0, parseInt(stockVal || "0", 10));
    const updated = formVariants.map((v, idx) => (idx === index ? { ...v, stock_quantity: qty } : v));
    setFormVariants(updated);
    const sumStock = updated.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
    setStock(sumStock.toString());
  };
  const handleAddQuickSize = (sz: string) => {
    if (formVariants.some((v) => v.size?.toLowerCase() === sz.toLowerCase())) {
      toast.info(`Size ${sz} is already in the list.`);
      return;
    }
    const newVar: ProductFormVariant = {
      name: `Size ${sz}`,
      size: sz,
      color_name: null,
      color_hex: null,
      stock_quantity: 20,
      price_modifier: 0,
    };
    const next = [...formVariants, newVar];
    setFormVariants(next);
    const sumStock = next.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
    setStock(sumStock.toString());
    toast.success(`Added Size ${sz}`);
  };

  const handleAddQuickColor = (preset: { name: string; hex: string }) => {
    if (formVariants.some((v) => v.color_name?.toLowerCase() === preset.name.toLowerCase() || v.name.toLowerCase() === preset.name.toLowerCase())) {
      toast.info(`${preset.name} is already in the list.`);
      return;
    }
    const newVar: ProductFormVariant = {
      name: preset.name,
      size: null,
      color_name: preset.name,
      color_hex: preset.hex,
      stock_quantity: 20,
      price_modifier: 0,
    };
    const next = [...formVariants, newVar];
    setFormVariants(next);
    const sumStock = next.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
    setStock(sumStock.toString());
    toast.success(`Added ${preset.name}`);
  };

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
        icon: quickCategoryIcon || "Sparkles",
        is_featured: true,
      });
      const newCat = res.category;
      setCategories((prev) => [...prev, newCat]);
      setCategory(newCat.id.toString());
      setIsQuickCategoryModalOpen(false);
      setQuickCategoryName("");
      setQuickCategoryDescription("");
      toast.success(`Category '${newCat.name}' created.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category.");
    } finally {
      setQuickCategorySaving(false);
    }
  };

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
      setBrands((prev) => [...prev, newBrand]);
      setBrand(newBrand.name);
      setIsQuickBrandModalOpen(false);
      setQuickBrandName("");
      setQuickBrandWebsite("");
      setQuickBrandDescription("");
      toast.success(`Brand '${newBrand.name}' created.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create brand.");
    } finally {
      setQuickBrandSaving(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) {
      toast.error("Please enter an image URL.");
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    if (formImages.length >= 5) {
      toast.error("Maximum 5 images allowed.");
      return;
    }
    const isFirst = formImages.length === 0;
    setFormImages((prev) => [
      ...prev,
      {
        image_url: url,
        is_primary: isFirst,
        source: "url",
        alt_text: name || "Product Image",
      },
    ]);
    setNewImageUrl("");
    toast.success("Image added.");
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - formImages.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploadingImage(true);
    try {
      const uploadedImages: ProductFormImage[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) continue;
        const fileToUpload = await optimizeImageForUpload(file, {
          maxDimension: 1600,
          maxSizeBytes: 1.5 * 1024 * 1024,
          quality: 0.88,
        });
        const res = await adminApi.uploadProductImage(fileToUpload);
        uploadedImages.push({
          image_url: res.image_url,
          is_primary: formImages.length === 0 && uploadedImages.length === 0,
          source: "upload",
          alt_text: file.name,
        });
      }

      if (uploadedImages.length > 0) {
        setFormImages((prev) => {
          const next = [...prev, ...uploadedImages];
          if (!next.some((img) => img.is_primary)) {
            next[0].is_primary = true;
          }
          return next;
        });
        toast.success(`Uploaded ${uploadedImages.length} image(s).`);
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors?.image?.[0] ||
        err.response?.data?.message ||
        "Failed to upload image.";
      toast.error(errMsg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = formImages.filter((_, idx) => idx !== index);
    if (nextImages.length > 0 && !nextImages.some((img) => img.is_primary)) {
      nextImages[0].is_primary = true;
    }
    setFormImages(nextImages);
  };

  const handleSetPrimaryImage = (index: number) => {
    const nextImages = formImages.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    setFormImages(nextImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (formImages.length === 0) {
      toast.error("Please add at least 1 image.");
      return;
    }

    setSaving(true);
    const sanitizedImages = formImages.map((img, idx) => ({
      image_url: img.image_url,
      is_primary: img.is_primary,
      display_order: idx,
      alt_text: img.alt_text || name,
    }));
    if (!sanitizedImages.some((img) => img.is_primary)) {
      sanitizedImages[0].is_primary = true;
    }
    const primaryUrl = sanitizedImages.find((img) => img.is_primary)?.image_url || sanitizedImages[0].image_url;

    const payload = {
      name,
      category_id: Number(category),
      subcategory_id: subcategory ? Number(subcategory) : null,
      brand_id: brandId ? Number(brandId) : null,
      brand: brand || undefined,
      price: Number(price),
      compare_at_price: comparePrice ? Number(comparePrice) : null,
      stock_quantity: Number(stock),
      description: description || "High performance studio hardware.",
      images: sanitizedImages,
      image_url: primaryUrl,
      is_featured: isFeatured,
      is_new_arrival: isNewArrival,
      is_best_seller: isBestSeller,
      variants: formVariants.map((v) => ({
        name: v.name,
        size: v.size || null,
        color_name: v.color_name || (v.color_hex ? v.name : null),
        color_hex: v.color_hex || null,
        stock_quantity: Number(v.stock_quantity || 0),
        price_modifier: Number(v.price_modifier || 0),
        cost_price: v.cost_price ? Number(v.cost_price) : null,
        barcode: v.barcode || null,
      })),
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
    };

    try {
      if (editingProduct) {
        const res = await adminApi.updateProduct(editingProduct.id, payload);
        setProducts(products.map((p) => (p.id === editingProduct.id ? res.product : p)));
        toast.success(`Updated '${res.product.name}'`);
      } else {
        const res = await adminApi.createProduct(payload);
        setProducts([res.product, ...products]);
        toast.success(`Created '${res.product.name}'`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);

    try {
      await adminApi.deleteProduct(deletingProduct.id);
      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProduct.id));
      toast.success(`Product '${deletingProduct.name}' deleted.`);
      setDeletingProduct(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (displayedProducts.length > 0 && selectedIds.length === displayedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteProducts(selectedIds);
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success(res.message || `Deleted ${selectedIds.length} product(s).`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected products.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const displayedProducts = products
    .filter((p) => {
      if (badgeFilter === "featured") return p.is_featured;
      if (badgeFilter === "new_arrival") return p.is_new_arrival;
      if (badgeFilter === "best_seller") return p.is_best_seller;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
      if (sortBy === "stock_asc") return Number(a.stock_quantity) - Number(b.stock_quantity);
      if (sortBy === "stock_desc") return Number(b.stock_quantity) - Number(a.stock_quantity);
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Unified Header */}
      <AdminPageHeader
        title="Products"
        description="Catalog inventory, variants, and pricing"
        badge={`${totalItems > 0 ? totalItems : displayedProducts.length} items`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Products" },
        ]}
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        }
      />

      {/* Catalog Overview KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Catalog Products */}
        <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Catalog Products</span>
            <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">
              {(catalogStats?.total_products ?? totalItems).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Unique catalog items</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Warehouse Stock Units (Resolves the 971 FIFO ledger question) */}
        <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Warehouse Stock</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">
              {(catalogStats?.total_warehouse_units ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Total physical units on hand</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Categories */}
        <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Categories</span>
            <span className="text-lg sm:text-xl font-bold text-cyan-400 mt-0.5 block">
              {(catalogStats?.total_categories ?? categories.length).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Taxonomy departments</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Stock Attention Alerts */}
        <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Stock Attention</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-rose-400">
                {catalogStats?.out_of_stock_count ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">out</span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-lg sm:text-xl font-bold text-amber-400">
                {catalogStats?.low_stock_count ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">low</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Requires replenishment</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex flex-col lg:flex-row items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, name, brand..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </form>


        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <AdminDropdown
            value={categoryId}
            onChange={(val) => {
              setCategoryId(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
            ]}
          />

          <AdminDropdown
            value={stockFilter}
            onChange={(val) => {
              setStockFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "all", label: "All Stock Levels" },
              { value: "in_stock", label: "In Stock (>0)" },
              { value: "low_stock", label: "Low Stock (<=10)" },
              { value: "out_of_stock", label: "Out of Stock (0)" },
            ]}
          />

          <AdminDropdown
            value={badgeFilter}
            onChange={(val) => setBadgeFilter(val)}
            options={[
              { value: "all", label: "All Badges" },
              { value: "featured", label: "Featured" },
              { value: "new_arrival", label: "New Arrivals" },
              { value: "best_seller", label: "Best Sellers" },
            ]}
          />

          <AdminDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: "latest", label: "Sort: Latest" },
              { value: "price_asc", label: "Price: Low-High" },
              { value: "price_desc", label: "Price: High-Low" },
              { value: "stock_asc", label: "Stock: Low-High" },
              { value: "stock_desc", label: "Stock: High-Low" },
              { value: "name_asc", label: "Name: A-Z" },
            ]}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={displayedProducts.length}
        onClearSelection={() => setSelectedIds([])}
        onConfirmDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        itemName="product"
      />

      {/* Products Table Card */}
      <ScrollableTableCard className="bg-[#0f121b] border-white/[0.08]">
        <table className="w-full text-left text-xs text-slate-300 min-w-[960px]">
          <thead className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3.5 pl-6 pr-3 w-14 text-left">
                <AdminCheckbox
                  checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < displayedProducts.length}
                  onChange={handleToggleSelectAll}
                  title="Select all products"
                />
              </th>
              <th className="p-3 text-left w-[30%] min-w-[220px]">Product</th>
              <th className="p-3 text-left w-[18%] min-w-[150px]">Category</th>
              <th className="p-3 text-left w-[14%] min-w-[110px]">Price</th>
              <th className="p-3 text-left w-[12%] min-w-[100px]">Stock</th>
              <th className="p-3 text-left w-[12%] min-w-[110px]">Flags</th>
              <th className="p-3 text-center min-w-[120px]">Actions</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    <span>Loading products catalog...</span>
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminEmptyState
                      title="No products found"
                      description="No catalog items matched your current filters. Try resetting search."
                      action={
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const img = product.primary_image?.image_url || product.images?.[0]?.image_url;
                  const hasVariants = product.variants && product.variants.length > 0;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="py-3.5 pl-6 pr-3 text-left" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(product.id)}
                          title={`Select ${product.name}`}
                        />
                      </td>

                      {/* Product details */}
                      <td className="p-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {img ? (
                            <img
                              src={img}
                              alt={product.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px] sm:max-w-[240px]">
                            <span
                              className="font-bold text-white block truncate hover:text-amber-400 transition-colors"
                              title={product.name}
                            >
                              {product.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {product.brand} {product.sku ? `• SKU: ${product.sku}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-left whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-medium text-slate-200 whitespace-nowrap"
                          title={product.category?.name || "Hardware"}
                        >
                          {product.category?.name || "Hardware"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3 text-left whitespace-nowrap">
                        <div className="font-mono">
                          <span className="font-bold text-white block">{formatPrice(product.price)}</span>
                          {product.compare_at_price && (
                            <span className="text-[10px] text-slate-500 line-through block">
                              {formatPrice(product.compare_at_price)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-3 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.stock_quantity > 10
                                ? "bg-emerald-400"
                                : product.stock_quantity > 0
                                ? "bg-amber-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span className="font-mono font-bold text-white">{product.stock_quantity}</span>
                          {hasVariants && (
                            <span className="text-[9.5px] text-cyan-400 font-medium">
                              ({product.variants?.length || 0} vars)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Flags */}
                      <td className="p-3 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {product.is_featured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9.5px] font-bold border border-amber-500/20">
                              Featured
                            </span>
                          )}
                          {product.is_new_arrival && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[9.5px] font-bold border border-cyan-500/20">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenView(product)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="View product preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </ScrollableTableCard>

      {/* Pagination & Per-Page Controls */}
      <div className="p-3 rounded-xl bg-[#0f121b] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing <span className="font-semibold text-white">{totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(currentPage * perPage, totalItems)}</span> of{" "}
            <span className="font-semibold text-white">{totalItems}</span> products
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.08]">
            <span className="text-slate-500 text-[11px]">Per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={25} className="bg-[#0f121b]">25</option>
              <option value={50} className="bg-[#0f121b]">50</option>
              <option value={100} className="bg-[#0f121b]">100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="px-2.5 py-1 text-[11px] text-slate-400 font-medium">
            Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
            <span className="text-white font-semibold">{Math.max(1, totalPages)}</span>
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || loading}
            className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
            title="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT DRAWER */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[580px] md:w-[620px] sm:!max-w-[620px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            
            {/* Compact Sleek Header */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <h3 className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingProduct ? "Edit Product" : "New Product"}
                </h3>
                {editingProduct && (
                  <>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                      #{editingProduct.id}
                    </span>
                    <span className="text-slate-600 text-xs shrink-0">·</span>
                    <span className="text-xs text-slate-400 truncate max-w-[280px]">
                      {editingProduct.name}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body - Clean & Simple Flow */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    Product Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name || ""}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AeroPack X-Pac 24L Modular Travel Pack"
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 focus:bg-white/[0.05] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                  />
                </div>

                {/* 3-Tier Classification: Category -> Subcategory -> Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Tier 1: Root Category */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">Category (Root)</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickCategoryModalOpen(true)}
                        className="text-[11px] font-medium text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSubcategory("");
                        }}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
                      >
                        {categories
                          .filter((c) => !c.parent_id)
                          .map((c) => (
                            <option key={c.id} value={c.id.toString()} className="bg-[#0e121e]">
                              {c.name}
                            </option>
                          ))}
                        {categories.filter((c) => !c.parent_id).length === 0 &&
                          categories.map((c) => (
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

                  {/* Tier 2: Subcategory (Child) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">Subcategory</label>
                      <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                    </div>
                    <div className="relative">
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
                      >
                        <option value="" className="bg-[#0e121e]">-- No Subcategory --</option>
                        {categories
                          .filter((c) => c.parent_id === Number(category))
                          .map((sub) => (
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

                  {/* Tier 3: Brand */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">Brand</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickBrandModalOpen(true)}
                        className="text-[11px] font-medium text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={brandId || brand}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matchedBrand = brands.find((b) => b.id.toString() === val || b.name === val);
                          if (matchedBrand) {
                            setBrandId(matchedBrand.id.toString());
                            setBrand(matchedBrand.name);
                          } else {
                            setBrand(val);
                          }
                        }}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2.5 text-xs text-white appearance-none transition-all outline-none cursor-pointer pr-9"
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


                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Description</label>
                  <textarea
                    rows={3}
                    value={description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed specifications, features, dimensions, materials..."
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y leading-relaxed"
                  />
                </div>

                {/* SEO Configuration */}
                <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-4">
                  <h4 className="text-[13px] font-medium text-white flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    Search Engine Optimization
                  </h4>
                  <p className="text-xs text-slate-400">
                    Leave blank to automatically use the product name and description as fallbacks.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Meta Title</label>
                    <input
                      type="text"
                      value={metaTitle || ""}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Custom SEO title..."
                      className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Meta Description</label>
                    <textarea
                      rows={2}
                      value={metaDescription || ""}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Custom SEO description..."
                      className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Stock */}
              <div className="pt-6 border-t border-white/[0.06] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white tracking-wide">Pricing & Inventory</h4>
                  <span className="text-[11px] text-slate-500 font-mono">USD ($)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">
                      Price <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price || "0"}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white font-mono transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Compare At</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={comparePrice || "0"}
                        onChange={(e) => setComparePrice(e.target.value)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white font-mono transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">
                      Stock Quantity <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={stock || "0"}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Media Gallery */}
              <div className="pt-6 border-t border-white/[0.06] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white tracking-wide">Product Images</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formImages.length}/5 uploaded (first is primary)</p>
                    <div className="mt-1.5">
                      <ImageUploadGuidance slotKey="admin_product_primary" layout="row" />
                    </div>
                  </div>

                  {/* Segmented Switch */}
                  <div className="p-0.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                        imageInputMode === "upload"
                          ? "bg-white/15 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                        imageInputMode === "url"
                          ? "bg-white/15 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {/* Hidden native input */}
                <input
                  key="file-upload-input"
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleDeviceUpload}
                  disabled={isUploadingImage || formImages.length >= 5}
                  className="hidden"
                />

                {/* Upload Dropzone / URL Input */}
                {imageInputMode === "upload" ? (
                  <div
                    key="image-upload-mode"
                    onClick={() => {
                      if (!isUploadingImage && formImages.length < 5) {
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                    }}
                    className={`border border-dashed rounded-xl py-6 px-4 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      formImages.length >= 5
                        ? "opacity-40 border-white/10 cursor-not-allowed bg-white/[0.01]"
                        : "border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer group"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:scale-105 transition">
                      {isUploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-200" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200">
                        {isUploadingImage
                          ? "Uploading images..."
                          : formImages.length >= 5
                          ? "Maximum 5 images reached"
                          : "Click to browse or drag images here"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div key="image-url-mode" className="flex items-center gap-2">
                    <input
                      key="url-image-input"
                      type="url"
                      value={newImageUrl || ""}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Thumbnails */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border ${
                          img.is_primary
                            ? "border-amber-400/60 ring-1 ring-amber-400/30"
                            : "border-white/10"
                        } bg-black/40 group`}
                      >
                        <img src={img.image_url} alt="preview" className="w-full h-full object-cover" />
                        
                        {img.is_primary && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-amber-300 text-[9px] font-semibold border border-amber-400/30 shadow-xs">
                            Primary
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium transition cursor-pointer"
                              title="Set Primary"
                            >
                              Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-500 text-white transition cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Alt Text Input */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="text"
                            value={img.alt_text || ""}
                            onChange={(e) => {
                              const newImages = [...formImages];
                              newImages[idx].alt_text = e.target.value;
                              setFormImages(newImages);
                            }}
                            placeholder="Alt text..."
                            className="w-full bg-white/10 hover:bg-white/20 focus:bg-white/20 rounded px-1.5 py-1 text-[10px] text-white placeholder:text-white/50 outline-none"
                            title="Image Alt Text (SEO)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Product Options & Variants (Optional) */}
              <div className="pt-6 border-t border-white/[0.06] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white tracking-wide">
                      Options & Variants ({formVariants.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Optional: add sizes, colors, or editions if required. Leave blank for standalone products.
                    </p>
                  </div>
                  {formVariants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormVariants([])}
                      className="text-[10.5px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Minimal Add Option Row */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newVariantName || ""}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      placeholder="Option name (e.g. Midnight Black)"
                      className="sm:col-span-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                    />
                    <input
                      type="text"
                      value={newVariantSize || ""}
                      onChange={(e) => setNewVariantSize(e.target.value)}
                      placeholder="Size (e.g. S, M, L)"
                      className="sm:col-span-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
                    />
                    <div className="sm:col-span-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl px-2.5 py-1.5 transition-all">
                      <label className="relative flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-xs"
                          style={{ backgroundColor: newVariantColorHex || "transparent" }}
                        />
                        <span className="text-[10.5px] text-slate-400 truncate">
                          {newVariantColorHex || "Color"}
                        </span>
                        <input
                          type="color"
                          value={newVariantColorHex || "#000000"}
                          onChange={(e) => setNewVariantColorHex(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      {newVariantColorHex && (
                        <button
                          type="button"
                          onClick={() => setNewVariantColorHex("")}
                          className="text-[10px] text-slate-500 hover:text-rose-400 ml-1"
                          title="Remove color"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="number"
                      value={newVariantStock || ""}
                      onChange={(e) => setNewVariantStock(e.target.value)}
                      placeholder="Stock"
                      className="sm:col-span-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 transition-all outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={newVariantPriceMod || ""}
                      onChange={(e) => setNewVariantPriceMod(e.target.value)}
                      placeholder="Price Mod (+৳)"
                      className="sm:col-span-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 transition-all outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={newVariantCostPrice || ""}
                      onChange={(e) => setNewVariantCostPrice(e.target.value)}
                      placeholder="Cost Price (৳)"
                      className="sm:col-span-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 transition-all outline-none"
                    />
                    <input
                      type="text"
                      value={newVariantBarcode || ""}
                      onChange={(e) => setNewVariantBarcode(e.target.value)}
                      placeholder="Barcode / UPC"
                      className="sm:col-span-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="sm:col-span-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Sizes & Colors */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-500">Quick add:</span>
                  {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleAddQuickSize(sz)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[10.5px] text-slate-300 hover:text-white transition cursor-pointer font-medium"
                    >
                      +{sz}
                    </button>
                  ))}
                  <span className="text-slate-600">|</span>
                  {COLOR_PRESETS.slice(0, 5).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleAddQuickColor(p)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[10.5px] text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.hex }} />
                      <span>+{p.name}</span>
                    </button>
                  ))}
                </div>

                {/* List of configured variants */}
                {formVariants.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {formVariants.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          {v.color_hex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: v.color_hex }}
                            />
                          )}
                          <span className="font-medium text-white truncate">{v.name}</span>
                          {v.size && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                              {v.size}
                            </span>
                          )}
                          {v.price_modifier && v.price_modifier > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              (+৳{v.price_modifier.toFixed(2)})
                            </span>
                          ) : null}
                          {v.cost_price && (
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Cost: ৳{Number(v.cost_price).toFixed(2)}
                            </span>
                          )}
                          {v.barcode && (
                            <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                              BC: {v.barcode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400">Stock:</span>
                          <input
                            type="number"
                            min="0"
                            value={v.stock_quantity ?? 0}
                            onChange={(e) => handleUpdateVariantStock(idx, e.target.value)}
                            className="w-14 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-amber-400/50"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">
                    No options configured. This product will be sold as a single standard item.
                  </p>
                )}
              </div>

              {/* Section 5: Badges & Visibility */}
              <div className="pt-6 border-t border-white/[0.06] space-y-3.5">
                <h4 className="text-xs font-semibold text-white tracking-wide">Visibility & Badges</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">Featured</p>
                      <p className="text-[10px] text-slate-400">Hero banner & curated</p>
                    </div>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">New Arrival</p>
                      <p className="text-[10px] text-slate-400">Highlight badge</p>
                    </div>
                    <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">Best Seller</p>
                      <p className="text-[10px] text-slate-400">Popular collection</p>
                    </div>
                    <Switch checked={isBestSeller} onCheckedChange={setIsBestSeller} size="sm" />
                  </div>
                </div>
              </div>

            </div>

            {/* Compact Sleek Footer */}
            <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer px-1 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-8 px-4 rounded-lg bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}</span>
              </button>
            </div>

          </form>
        </SheetContent>
      </Sheet>

      {/* QUICK CATEGORY MODAL */}
      {isQuickCategoryModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Category</h3>
              <button
                type="button"
                onClick={() => setIsQuickCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickCategory} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Category Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="e.g. Ergonomics & Comfort"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Description</label>
                <input
                  type="text"
                  value={quickCategoryDescription || ""}
                  onChange={(e) => setQuickCategoryDescription(e.target.value)}
                  placeholder="Short category summary"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCategorySaving}
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {quickCategorySaving ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK BRAND MODAL */}
      {isQuickBrandModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Create Brand</h3>
              <button
                type="button"
                onClick={() => setIsQuickBrandModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuickBrand} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Brand Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={quickBrandName || ""}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  placeholder="e.g. OrbitKey Labs"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Website (Optional)</label>
                <input
                  type="url"
                  value={quickBrandWebsite || ""}
                  onChange={(e) => setQuickBrandWebsite(e.target.value)}
                  placeholder="https://brand.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsQuickBrandModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickBrandSaving}
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {quickBrandSaving ? "Creating..." : "Save Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT PREVIEW MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0c101d] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white tracking-tight">{viewingProduct.name}</h3>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              {viewingActiveImage && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
                  <img src={viewingActiveImage} alt={viewingProduct.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex justify-between items-center py-1">
                <span className="font-mono text-base font-bold text-emerald-400">{formatPrice(viewingProduct.price)}</span>
                <span className="text-slate-400 text-xs">Stock: {viewingProduct.stock_quantity} units</span>
              </div>
              <p className="text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">{viewingProduct.description || "No description provided."}</p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-rose-500/20 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-white">Delete Product?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingProduct.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
