"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Download, Upload } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Brand, Category, Product, ProductCatalogStats } from "@/types";
import { AdminPageHeader } from "@/components/admin/ui";
import { toast } from "sonner";

// Modularized Phase 3A Components
import { ProductsKpiCards } from "@/components/admin/products/ProductsKpiCards";
import { ProductsFilterToolbar } from "@/components/admin/products/ProductsFilterToolbar";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { ProductBulkActions, BulkUpdatePayload } from "@/components/admin/products/ProductBulkActions";
import { ProductPagination } from "@/components/admin/products/ProductPagination";

// Modularized Phase 3B Tabbed Product Editor
import { ProductEditor } from "@/components/admin/products/ProductEditor";

// Modularized Phase 3C Product Preview Modal
import { ProductPreviewModal } from "@/components/admin/products/ProductPreviewModal";

// Modularized Phase 3I-C Product Import Modal
import { ProductImportModal } from "@/components/admin/products/ProductImportModal";

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
  const [catalogStats, setCatalogStats] = useState<ProductCatalogStats | null>(null);

  // Filters & Sorting (Preserved server-side filtering + sorting)
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "has_images" | "no_images">("all");
  const [sortBy, setSortBy] = useState("latest");

  // Tabbed Product Editor Drawer State (Phase 3B + 3H initial tab)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<"general" | "pricing" | "media" | "variants" | "seo">("general");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // View Product Modal State (Phase 3C)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Delete Confirm Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // CSV Export & Import State
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadData = async (targetPage = currentPage, targetPerPage = perPage) => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        adminApi.getProducts({
          search: search.trim() || undefined,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          stock_status: stockFilter !== "all" ? stockFilter : undefined,
          media_filter: mediaFilter !== "all" ? mediaFilter : undefined,
          sort: sortBy,
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

  // Re-fetch when category, brand, stock level, media, sorting, or pagination changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(currentPage, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, brandId, stockFilter, mediaFilter, sortBy, currentPage, perPage]);

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
    setBrandId("");
    setStockFilter("all");
    setBadgeFilter("all");
    setMediaFilter("all");
    setSortBy("latest");
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      loadData(1, perPage);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setEditorInitialTab("general");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditorInitialTab("general");
    setIsEditorOpen(true);
  };

  const handleOpenMedia = (product: Product) => {
    setEditingProduct(product);
    setEditorInitialTab("media");
    setIsEditorOpen(true);
  };

  const handleProductSaved = (savedProduct: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [savedProduct, ...prev]);
      setTotalItems((prev) => prev + 1);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      );
    }
    // Refresh stats in background
    loadData(currentPage, perPage);
  };

  const handleOpenView = (product: Product) => {
    setViewingProduct(product);
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
      loadData(currentPage, perPage);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to delete product.");
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
      loadData(currentPage, perPage);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to delete selected products.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkUpdate = async (payload: BulkUpdatePayload) => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await adminApi.bulkUpdateProducts({
        ...payload,
        product_ids: selectedIds,
      });
      setSelectedIds([]);
      toast.success(res.message);
      loadData(currentPage, perPage);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to update selected products.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { blob, filename } = await adminApi.exportProducts({
        search: search.trim() || undefined,
        category_id: categoryId || undefined,
        brand_id: brandId || undefined,
        stock_status: stockFilter !== "all" ? stockFilter : undefined,
        media_filter: mediaFilter !== "all" ? mediaFilter : undefined,
        badge: badgeFilter !== "all" ? badgeFilter : undefined,
        sort: sortBy,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Catalog exported successfully.");
    } catch (err: unknown) {
      const errorObj = err as { message?: string; response?: { data?: { message?: string } } };
      toast.error(errorObj.message || errorObj.response?.data?.message || "Failed to export catalog.");
    } finally {
      setIsExporting(false);
    }
  };

  // Badge Filter applied to current page items (preserves client-side capability)
  const displayedProducts = products.filter((p) => {
    if (badgeFilter === "featured") return p.is_featured;
    if (badgeFilter === "new_arrival") return p.is_new_arrival;
    if (badgeFilter === "best_seller") return p.is_best_seller;
    return true;
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
          { label: "Products", href: "/admin/products" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Export filtered catalog to CSV"
            >
              <Download className={`w-4 h-4 text-emerald-400 ${isExporting ? "animate-pulse" : ""}`} />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Import catalog from CSV"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <ProductsKpiCards
        stats={catalogStats}
        totalItems={totalItems}
        categoriesCount={categories.length}
      />

      {/* Filter and Search Toolbar */}
      <ProductsFilterToolbar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearch}
        categoryId={categoryId}
        onCategoryChange={(val) => {
          setCategoryId(val);
          setCurrentPage(1);
        }}
        categories={categories}
        brandId={brandId}
        onBrandChange={(val) => {
          setBrandId(val);
          setCurrentPage(1);
        }}
        brands={brands}
        stockFilter={stockFilter}
        onStockFilterChange={(val) => {
          setStockFilter(val);
          setCurrentPage(1);
        }}
        badgeFilter={badgeFilter}
        onBadgeFilterChange={setBadgeFilter}
        mediaFilter={mediaFilter}
        onMediaFilterChange={(val) => {
          setMediaFilter(val as "all" | "has_images" | "no_images");
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <ProductBulkActions
          selectedCount={selectedIds.length}
          totalCount={displayedProducts.length}
          categories={categories}
          brands={brands}
          onClearSelection={() => setSelectedIds([])}
          onConfirmDelete={handleBulkDelete}
          onBulkUpdate={handleBulkUpdate}
          isDeleting={isBulkDeleting}
          isUpdating={isBulkUpdating}
        />
      )}

      {/* Products Table Card */}
      <ProductsTable
        products={displayedProducts}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectRow={handleToggleSelectRow}
        onViewProduct={handleOpenView}
        onEditProduct={handleOpenEdit}
        onDeleteProduct={(p) => setDeletingProduct(p)}
        onOpenMedia={handleOpenMedia}
        onResetFilters={handleResetFilters}
      />

      {/* Pagination & Per-Page Controls */}
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />

      {/* TABBED PRODUCT CREATE / EDIT ARCHITECTURE (Phase 3B + 3H) */}
      <ProductEditor
        isOpen={isEditorOpen}
        initialTab={editorInitialTab}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        onProductSaved={handleProductSaved}
        onCategoriesUpdated={setCategories}
        onBrandsUpdated={setBrands}
      />

      {/* MODULARIZED PRODUCT PREVIEW MODAL (Phase 3C) */}
      <ProductPreviewModal
        product={viewingProduct}
        open={!!viewingProduct}
        onOpenChange={(open) => {
          if (!open) setViewingProduct(null);
        }}
        onEdit={(product) => {
          setViewingProduct(null);
          handleOpenEdit(product);
        }}
        onDelete={(product) => {
          setViewingProduct(null);
          setDeletingProduct(product);
        }}
      />

      {/* CSV CATALOG IMPORT MODAL (Phase 3I-C) */}
      <ProductImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setIsImportOpen(false);
          loadData(1, perPage);
        }}
      />

      {/* DELETE CONFIRM MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c101d] border border-rose-500/20 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-white">Delete Product?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{deletingProduct.name}&rdquo;</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
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
