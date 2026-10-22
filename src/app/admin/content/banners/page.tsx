"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Calendar,
  Grid,
  List,
  Image as ImageIcon,
  Smartphone,
  Layers,
  Monitor,
  Tag,
  Clock,
  ArrowUpDown,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Banner } from "@/types";
import { bannerService, BannerFilters } from "@/services/bannerService";
import { BannerFormDrawer, BANNER_PLACEMENTS } from "@/components/admin/banners/BannerFormDrawer";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

// Filter pill definitions as explicitly specified in Phase 2A UX requirements
export interface FilterTabDef {
  id: string;
  label: string;
  placementKey: string;
  description: string;
  recommendedSize: string;
  ratio: string;
}

export const FILTER_PILLS: FilterTabDef[] = [
  {
    id: "all",
    label: "All",
    placementKey: "all",
    description: "All storefront promotional banners across all placements",
    recommendedSize: "Various",
    ratio: "Responsive",
  },
  {
    id: "primary_hero",
    label: "Hero Slider",
    placementKey: "primary_hero",
    description: "Full-width flagship carousel banners at the top of the homepage",
    recommendedSize: "1920 × 640 px",
    ratio: "3:1 Landscape",
  },
  {
    id: "top_strip",
    label: "Promo Bar",
    placementKey: "top_strip",
    description: "Compact promotional announcement strip above or below the header",
    recommendedSize: "1920 × 80 px",
    ratio: "24:1 Ultra-wide",
  },
  {
    id: "category_banner",
    label: "Category Banner",
    placementKey: "category_banner",
    description: "Promotional header and inline cards on category and collection pages",
    recommendedSize: "1200 × 400 px",
    ratio: "3:1 Landscape",
  },
  {
    id: "popup",
    label: "Popup Ad",
    placementKey: "popup",
    description: "Timed or exit-intent promotional lightbox overlay for visitors",
    recommendedSize: "800 × 600 px",
    ratio: "4:3 Box",
  },
];

export default function AdminContentBannersPage() {
  const { adminUser } = useAdminAuthStore();
  const canManage =
    adminUser?.role === "super_admin" ||
    adminUser?.role === "admin" ||
    adminUser?.permissions?.includes("theme.manage");

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePill, setActivePill] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [preselectedPlacement, setPreselectedPlacement] = useState<string | null>(null);

  // Drag-and-drop & Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [draggedBannerId, setDraggedBannerId] = useState<number | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Fetch banners from real backend API
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerService.getBanners();
      // Ensure sorted by sort_order
      const sorted = [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setBanners(sorted);
    } catch (err) {
      toast.error("Failed to load storefront banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Filter logic (handles category groupings and status)
  const filteredBanners = useMemo(() => {
    const now = new Date();

    return banners.filter((b) => {
      // 1. Search Query
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
        (b.cta_text && b.cta_text.toLowerCase().includes(q)) ||
        (b.cta_link && b.cta_link.toLowerCase().includes(q)) ||
        (b.badge && b.badge.toLowerCase().includes(q)) ||
        (b.discount_tag && b.discount_tag.toLowerCase().includes(q));

      // 2. Placement Filter Pills
      let matchesPlacement = true;
      if (activePill === "primary_hero") {
        matchesPlacement = b.placement === "primary_hero" || b.placement === "hero_slider";
      } else if (activePill === "top_strip") {
        matchesPlacement = b.placement === "top_strip" || b.placement === "top_announcement";
      } else if (activePill === "category_banner") {
        matchesPlacement =
          b.placement === "category_banner" ||
          b.placement === "secondary_hero" ||
          b.placement === "product_grid" ||
          b.placement === "bottom_banner" ||
          b.placement === "middle_promo";
      } else if (activePill === "popup") {
        matchesPlacement = b.placement === "popup";
      } else if (activePill !== "all") {
        matchesPlacement = b.placement === activePill;
      }

      // 3. Status Filter
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = b.is_active;
      } else if (statusFilter === "inactive") {
        matchesStatus = !b.is_active;
      } else if (statusFilter === "scheduled") {
        const starts = b.starts_at ? new Date(b.starts_at) : null;
        matchesStatus = Boolean(starts && starts > now && b.is_active);
      } else if (statusFilter === "expired") {
        const expires = b.expires_at ? new Date(b.expires_at) : null;
        matchesStatus = Boolean(expires && expires < now);
      }

      return matchesSearch && matchesPlacement && matchesStatus;
    });
  }, [banners, search, activePill, statusFilter]);

  // Counts for KPI strip and filter badges
  const totalCount = banners.length;
  const activeCount = banners.filter((b) => b.is_active).length;
  const scheduledCount = banners.filter((b) => {
    const starts = b.starts_at ? new Date(b.starts_at) : null;
    return starts && starts > new Date() && b.is_active;
  }).length;

  const countForPill = (pill: FilterTabDef) => {
    if (pill.id === "all") return banners.length;
    if (pill.id === "primary_hero") {
      return banners.filter((b) => b.placement === "primary_hero" || b.placement === "hero_slider").length;
    }
    if (pill.id === "top_strip") {
      return banners.filter((b) => b.placement === "top_strip" || b.placement === "top_announcement").length;
    }
    if (pill.id === "category_banner") {
      return banners.filter(
        (b) =>
          b.placement === "category_banner" ||
          b.placement === "secondary_hero" ||
          b.placement === "product_grid" ||
          b.placement === "bottom_banner" ||
          b.placement === "middle_promo"
      ).length;
    }
    if (pill.id === "popup") {
      return banners.filter((b) => b.placement === "popup").length;
    }
    return banners.filter((b) => b.placement === pill.placementKey).length;
  };

  // Actions: Create / Edit
  const handleCreate = (defaultPlacement?: string) => {
    if (!canManage) {
      toast.error("You do not have permission to create banners.");
      return;
    }
    setEditingBanner(null);
    setPreselectedPlacement(defaultPlacement || (activePill !== "all" ? activePill : "primary_hero"));
    setIsDrawerOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    if (!canManage) {
      toast.error("You do not have permission to edit banners.");
      return;
    }
    setEditingBanner(banner);
    setPreselectedPlacement(banner.placement);
    setIsDrawerOpen(true);
  };

  // Action: Toggle Status (active/inactive)
  const handleToggleStatus = async (banner: Banner) => {
    if (!canManage) {
      toast.error("You do not have permission to toggle banner status.");
      return;
    }
    setActionLoadingId(banner.id);
    try {
      const res = await bannerService.toggleStatus(banner.id);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
      toast.success(res.message || `Banner status updated.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle banner status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Delete Banner
  const handleDelete = async (banner: Banner) => {
    if (!canManage) {
      toast.error("You do not have permission to delete banners.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete banner "${banner.title}"?`)) {
      return;
    }

    setActionLoadingId(banner.id);
    try {
      await bannerService.deleteBanner(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success("Banner deleted successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete banner.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredBanners.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!canManage) {
      toast.error("You do not have permission to delete banners.");
      return;
    }
    setIsBulkDeleting(true);
    try {
      await bannerService.bulkDeleteBanners(selectedIds);
      toast.success(`Deleted ${selectedIds.length} banner(s).`);
      setSelectedIds([]);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected banners.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Action: 1-Click Move Order (Up / Down)
  const handleMoveOrder = async (banner: Banner, direction: "up" | "down") => {
    if (!canManage) {
      toast.error("You do not have permission to reorder banners.");
      return;
    }

    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[currentIndex];
    const targetBanner = banners[targetIndex];

    const currentOrder = currentBanner.sort_order ?? currentIndex;
    const targetOrder = targetBanner.sort_order ?? targetIndex;

    const newCurrentOrder =
      currentOrder === targetOrder
        ? direction === "up"
          ? targetOrder - 1
          : targetOrder + 1
        : targetOrder;

    try {
      await bannerService.reorderBanners([
        { id: currentBanner.id, sort_order: newCurrentOrder },
        { id: targetBanner.id, sort_order: currentOrder },
      ]);

      setBanners((prev) => {
        const next = [...prev];
        next[currentIndex] = { ...targetBanner, sort_order: currentOrder };
        next[targetIndex] = { ...currentBanner, sort_order: newCurrentOrder };
        return next;
      });
      toast.success("Banner display order updated.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update banner order.");
    }
  };

  // Action: Drag and Drop Reordering
  const handleDragStart = (bannerId: number) => {
    if (!canManage) return;
    setDraggedBannerId(bannerId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetBannerId: number) => {
    if (!canManage || draggedBannerId === null || draggedBannerId === targetBannerId) {
      setDraggedBannerId(null);
      return;
    }

    const sourceIndex = banners.findIndex((b) => b.id === draggedBannerId);
    const targetIndex = banners.findIndex((b) => b.id === targetBannerId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedBannerId(null);
      return;
    }

    // Reorder locally
    const updated = [...banners];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    // Assign sequential sort_orders
    const itemsPayload = updated.map((b, idx) => ({ id: b.id, sort_order: idx }));

    setBanners(
      updated.map((b, idx) => ({
        ...b,
        sort_order: idx,
      }))
    );
    setDraggedBannerId(null);

    try {
      await bannerService.reorderBanners(itemsPayload);
      toast.success("Banner sequence saved.");
    } catch (err) {
      toast.error("Failed to persist updated banner order.");
      fetchBanners(); // Rollback on failure
    }
  };

  const activePillDef = FILTER_PILLS.find((p) => p.id === activePill) || FILTER_PILLS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA] bg-[#211B32] px-2.5 py-0.5 rounded border border-[#A78BFA]/30">
              Content / CMS
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-medium">Banners & Advertisements</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#A78BFA]" />
            Banners & Ads
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage promotional visual content, hero carousel sliders, top announcement bars, and seasonal banner campaigns across your store.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canManage ? (
            <button
              onClick={() => handleCreate()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-[#A78BFA]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Banner</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs text-slate-400">
              Read-Only View
            </div>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs font-semibold text-slate-400">Total Banners</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-md bg-emerald-500/[0.04] border border-emerald-500/20">
          <span className="text-xs font-semibold text-emerald-400">Active Live</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-md bg-blue-500/[0.04] border border-blue-500/20">
          <span className="text-xs font-semibold text-blue-400">Scheduled</span>
          <p className="text-2xl font-black text-blue-300 mt-1">{scheduledCount}</p>
        </div>
        <div className="p-4 rounded-md bg-purple-500/[0.04] border border-purple-500/20">
          <span className="text-xs font-semibold text-purple-400">Placements Covered</span>
          <p className="text-2xl font-black text-purple-300 mt-1">
            {new Set(banners.map((b) => b.placement)).size}
          </p>
        </div>
      </div>

      {/* 3. Filter / Category Tabs or Pills */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_PILLS.map((pill) => {
            const count = countForPill(pill);
            const isSelected = activePill === pill.id;

            return (
              <button
                key={pill.id}
                onClick={() => setActivePill(pill.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
                    : "bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? "bg-[#211B32] text-[#A78BFA]"
                      : "bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Placement Guidance Strip */}
        {activePill !== "all" && (
          <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-white">{activePillDef.label}:</span>
              <span className="text-slate-400 text-[11px]">{activePillDef.description}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px]">
              <span className="text-slate-400">
                Recommended Canvas: <strong className="text-white font-mono">{activePillDef.recommendedSize}</strong> ({activePillDef.ratio})
              </span>
              {canManage && (
                <button
                  onClick={() => handleCreate(activePillDef.placementKey)}
                  className="px-2.5 py-1 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] font-bold border border-[#A78BFA]/30 transition-colors cursor-pointer"
                >
                  + Add to {activePillDef.label}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Search & Controls Bar */}
      <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search banners by title, subtitle, CTA text or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by banner status"
            className="px-3 py-2 rounded-md bg-slate-900 border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-[#A78BFA]/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Live Only</option>
            <option value="inactive">Inactive / Draft Only</option>
            <option value="scheduled">Scheduled (Future)</option>
            <option value="expired">Expired</option>
          </select>

          {/* Reset Filters */}
          {(search || activePill !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setActivePill("all");
                setStatusFilter("all");
              }}
              className="px-3 py-2 text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-1 rounded-md border border-white/[0.08]">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-[#A78BFA] text-[#090B10]" : "text-slate-400 hover:text-white"
              }`}
              title="Table list view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "cards" ? "bg-[#A78BFA] text-[#090B10]" : "text-slate-400 hover:text-white"
              }`}
              title="Visual cards view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Table or Cards View */}
      {loading ? (
        <div className="p-16 text-center rounded-md bg-white/[0.01] border border-white/[0.06] text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
          <span>Loading storefront banners from server...</span>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="p-14 text-center rounded-md bg-white/[0.01] border border-white/[0.06]">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Banners Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {search || activePill !== "all" || statusFilter !== "all"
              ? "No banners match your active filters. Try resetting search criteria."
              : "You haven't created any promotional banners yet. Add your first banner to enhance your storefront."}
          </p>
          {canManage && (
            <button
              onClick={() => handleCreate()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#A78BFA] text-[#090B10] font-bold text-xs shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Banner</span>
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-md border border-white/[0.08] bg-slate-950/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 w-10 text-center">
                    <AdminCheckbox
                      checked={filteredBanners.length > 0 && selectedIds.length === filteredBanners.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filteredBanners.length}
                      onChange={handleSelectAll}
                      title="Select all banners"
                    />
                  </th>
                  <th className="py-3.5 px-4 w-14 text-center">Order</th>
                  <th className="py-3.5 px-4">Banner Creative</th>
                  <th className="py-3.5 px-4">Placement / Zone</th>
                  <th className="py-3.5 px-4">Destination Target</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredBanners.map((banner, index) => {
                  const placementDef = BANNER_PLACEMENTS.find((p) => p.id === banner.placement);
                  const isDragging = draggedBannerId === banner.id;

                  // Schedule display logic
                  const now = new Date();
                  const starts = banner.starts_at ? new Date(banner.starts_at) : null;
                  const expires = banner.expires_at ? new Date(banner.expires_at) : null;
                  const isFuture = starts && starts > now;
                  const isPast = expires && expires < now;

                  return (
                    <tr
                      key={banner.id}
                      draggable={canManage}
                      onDragStart={() => handleDragStart(banner.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(banner.id)}
                      className={`hover:bg-white/[0.02] transition-colors group ${
                        isDragging ? "opacity-30 bg-[#211B32]" : ""
                      } ${selectedIds.includes(banner.id) ? "bg-[#A78BFA]/[0.05]" : ""}`}
                    >
                      <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={selectedIds.includes(banner.id)}
                          onChange={() => handleToggleSelect(banner.id)}
                          title={`Select ${banner.title}`}
                        />
                      </td>
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {canManage ? (
                            <>
                              <button
                                onClick={() => handleMoveOrder(banner, "up")}
                                disabled={index === 0}
                                aria-label={`Move banner "${banner.title}" up`}
                                className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <div
                                className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 cursor-grab active:cursor-grabbing"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-3 h-3 text-slate-600" />
                                <span>{banner.sort_order ?? index}</span>
                              </div>
                              <button
                                onClick={() => handleMoveOrder(banner, "down")}
                                disabled={index === filteredBanners.length - 1}
                                aria-label={`Move banner "${banner.title}" down`}
                                className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">
                              #{banner.sort_order ?? index}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Creative Preview & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-12 rounded-md overflow-hidden bg-slate-900 border border-white/[0.1] relative shrink-0">
                            {banner.image_url ? (
                              <img
                                src={banner.image_url}
                                alt={banner.alt_text || banner.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-[#B9A3FF] transition-colors">
                              {banner.title}
                            </p>
                            {banner.subtitle && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {banner.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {banner.mobile_image_url && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                                  <Smartphone className="w-2.5 h-2.5" /> Mobile Ready
                                </span>
                              )}
                              {banner.badge && (
                                <span className="text-[10px] text-[#A78BFA] bg-[#211B32] px-1.5 py-0.5 rounded font-semibold">
                                  {banner.badge}
                                </span>
                              )}
                              {banner.discount_tag && (
                                <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                                  {banner.discount_tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Placement / Zone */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-slate-200">
                          {placementDef?.label || banner.placement}
                        </span>
                        {placementDef?.dimensions && (
                          <span className="block text-[10px] font-mono text-slate-500 mt-1">
                            {placementDef.dimensions}
                          </span>
                        )}
                      </td>

                      {/* Destination Target */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-slate-300">
                            {banner.cta_text || "Shop Now"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono line-clamp-1">
                            {banner.cta_link || banner.computed_link || "/products"}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-4">
                        {isPast ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Expired ({expires?.toLocaleDateString()})</span>
                          </div>
                        ) : isFuture ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Starts {starts?.toLocaleDateString()}</span>
                          </div>
                        ) : expires ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#A78BFA]">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Ends {expires.toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Always Visible</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(banner)}
                          disabled={actionLoadingId === banner.id || !canManage}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            banner.is_active
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{banner.is_active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleEdit(banner)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                                title="Edit banner"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(banner)}
                                disabled={actionLoadingId === banner.id}
                                className="p-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete banner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS / VISUAL GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanners.map((banner) => {
            const placementDef = BANNER_PLACEMENTS.find((p) => p.id === banner.placement);

            return (
              <div
                key={banner.id}
                className={`rounded-md border bg-slate-950/60 overflow-hidden flex flex-col justify-between group transition-all shadow-lg ${
                  selectedIds.includes(banner.id)
                    ? "border-[#A78BFA] ring-1 ring-[#A78BFA]/30 bg-[#A78BFA]/[0.03]"
                    : "border-white/[0.08] hover:border-[#A78BFA]/30"
                }`}
              >
                {/* Visual Creative Thumbnail */}
                <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                  <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <AdminCheckbox
                      checked={selectedIds.includes(banner.id)}
                      onChange={() => handleToggleSelect(banner.id)}
                      title={`Select ${banner.title}`}
                    />
                  </div>
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text || banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                      {placementDef?.label || banner.placement}
                    </span>
                    {banner.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-[#A78BFA] text-[10px] font-bold text-[#090B10]">
                        {banner.badge}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${
                        banner.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      <Power className="w-2.5 h-2.5" />
                      {banner.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-[#B9A3FF] transition-colors">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Target:</span>
                      <span className="text-slate-200 font-mono text-[11px] truncate max-w-[180px]">
                        {banner.cta_link || "/products"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        Priority #{banner.sort_order ?? 0}
                      </span>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(banner)}
                            className="p-1 rounded text-slate-400 hover:text-[#A78BFA] transition cursor-pointer"
                            title="Toggle active status"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(banner)}
                            className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                            title="Edit banner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 transition cursor-pointer"
                            title="Delete banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Slide-Over Banner Create / Edit Drawer */}
      <BannerFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          setIsDrawerOpen(false);
          fetchBanners();
        }}
        banner={editingBanner}
        initialPlacement={preselectedPlacement}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredBanners.length}
        itemName="banner"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={() => setSelectedIds(filteredBanners.map((b) => b.id))}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
