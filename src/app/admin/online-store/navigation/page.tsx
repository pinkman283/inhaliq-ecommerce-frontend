"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ListTree,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Eye,
  Globe,
  Sparkles,
  Layers,
  Building2,
  ChevronRight,
  ChevronDown,
  Tag,
  CheckCircle2,
  Compass,
  Monitor,
  Smartphone,
  Info,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { NavbarItem, NavbarItemType, MegaMenuType, NavigationOptions } from "@/types";
import { AdminPageHeader, AdminStatStrip, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useThemeStore } from "@/store/useThemeStore";

export default function AdminNavigationPage() {
  const [items, setItems] = useState<NavbarItem[]>([]);
  const [options, setOptions] = useState<NavigationOptions>({
    root_categories: [],
    subcategories: [],
    brands: [],
    pages: [],
    potential_parents: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tree" | "preview">("tree");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const { theme } = useThemeStore();

  // Drawer / Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavbarItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<NavbarItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category Brands Modal
  const [categoryBrandsModal, setCategoryBrandsModal] = useState<{
    open: boolean;
    categoryId: number | null;
    categoryName: string;
    loading: boolean;
    linkedBrands: Array<{ id: number; name: string; slug: string; is_in_navbar: boolean; is_featured: boolean }>;
    allBrands: Array<{ id: number; name: string; slug: string }>;
    saving: boolean;
  }>({
    open: false,
    categoryId: null,
    categoryName: "",
    loading: false,
    linkedBrands: [],
    allBrands: [],
    saving: false,
  });

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<NavbarItemType>("category");
  const [formParentId, setFormParentId] = useState<number | "root">("root");
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
  const [formSubcategoryId, setFormSubcategoryId] = useState<number | null>(null);
  const [formBrandId, setFormBrandId] = useState<number | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formBadgeColor, setFormBadgeColor] = useState("#EF4444");
  const [formMegaMenuType, setFormMegaMenuType] = useState<MegaMenuType>("none");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOpenInNewTab, setFormOpenInNewTab] = useState(false);

  // Fetch navigation data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeData, optsData] = await Promise.all([
        adminApi.getNavbarTree(),
        adminApi.getNavigationOptions(),
      ]);
      setItems(treeData || []);
      setOptions(optsData || {
        root_categories: [],
        subcategories: [],
        brands: [],
        pages: [],
        potential_parents: [],
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load header navigation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let mega = 0;
    const rootCount = items.length;

    const countItem = (item: NavbarItem) => {
      total++;
      if (item.is_active) active++;
      if (item.mega_menu_type && item.mega_menu_type !== "none") mega++;
      if (item.children) {
        item.children.forEach(countItem);
      }
    };

    items.forEach(countItem);

    return [
      { label: "Total Navbar Items", value: total, helper: "Across all tree tiers", variant: "default" as const },
      { label: "Top-Level Nav Links", value: rootCount, helper: "Visible on header bar", variant: "cyan" as const },
      { label: "Active Items", value: active, helper: "Published to storefront", variant: "emerald" as const },
      { label: "Mega-Menu Dropdowns", value: mega, helper: "Rich category/brand matrices", variant: "purple" as const },
    ];
  }, [items]);

  // Open drawer for Create or Edit
  const openDrawer = (item?: NavbarItem, parentId?: number) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title || "");
      setFormType(item.type || "category");
      setFormParentId(item.parent_id ?? "root");
      setFormCategoryId(item.category_id ?? null);
      setFormSubcategoryId(item.subcategory_id ?? null);
      setFormBrandId(item.brand_id ?? null);
      setFormUrl(item.url || "");
      setFormBadge(item.badge || "");
      setFormBadgeColor(item.badge_color || "#EF4444");
      setFormMegaMenuType(item.mega_menu_type || "none");
      setFormIsActive(Boolean(item.is_active));
      setFormOpenInNewTab(Boolean(item.open_in_new_tab));
    } else {
      setEditingItem(null);
      setFormTitle("");
      setFormType("category");
      setFormParentId(parentId ?? "root");
      setFormCategoryId(options.root_categories[0]?.id ?? null);
      setFormSubcategoryId(null);
      setFormBrandId(null);
      setFormUrl("");
      setFormBadge("");
      setFormBadgeColor("#EF4444");
      setFormMegaMenuType(parentId ? "none" : "category_brand_grid");
      setFormIsActive(true);
      setFormOpenInNewTab(false);
    }
    setIsDrawerOpen(true);
  };

  // Save Item (Create / Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please provide a title for the navigation item");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<NavbarItem> = {
        title: formTitle.trim(),
        type: formType,
        parent_id: formParentId === "root" ? null : formParentId,
        category_id: (formType === "category" || formType === "subcategory") ? formCategoryId : null,
        subcategory_id: formType === "subcategory" ? formSubcategoryId : null,
        brand_id: formType === "brand" ? formBrandId : null,
        url: formType === "custom" ? formUrl.trim() : null,
        badge: formBadge.trim() || null,
        badge_color: formBadge.trim() ? formBadgeColor : null,
        mega_menu_type: formMegaMenuType,
        is_active: formIsActive,
        open_in_new_tab: formOpenInNewTab,
      };

      if (editingItem) {
        await adminApi.updateNavbarItem(editingItem.id, payload);
        toast.success(`Navigation item '${formTitle}' updated`);
      } else {
        await adminApi.createNavbarItem(payload);
        toast.success(`Navigation item '${formTitle}' created`);
      }

      setIsDrawerOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save navigation item");
    } finally {
      setSaving(false);
    }
  };

  // Toggle active inline
  const handleToggleActive = async (item: NavbarItem) => {
    try {
      await adminApi.updateNavbarItem(item.id, { is_active: !item.is_active });
      toast.success(`${item.title} is now ${!item.is_active ? "active" : "inactive"}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle item status");
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await adminApi.deleteNavbarItem(deletingItem.id);
      toast.success(`Item '${deletingItem.title}' deleted`);
      setDeletingItem(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete navigation item");
    } finally {
      setDeleting(false);
    }
  };

  // Move order up / down
  const handleMoveOrder = async (itemList: NavbarItem[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= itemList.length) return;

    const reordered = [...itemList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reorderPayload = reordered.map((item, idx) => ({
      id: item.id,
      display_order: idx,
      parent_id: item.parent_id ?? null,
    }));

    try {
      await adminApi.reorderNavbarItems(reorderPayload);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to update navigation ordering");
    }
  };

  // Open Category Brands manager
  const openCategoryBrands = async (categoryId: number, categoryName: string) => {
    setCategoryBrandsModal({
      open: true,
      categoryId,
      categoryName,
      loading: true,
      linkedBrands: [],
      allBrands: [],
      saving: false,
    });

    try {
      const res = await adminApi.getCategoryBrands(categoryId);
      setCategoryBrandsModal({
        open: true,
        categoryId,
        categoryName,
        loading: false,
        linkedBrands: res.linked_brands || [],
        allBrands: res.all_brands || [],
        saving: false,
      });
    } catch (err: any) {
      toast.error("Failed to load brands for this category");
      setCategoryBrandsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Save Category Brands
  const handleSaveCategoryBrands = async () => {
    if (!categoryBrandsModal.categoryId) return;
    setCategoryBrandsModal((prev) => ({ ...prev, saving: true }));
    try {
      const brandsPayload = categoryBrandsModal.linkedBrands.map((b, idx) => ({
        brand_id: b.id,
        display_order: idx,
        is_in_navbar: b.is_in_navbar,
        is_featured: b.is_featured,
      }));

      await adminApi.updateCategoryBrands(categoryBrandsModal.categoryId, brandsPayload);
      toast.success("Category brands updated for navigation mega-menu");
      setCategoryBrandsModal((prev) => ({ ...prev, open: false, saving: false }));
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to save category brands");
      setCategoryBrandsModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Filtered subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!formCategoryId) return [];
    return options.subcategories.filter((s) => s.parent_id === formCategoryId);
  }, [formCategoryId, options.subcategories]);

  // Render type badge helper
  const renderTypeBadge = (type: NavbarItemType) => {
    switch (type) {
      case "category":
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Category</span>;
      case "subcategory":
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Subcategory</span>;
      case "brand":
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Brand</span>;
      case "custom":
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Custom Link</span>;
      case "dropdown_group":
        return <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">Group</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        title="Header Navigation Menu"
        badge="Dynamic Engine"
        badgeVariant="cyan"
        description="Administer full top-level navbar items, dropdown mega-menus, brand matrices, and link destinations with real-time storefront synchronization."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Store Settings", href: "/admin/settings" },
          { label: "Header Navigation" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => openDrawer()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-sm shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Navigation Item
            </button>
          </div>
        }
      />

      {/* Stats Strip */}
      <AdminStatStrip stats={stats} columns={4} />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("tree")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "tree"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            Navigation Tree & Hierarchy
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "preview"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Storefront Navbar Preview
          </button>
        </div>

        {activeTab === "preview" && (
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                previewDevice === "desktop" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                previewDevice === "mobile" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Drawer
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Tree View */}
      {activeTab === "tree" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <p className="text-xs">Loading navigation hierarchy...</p>
            </div>
          ) : items.length === 0 ? (
            <AdminEmptyState
              icon={ListTree}
              title="No Navigation Items Found"
              description="Start building your storefront header navbar by adding top-level categories, custom links, or brand menus."
              action={
                <button
                  type="button"
                  onClick={() => openDrawer()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
                >
                  Add First Navigation Item
                </button>
              }
            />

          ) : (
            <div className="space-y-3">
              {items.map((rootItem, rootIdx) => (
                <div
                  key={rootItem.id}
                  className={`rounded-xl border transition-all duration-200 ${
                    rootItem.is_active
                      ? "bg-[#0F141E]/80 border-white/[0.08] shadow-sm hover:border-white/20"
                      : "bg-[#0F141E]/40 border-white/[0.04] opacity-75"
                  }`}
                >
                  {/* Top-Level Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0 bg-white/[0.02] border border-white/[0.06] rounded p-0.5">
                        <button
                          onClick={() => handleMoveOrder(items, rootIdx, "up")}
                          disabled={rootIdx === 0}
                          title="Move Up"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(items, rootIdx, "down")}
                          disabled={rootIdx === items.length - 1}
                          title="Move Down"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Main Title & Type */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white truncate">{rootItem.title}</span>
                          {renderTypeBadge(rootItem.type)}

                          {rootItem.badge && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-white shadow-xs"
                              style={{ backgroundColor: rootItem.badge_color || "#EF4444" }}
                            >
                              {rootItem.badge}
                            </span>
                          )}

                          {rootItem.mega_menu_type && rootItem.mega_menu_type !== "none" && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20">
                              Mega Menu: {rootItem.mega_menu_type === "category_brand_grid" ? "Brand Grid" : rootItem.mega_menu_type}
                            </span>
                          )}

                          {!rootItem.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-slate-400 bg-white/5 border border-white/10">
                              Hidden
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono text-[11px] text-slate-500">Target:</span>
                          <span className="text-cyan-400/90 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
                            {rootItem.computed_url || rootItem.url || "#"}
                          </span>
                          {rootItem.open_in_new_tab && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> new tab
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {rootItem.type === "category" && rootItem.category_id && (
                        <button
                          onClick={() => openCategoryBrands(rootItem.category_id!, rootItem.title)}
                          className="px-2.5 py-1 text-xs font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Select brands visible in this category's dropdown"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          Category Brands
                        </button>
                      )}

                      <button
                        onClick={() => openDrawer(undefined, rootItem.id)}
                        className="p-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors flex items-center gap-1"
                        title="Add child / sub-item"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Add Sub-item</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(rootItem)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          rootItem.is_active
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "text-slate-400 bg-white/5 border border-white/10 hover:text-white"
                        }`}
                        title="Toggle visibility"
                      >
                        {rootItem.is_active ? "Active" : "Disabled"}
                      </button>

                      <button
                        onClick={() => openDrawer(rootItem)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/10 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingItem(rootItem)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/[0.02] hover:bg-rose-500/10 border border-white/10 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children / Subcategories / Brands List */}
                  {rootItem.children && rootItem.children.length > 0 && (
                    <div className="border-t border-white/[0.06] bg-black/20 px-4 py-2 space-y-1.5">
                      {rootItem.children.map((child, childIdx) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between gap-3 py-1.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleMoveOrder(rootItem.children!, childIdx, "up")}
                                disabled={childIdx === 0}
                                className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(rootItem.children!, childIdx, "down")}
                                disabled={childIdx === rootItem.children!.length - 1}
                                className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                            <span className="text-xs font-medium text-slate-200 truncate">{child.title}</span>
                            {renderTypeBadge(child.type)}

                            {child.badge && (
                              <span
                                className="text-[9px] px-1 py-0.2 rounded font-bold text-white uppercase"
                                style={{ backgroundColor: child.badge_color || "#EF4444" }}
                              >
                                {child.badge}
                              </span>
                            )}

                            <span className="text-[11px] font-mono text-slate-500 truncate hidden sm:inline">
                              {child.computed_url || child.url || "#"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleActive(child)}
                              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                child.is_active ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 bg-white/5"
                              }`}
                            >
                              {child.is_active ? "on" : "off"}
                            </button>
                            <button
                              onClick={() => openDrawer(child)}
                              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(child)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Storefront Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0B0F17] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">
                  Live Header Navbar State (Reflects API response)
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {items.filter((i) => i.is_active).length} Active Navbar Elements
              </span>
            </div>

            {previewDevice === "desktop" ? (
              /* Desktop Header Preview */
              <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0F141E] shadow-xl">
                {/* Mock Browser Header Bar */}
                <div className="bg-[#080B11] px-4 py-2 flex items-center gap-2 border-b border-white/[0.06] text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="mx-auto bg-white/5 px-4 py-1 rounded text-[11px] font-mono text-slate-400 w-1/2 text-center truncate">
                    https://your-store.com
                  </div>
                </div>

                {/* Rendered Navbar Simulation */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0F141E]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
                      {theme?.store_brand_name ? theme.store_brand_name.charAt(0) : "A"}
                    </div>
                    <span className="font-bold text-white tracking-wide text-sm">
                      {theme?.store_brand_name || "AETHER"}
                    </span>
                  </div>

                  {/* Top-Level Menu Items */}
                  <div className="flex items-center gap-6">
                    {items
                      .filter((i) => i.is_active)
                      .map((item) => (
                        <div key={item.id} className="relative group cursor-pointer py-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 group-hover:text-cyan-400 transition-colors">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold text-white"
                                style={{ backgroundColor: item.badge_color || "#EF4444" }}
                              >
                                {item.badge}
                              </span>
                            )}
                            {(item.mega_menu_type !== "none" || (item.children && item.children.length > 0)) && (
                              <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400">
                      🔍
                    </div>
                    <div className="w-7 h-7 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400">
                      🛒
                    </div>
                  </div>
                </div>

                <div className="p-12 text-center text-slate-500 text-xs font-mono">
                  Storefront Page Content Simulation
                </div>
              </div>
            ) : (
              /* Mobile Drawer Preview */
              <div className="max-w-sm mx-auto border border-white/10 rounded-2xl overflow-hidden bg-[#0F141E] shadow-2xl">
                <div className="bg-[#080B11] p-3 text-center text-[10px] font-mono text-slate-400 border-b border-white/[0.06]">
                  Mobile Drawer Simulation
                </div>
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{theme?.store_brand_name || "AETHER"}</span>
                  <X className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-2 space-y-1">
                  {items
                    .filter((i) => i.is_active)
                    .map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-200">{item.title}</span>
                          {item.badge && (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded font-bold text-white"
                              style={{ backgroundColor: item.badge_color || "#EF4444" }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.children && item.children.length > 0 && (
                          <div className="pl-3 pt-2 space-y-1 mt-1 border-l border-white/10">
                            {item.children
                              .filter((c) => c.is_active)
                              .map((c) => (
                                <div key={c.id} className="text-[11px] text-slate-400 py-0.5">
                                  • {c.title}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER: Add / Edit Navigation Item */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="bg-[#0F141E] border-l border-white/10 text-white w-full sm:max-w-lg p-0 overflow-y-auto">
          <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0F141E] z-10">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ListTree className="w-5 h-5 text-cyan-400" />
              {editingItem ? "Edit Navigation Item" : "New Navigation Item"}
            </SheetTitle>
            <p className="text-xs text-slate-400 mt-1">
              Configure destination, presentation, badge, and mega-menu settings.
            </p>
          </div>

          <form onSubmit={handleSaveItem} className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Display Title / Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Disposable, Audio Gear, Best Sellers..."
                required
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Parent Item */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Parent Menu Level</label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value === "root" ? "root" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="root">Top-Level Header Item (Root)</option>
                {options.potential_parents
                  .filter((p) => !editingItem || p.id !== editingItem.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      Under: {p.title} ({p.type})
                    </option>
                  ))}
              </select>
            </div>

            {/* Item Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["category", "subcategory", "brand", "custom", "dropdown_group"] as NavbarItemType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFormType(t);
                      if (t === "category" && options.root_categories.length > 0 && !formCategoryId) {
                        setFormCategoryId(options.root_categories[0].id);
                        setFormTitle((prev) => prev || options.root_categories[0].name);
                      }
                      if (t === "brand" && options.brands.length > 0 && !formBrandId) {
                        setFormBrandId(options.brands[0].id);
                        setFormTitle((prev) => prev || options.brands[0].name);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium capitalize border transition-all text-center ${
                      formType === t
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
                        : "bg-black/20 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Target Selectors */}
            {formType === "category" && (
              <div className="space-y-1.5 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <label className="text-xs font-medium text-slate-300">Select Root Category</label>
                <select
                  value={formCategoryId ?? ""}
                  onChange={(e) => {
                    const catId = Number(e.target.value);
                    setFormCategoryId(catId);
                    const selected = options.root_categories.find((c) => c.id === catId);
                    if (selected && !formTitle) setFormTitle(selected.name);
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Category --</option>
                  {options.root_categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (/category/{cat.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formType === "subcategory" && (
              <div className="space-y-3 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Parent Category</label>
                  <select
                    value={formCategoryId ?? ""}
                    onChange={(e) => {
                      setFormCategoryId(Number(e.target.value));
                      setFormSubcategoryId(null);
                    }}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Select Parent Category --</option>
                    {options.root_categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Subcategory Target</label>
                  <select
                    value={formSubcategoryId ?? ""}
                    onChange={(e) => {
                      const subId = Number(e.target.value);
                      setFormSubcategoryId(subId);
                      const selected = options.subcategories.find((s) => s.id === subId);
                      if (selected && !formTitle) setFormTitle(selected.name);
                    }}
                    disabled={!formCategoryId}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                  >
                    <option value="">-- Select Subcategory --</option>
                    {filteredSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (/category/.../{sub.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formType === "brand" && (
              <div className="space-y-1.5 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <label className="text-xs font-medium text-slate-300">Select Brand Target</label>
                <select
                  value={formBrandId ?? ""}
                  onChange={(e) => {
                    const bId = Number(e.target.value);
                    setFormBrandId(bId);
                    const selected = options.brands.find((b) => b.id === bId);
                    if (selected && !formTitle) setFormTitle(selected.name);
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Brand --</option>
                  {options.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (/brand/{b.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formType === "custom" && (
              <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <label className="text-xs font-medium text-slate-300">Custom Destination URL</label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="e.g. /deals, /brands, https://..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500">Presets:</span>
                  {["/", "/products", "/brands", "/deals", "/products?is_featured=true"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormUrl(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-mono transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mega Menu Options (for Top-Level) */}
            {formParentId === "root" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Dropdown / Mega-Menu Behavior</label>
                <select
                  value={formMegaMenuType}
                  onChange={(e) => setFormMegaMenuType(e.target.value as MegaMenuType)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="none">None (Simple direct link)</option>
                  <option value="category_brand_grid">Category + Brands Grid (Professional Mega Menu)</option>
                  <option value="columns">Multi-Column Subcategories</option>
                  <option value="standard_dropdown">Standard Compact Dropdown</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  {formMegaMenuType === "category_brand_grid" &&
                    "Displays subcategories alongside featured brands and brand logos for industry-level UX."}
                </p>
              </div>
            )}

            {/* Badge Indicator */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Badge Text (Optional)</label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="e.g. HOT, NEW, 50% OFF"
                  maxLength={20}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Badge Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formBadgeColor}
                    onChange={(e) => setFormBadgeColor(e.target.value)}
                    className="w-9 h-9 rounded bg-transparent cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={formBadgeColor}
                    onChange={(e) => setFormBadgeColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-200">Active (Visible in storefront navbar)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOpenInNewTab}
                  onChange={(e) => setFormOpenInNewTab(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-200">Open destination in new tab</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-sm shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* MODAL: Manage Category Brands */}
      {categoryBrandsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F141E] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  Configure Brands for {categoryBrandsModal.categoryName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select which brands are featured inside this category&apos;s mega-menu dropdown.
                </p>
              </div>
              <button
                onClick={() => setCategoryBrandsModal((prev) => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryBrandsModal.loading ? (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-xs">Loading brand relationships...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {categoryBrandsModal.allBrands.map((brand) => {
                    const isLinked = categoryBrandsModal.linkedBrands.some((b) => b.id === brand.id);
                    return (
                      <div
                        key={brand.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isLinked
                            ? "bg-purple-500/10 border-purple-500/30 text-white"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCategoryBrandsModal((prev) => ({
                                  ...prev,
                                  linkedBrands: [
                                    ...prev.linkedBrands,
                                    {
                                      id: brand.id,
                                      name: brand.name,
                                      slug: brand.slug,
                                      is_in_navbar: true,
                                      is_featured: false,
                                    },
                                  ],
                                }));
                              } else {
                                setCategoryBrandsModal((prev) => ({
                                  ...prev,
                                  linkedBrands: prev.linkedBrands.filter((b) => b.id !== brand.id),
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded bg-black/40 border-white/20 text-purple-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-medium">{brand.name}</span>
                        </div>

                        {isLinked && (
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                            Visible in Mega Menu
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryBrandsModal((prev) => ({ ...prev, open: false }))}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryBrands}
                disabled={categoryBrandsModal.saving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {categoryBrandsModal.saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Brands Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F141E] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Navigation Item</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-white">&apos;{deletingItem.title}&apos;</span>? If this item has sub-items, they will also be removed from navigation.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
