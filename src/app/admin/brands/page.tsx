"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Brand } from "@/types";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

import { BrandsKpiCards } from "@/components/admin/brands/BrandsKpiCards";
import { BrandsFilterToolbar } from "@/components/admin/brands/BrandsFilterToolbar";
import { BrandsTable } from "@/components/admin/brands/BrandsTable";
import { BrandFormDrawer, BrandFormData } from "@/components/admin/brands/BrandFormDrawer";
import { BrandPreviewDrawer } from "@/components/admin/brands/BrandPreviewDrawer";
import { BrandDeleteModal, BrandDeleteConflicts } from "@/components/admin/brands/BrandDeleteModal";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  // Inspect / Preview Drawer State
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);

  // Create / Edit Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  // Single Delete Modal State
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConflicts, setDeleteConflicts] = useState<BrandDeleteConflicts | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadBrands = useCallback(async () => {
    try {
      const data = await adminApi.getBrands();
      setBrands(data || []);
    } catch {
      toast.error("Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await adminApi.getBrands();
        if (!ignore) {
          setBrands(data || []);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load brands.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Create & Edit Handlers
  const handleOpenCreate = () => {
    setEditingBrand(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleSaveBrand = async (formData: BrandFormData) => {
    setSaving(true);
    try {
      if (editingBrand) {
        const res = await adminApi.updateBrand(editingBrand.id, formData);
        setBrands((prev) =>
          prev.map((b) => (b.id === editingBrand.id ? res.brand : b))
        );
        if (viewingBrand?.id === editingBrand.id) {
          setViewingBrand(res.brand);
        }
        toast.success(`Brand '${res.brand.name}' updated.`);
      } else {
        const res = await adminApi.createBrand(formData);
        setBrands((prev) => [...prev, res.brand]);
        toast.success(`Brand '${res.brand.name}' created.`);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || "Failed to save brand.");
    } finally {
      setSaving(false);
    }
  };

  // Inspect Handlers
  const handleInspectBrand = async (brand: Brand) => {
    setViewingBrand(brand);
    try {
      const fullBrand = await adminApi.getBrand(brand.id);
      setViewingBrand(fullBrand);
    } catch {
      // Retain the existing brand data if fetch fails
    }
  };

  // Delete Handlers
  const handleOpenDelete = (brand: Brand) => {
    setDeletingBrand(brand);
    setDeleteConflicts(null);
    setDeleteErrorMessage(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingBrand(null);
    setDeleteConflicts(null);
    setDeleteErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;
    setDeleting(true);
    try {
      await adminApi.deleteBrand(deletingBrand.id);
      setBrands((prev) => prev.filter((b) => b.id !== deletingBrand.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingBrand.id));
      if (viewingBrand?.id === deletingBrand.id) {
        setViewingBrand(null);
      }
      toast.success(`Brand '${deletingBrand.name}' deleted.`);
      handleCloseDelete();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            conflicts?: BrandDeleteConflicts;
          };
        };
      };

      if (axiosErr.response?.status === 422 && axiosErr.response.data?.conflicts) {
        setDeleteConflicts(axiosErr.response.data.conflicts);
        setDeleteErrorMessage(axiosErr.response.data.message || null);
        toast.error("Deletion blocked: this brand has active dependencies.");
      } else {
        toast.error(axiosErr.response?.data?.message || "Failed to delete brand.");
      }
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Selection Handlers
  const displayedBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands.filter((b) => {
      const matchesSearch =
        q === "" ||
        b.name.toLowerCase().includes(q) ||
        (b.website && b.website.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q));

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && b.is_featured) ||
        (featuredFilter === "standard" && !b.is_featured);

      return matchesSearch && matchesFeatured;
    });
  }, [brands, search, featuredFilter]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === displayedBrands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedBrands.map((b) => b.id));
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
      const res = await adminApi.bulkDeleteBrands(selectedIds);
      toast.success(res.message);
      setSelectedIds([]);
      await loadBrands();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || "Failed to bulk delete brands.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // KPI calculations
  const totalProductsLinked = useMemo(
    () => brands.reduce((acc, b) => acc + (b.products_count || 0), 0),
    [brands]
  );
  const featuredBrandsCount = useMemo(
    () => brands.filter((b) => b.is_featured).length,
    [brands]
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              Hardware Manufacturers
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white mt-1">Brand Management</h1>
          <p className="text-xs text-slate-400">
            Configure manufacturer profiles, logos, URLs, and hardware assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Brand</span>
        </button>
      </div>

      {/* KPI Cards */}
      <BrandsKpiCards
        totalBrands={brands.length}
        featuredBrandsCount={featuredBrandsCount}
        totalProductsLinked={totalProductsLinked}
      />

      {/* Filter Toolbar */}
      <BrandsFilterToolbar
        search={search}
        onSearchChange={setSearch}
        featuredFilter={featuredFilter}
        onFeaturedFilterChange={setFeaturedFilter}
        onReset={() => {
          setSearch("");
          setFeaturedFilter("all");
        }}
      />

      {/* Brands Table */}
      <BrandsTable
        brands={displayedBrands}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectRow={handleToggleSelectRow}
        onInspect={handleInspectBrand}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Inspect Drawer */}
      <BrandPreviewDrawer
        brand={viewingBrand}
        isOpen={Boolean(viewingBrand)}
        onClose={() => setViewingBrand(null)}
        onEdit={(brand) => {
          setViewingBrand(null);
          handleOpenEdit(brand);
        }}
      />

      {/* Form Drawer */}
      <BrandFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingBrand={editingBrand}
        onSave={handleSaveBrand}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <BrandDeleteModal
        brand={deletingBrand}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        onConfirmDelete={handleConfirmDelete}
        deleting={deleting}
        serverConflicts={deleteConflicts}
        serverErrorMessage={deleteErrorMessage}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={displayedBrands.length}
        itemName="brand"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
