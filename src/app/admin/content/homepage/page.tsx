"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Power,
  Headphones,
  Keyboard,
  Briefcase,
  Watch,
  Flame,
  Trophy,
  Zap,
  Boxes,
  Package,
  ShieldCheck,
  Tag,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { HomepageSection } from "@/types";
import { homepageService, ReorderSectionItem } from "@/services/homepageService";
import { HomepageSectionDrawer } from "@/components/admin/homepage/HomepageSectionDrawer";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
  Headphones,
  Keyboard,
  Briefcase,
  Sparkles,
  Watch,
  Layers,
  Flame,
  Trophy,
  Zap,
  Boxes,
  Package,
  ShieldCheck,
  Tag,
  Star,
};

export default function AdminContentHomepagePage() {
  const { adminUser } = useAdminAuthStore();
  const canManage =
    adminUser?.role === "super_admin" ||
    adminUser?.role === "admin" ||
    adminUser?.permissions?.includes("theme.manage") ||
    adminUser?.permissions?.includes("settings.manage");

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);

  // Fetch sections from real backend
  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await homepageService.getSections();
      const sorted = [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setSections(sorted);
    } catch (err: any) {
      console.error("Failed to load homepage sections:", err);
      toast.error("Failed to load homepage sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  // 1-Click Status Toggle
  const handleToggle = async (section: HomepageSection) => {
    if (!canManage) {
      toast.error("You do not have permission to manage homepage sections.");
      return;
    }

    const newStatus = !section.is_active;
    setActionLoadingId(section.id);

    // Optimistic UI update
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, is_active: newStatus } : s))
    );

    try {
      const res = await homepageService.toggleSection(section.id);
      toast.success(
        newStatus
          ? `"${section.title}" is now visible on storefront.`
          : `"${section.title}" hidden from storefront.`
      );
    } catch (err: any) {
      // Revert on error
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, is_active: !newStatus } : s))
      );
      toast.error(err?.response?.data?.message || "Failed to toggle section status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Section Duplication
  const handleDuplicate = async (section: HomepageSection) => {
    if (!canManage) {
      toast.error("You do not have permission to duplicate sections.");
      return;
    }

    setActionLoadingId(section.id);
    try {
      toast.loading(`Cloning "${section.title}"...`, { id: "duplicate-toast" });
      const res = await homepageService.duplicateSection(section.id);
      toast.success(`Cloned section "${res.data.title}".`, { id: "duplicate-toast" });
      await loadSections();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to duplicate section.", {
        id: "duplicate-toast",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Section Deletion
  const handleDelete = async (section: HomepageSection) => {
    if (!canManage) {
      toast.error("You do not have permission to delete sections.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${section.title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(section.id);
    try {
      await homepageService.deleteSection(section.id);
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success(`Deleted section "${section.title}".`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete section.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Move Order (Up / Down)
  const handleMoveOrder = async (section: HomepageSection, direction: "up" | "down") => {
    if (!canManage) {
      toast.error("You do not have permission to reorder sections.");
      return;
    }

    const currentIndex = sections.findIndex((s) => s.id === section.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    // Assign sequential orders
    const itemsPayload: ReorderSectionItem[] = updated.map((s, idx) => ({ id: s.id, sort_order: idx }));

    setSections(updated.map((s, idx) => ({ ...s, sort_order: idx })));
    setSavingOrder(true);

    try {
      await homepageService.reorderSections(itemsPayload);
      toast.success("Homepage section order updated.", { id: "reorder-toast", duration: 1500 });
    } catch (err) {
      toast.error("Failed to persist updated section order.");
      loadSections(); // Rollback
    } finally {
      setSavingOrder(false);
    }
  };

  // Native Drag and Drop Reordering
  const handleDragStart = (sectionId: number) => {
    if (!canManage) return;
    setDraggedSectionId(sectionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetSectionId: number) => {
    if (!canManage || draggedSectionId === null || draggedSectionId === targetSectionId) {
      setDraggedSectionId(null);
      return;
    }

    const sourceIndex = sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sections.findIndex((s) => s.id === targetSectionId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedSectionId(null);
      return;
    }

    const updated = [...sections];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const itemsPayload: ReorderSectionItem[] = updated.map((s, idx) => ({ id: s.id, sort_order: idx }));

    setSections(updated.map((s, idx) => ({ ...s, sort_order: idx })));
    setDraggedSectionId(null);
    setSavingOrder(true);

    try {
      await homepageService.reorderSections(itemsPayload);
      toast.success("Homepage section order saved.", { id: "reorder-toast", duration: 1500 });
    } catch (err) {
      toast.error("Failed to save section sequence.");
      loadSections();
    } finally {
      setSavingOrder(false);
    }
  };

  // Modal Open Handlers
  const handleCreate = () => {
    if (!canManage) {
      toast.error("You do not have permission to add homepage sections.");
      return;
    }
    setSelectedSection(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (section: HomepageSection) => {
    if (!canManage) {
      toast.error("You do not have permission to edit homepage sections.");
      return;
    }
    setSelectedSection(section);
    setIsDrawerOpen(true);
  };

  const activeCount = sections.filter((s) => s.is_active).length;
  const tabbedCount = sections.filter((s) => s.has_tabs && s.tabs && s.tabs.length > 0).length;

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
            <span className="text-xs text-slate-400 font-medium">Showcase & Product Sections</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#A78BFA]" />
            Homepage
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Arrange and configure storefront product showcases, multi-tab carousels, and category spotlights. Drag or use the arrow buttons to reorder sections in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#A78BFA]" />
          </Link>

          {canManage && (
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-[#A78BFA]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Showcase Section</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs font-semibold text-slate-400">Total Sections</span>
          <p className="text-2xl font-black text-white mt-1">{sections.length}</p>
        </div>
        <div className="p-4 rounded-md bg-emerald-500/[0.04] border border-emerald-500/20">
          <span className="text-xs font-semibold text-emerald-400">Active on Storefront</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-md bg-blue-500/[0.04] border border-blue-500/20">
          <span className="text-xs font-semibold text-blue-400">Multi-Tab Showcases</span>
          <p className="text-2xl font-black text-blue-300 mt-1">{tabbedCount}</p>
        </div>
        <div className="p-4 rounded-md bg-purple-500/[0.04] border border-purple-500/20">
          <span className="text-xs font-semibold text-purple-400">Categories Linked</span>
          <p className="text-2xl font-black text-purple-300 mt-1">
            {new Set(sections.map((s) => s.category_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* 3. Sections Stack Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Homepage Layout Flow (Top to Bottom)
            </span>
            {savingOrder && (
              <span className="text-[11px] text-[#A78BFA] flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving sequence...
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Drag items or use the arrows to adjust display priority
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-md bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="p-14 text-center rounded-md bg-white/[0.01] border border-dashed border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-md bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Homepage Sections Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Build your homepage layout by creating product carousels, category spotlights, or multi-tab showcases.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 rounded-md bg-[#A78BFA] text-[#090B10] text-xs font-bold hover:bg-[#B9A3FF] transition-colors inline-flex items-center gap-2 shadow-lg shadow-[#A78BFA]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Showcase</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              const Icon = ICON_MAP[section.badge_icon || ""] || Layers;
              const isDragging = draggedSectionId === section.id;

              return (
                <div
                  key={section.id}
                  draggable={canManage}
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(section.id)}
                  className={`rounded-md bg-slate-950/70 border border-white/[0.08] hover:border-[#A78BFA]/35 transition-all p-4 select-none relative group shadow-md ${
                    isDragging ? "opacity-30 bg-amber-400/5 border-amber-400" : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left: Reorder Handle, Position Number, Section Details */}
                    <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                      
                      {/* Reorder Controls (Drag Handle + Up / Down) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {canManage && (
                          <div
                            className="cursor-grab active:cursor-grabbing p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                            title="Drag to reorder section"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        <div className="flex flex-col items-center gap-0.5">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(section, "up")}
                              disabled={index === 0}
                              aria-label={`Move section "${section.title}" up`}
                              className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="w-7 h-7 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#A78BFA]">
                            #{index + 1}
                          </div>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(section, "down")}
                              disabled={index === sections.length - 1}
                              aria-label={`Move section "${section.title}" down`}
                              className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Section Info & Attributes */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#B9A3FF] transition-colors truncate">
                            {section.title}
                          </h3>

                          {section.badge_text && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
                              <Icon className="w-2.5 h-2.5 text-amber-400" />
                              <span>{section.badge_text}</span>
                            </span>
                          )}

                          {section.has_tabs ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              Multi-Tab Showcase ({section.tabs?.length || 0} Tabs)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize">
                              Single Source ({section.source_type || "category"})
                            </span>
                          )}
                        </div>

                        {section.subtitle && (
                          <p className="text-xs text-slate-400 truncate max-w-xl">
                            {section.subtitle}
                          </p>
                        )}

                        {/* Configuration Summary Badges */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                          {section.category && (
                            <span className="text-slate-400">
                              Category: <strong className="text-slate-200">{section.category.name}</strong>
                            </span>
                          )}

                          {section.brand && (
                            <span className="text-slate-400">
                              Brand: <strong className="text-slate-200">{section.brand.name}</strong>
                            </span>
                          )}

                          {section.has_tabs && section.tabs && section.tabs.length > 0 && (
                            <span className="text-slate-300">
                              Tabs: {section.tabs.map((t) => t.name).join(", ")}
                            </span>
                          )}

                          <span>•</span>
                          <span>Show: {section.product_count || 14} items</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">
                            {section.view_all_label || "View All"} ({section.view_all_url || "/products"})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Active Status & Action Buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                      
                      {/* Active Status Pill */}
                      <button
                        type="button"
                        onClick={() => handleToggle(section)}
                        disabled={actionLoadingId === section.id || !canManage}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          section.is_active
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                        title={section.is_active ? "Click to hide section" : "Click to activate section"}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{section.is_active ? "Active" : "Hidden"}</span>
                      </button>

                      <div className="h-4 w-px bg-white/10 hidden md:block" />

                      {/* Edit, Duplicate & Delete Actions */}
                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(section)}
                            className="px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-[#211B32] hover:text-[#A78BFA] text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/[0.08] cursor-pointer"
                            title="Edit section configuration"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(section)}
                            disabled={actionLoadingId === section.id}
                            className="p-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors border border-white/[0.08] cursor-pointer disabled:opacity-50"
                            title="Duplicate section"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(section)}
                            disabled={actionLoadingId === section.id}
                            className="p-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20 cursor-pointer disabled:opacity-50"
                            title="Delete section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Slide-Over Add / Edit Drawer */}
      <HomepageSectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={loadSections}
        section={selectedSection}
      />
    </div>
  );
}
