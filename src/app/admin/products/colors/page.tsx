"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Color } from "@/types";
import { AdminPageHeader } from "@/components/admin/ui";
import { toast } from "sonner";

import { ColorsKpiCards } from "@/components/admin/colors/ColorsKpiCards";
import { ColorsFilterToolbar } from "@/components/admin/colors/ColorsFilterToolbar";
import { ColorsGrid } from "@/components/admin/colors/ColorsGrid";
import { ColorFormDrawer, ColorFormData } from "@/components/admin/colors/ColorFormDrawer";
import { ColorDeleteModal, ColorDeleteConflicts } from "@/components/admin/colors/ColorDeleteModal";

export default function AdminColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deletingColor, setDeletingColor] = useState<Color | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConflicts, setDeleteConflicts] = useState<ColorDeleteConflicts | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const data = await adminApi.getColors();
        if (!ignore) {
          setColors(data || []);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load color swatches.");
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
    setEditingColor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (color: Color) => {
    setEditingColor(color);
    setIsFormOpen(true);
  };

  const handleSaveColor = async (formData: ColorFormData) => {
    setSaving(true);
    try {
      if (editingColor) {
        const res = await adminApi.updateColor(editingColor.id, formData);
        setColors((prev) =>
          prev.map((c) => (c.id === editingColor.id ? res.color : c))
        );
        toast.success(`Color swatch '${res.color.name}' updated successfully.`);
      } else {
        const res = await adminApi.createColor(formData);
        setColors((prev) => [res.color, ...prev]);
        toast.success(`Color swatch '${res.color.name}' created successfully.`);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || "Failed to save color swatch.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (color: Color) => {
    try {
      const res = await adminApi.toggleColorStatus(color.id);
      setColors((prev) =>
        prev.map((c) => (c.id === color.id ? { ...c, status: res.color.status } : c))
      );
      toast.success(`Color '${color.name}' status updated to ${res.color.status}.`);
    } catch {
      toast.error("Failed to toggle status.");
    }
  };

  // Delete Handlers
  const handleOpenDelete = (color: Color) => {
    setDeletingColor(color);
    setDeleteConflicts(null);
    setDeleteErrorMessage(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingColor(null);
    setDeleteConflicts(null);
    setDeleteErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingColor) return;
    setDeleting(true);
    try {
      await adminApi.deleteColor(deletingColor.id);
      setColors((prev) => prev.filter((c) => c.id !== deletingColor.id));
      toast.success(`Color '${deletingColor.name}' removed.`);
      handleCloseDelete();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            conflicts?: ColorDeleteConflicts;
          };
        };
      };

      if (axiosErr.response?.status === 422 && axiosErr.response.data?.conflicts) {
        setDeleteConflicts(axiosErr.response.data.conflicts);
        setDeleteErrorMessage(axiosErr.response.data.message || null);
        toast.error("Deletion blocked: this color is currently used by product variants.");
      } else {
        toast.error(axiosErr.response?.data?.message || "Failed to delete color swatch.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Filtered List
  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return colors.filter((c) => {
      const matchSearch =
        q === "" ||
        c.name.toLowerCase().includes(q) ||
        c.hex_code.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [colors, search, statusFilter]);

  const activeCount = useMemo(
    () => colors.filter((c) => c.status === "active").length,
    [colors]
  );
  const inactiveCount = useMemo(
    () => colors.filter((c) => c.status === "inactive").length,
    [colors]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Color Swatches"
        description="Standardized color palette library for product variants, inventory attributes, and storefront facet filtering."
        badge="Catalog"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "Color Swatches" },
        ]}
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Color</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <ColorsKpiCards
        totalSwatches={colors.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        filteredCount={filteredColors.length}
      />

      {/* Filter and Search Bar */}
      <ColorsFilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onReset={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {/* Color Swatch Grid */}
      <ColorsGrid
        colors={filteredColors}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onToggleStatus={handleToggleStatus}
        onCopyHex={handleCopyHex}
        copiedHex={copiedHex}
        onOpenCreate={handleOpenCreate}
      />

      {/* Create / Edit Drawer */}
      <ColorFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingColor={editingColor}
        onSave={handleSaveColor}
        saving={saving}
      />

      {/* Delete Confirmation Sheet */}
      <ColorDeleteModal
        color={deletingColor}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        onConfirmDelete={handleConfirmDelete}
        deleting={deleting}
        serverConflicts={deleteConflicts}
        serverErrorMessage={deleteErrorMessage}
      />
    </div>
  );
}
