"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ListTree,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Eye,
  Building2,
  ChevronRight,
  ChevronDown,
  Monitor,
  Smartphone,
  Copy,
  Indent,
  Outdent,
  Wrench,
  Search,
  FolderTree,
  X,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import { NavbarItem, NavbarItemType, MegaMenuType, NavigationOptions } from "@/types";
import { navigationService } from "@/services/navigationService";
import { AdminPageHeader, AdminStatStrip, AdminEmptyState } from "@/components/admin/ui";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useThemeStore } from "@/store/useThemeStore";
import { CascadingNavDropdown } from "@/components/shared/navigation/CascadingNavDropdown";
import { CategoryBrandGridMenu } from "@/components/shared/navigation/CategoryBrandGridMenu";
import { MultiColumnNavMenu } from "@/components/shared/navigation/MultiColumnNavMenu";
import { MobileNavTree } from "@/components/shared/navigation/MobileNavTree";

export default function AdminContentNavigationPage() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<number>>(new Set());
  const { theme } = useThemeStore();

  // Drawer / Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavbarItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<NavbarItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

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

  // Desktop Preview active hover state
  const [previewHoverId, setPreviewHoverId] = useState<number | null>(null);

  // Fetch navigation data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeData, optsData] = await Promise.all([
        navigationService.getNavbarTree(),
        navigationService.getNavigationOptions(),
      ]);
      setItems(treeData || []);
      setOptions(
        optsData || {
          root_categories: [],
          subcategories: [],
          brands: [],
          pages: [],
          potential_parents: [],
        }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load header navigation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Broken target items count
  const brokenTargetCount = useMemo(() => {
    let count = 0;
    const inspectNode = (node: NavbarItem) => {
      if (node.is_valid === false) count++;
      if (node.children) node.children.forEach(inspectNode);
    };
    items.forEach(inspectNode);
    return count;
  }, [items]);

  // Statistics
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    const rootCount = items.length;

    const countItem = (item: NavbarItem) => {
      total++;
      if (item.is_active) active++;
      if (item.children) {
        item.children.forEach(countItem);
      }
    };

    items.forEach(countItem);

    return [
      { label: "Total Menu Items", value: total, helper: "Across all nesting tiers", variant: "default" as const },
      { label: "Top-Level Nav Links", value: rootCount, helper: "Directly on header bar", variant: "cyan" as const },
      { label: "Active Items", value: active, helper: "Published to storefront", variant: "emerald" as const },
      {
        label: "Broken Targets",
        value: brokenTargetCount,
        helper: brokenTargetCount > 0 ? "Requires attention" : "All links healthy",
        variant: brokenTargetCount > 0 ? ("rose" as const) : ("emerald" as const),
      },
    ];
  }, [items, brokenTargetCount]);

  // Compute set of forbidden parent IDs when editing (prevents cycle: cannot be self or any descendant)
  const forbiddenParentIds = useMemo(() => {
    if (!editingItem) return new Set<number>();
    const forbidden = new Set<number>([editingItem.id]);
    const collectDescendants = (node: NavbarItem) => {
      if (node.children) {
        for (const child of node.children) {
          forbidden.add(child.id);
          collectDescendants(child);
        }
      }
    };
    collectDescendants(editingItem);
    return forbidden;
  }, [editingItem]);

  // Toggle collapse state for a node
  const toggleCollapse = (id: number) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / Collapse all nodes
  const expandAll = () => setCollapsedNodeIds(new Set());
  const collapseAll = () => {
    const allIds = new Set<number>();
    const collectIds = (item: NavbarItem) => {
      if (item.children && item.children.length > 0) {
        allIds.add(item.id);
        item.children.forEach(collectIds);
      }
    };
    items.forEach(collectIds);
    setCollapsedNodeIds(allIds);
  };

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
      setFormMegaMenuType(parentId ? "none" : "standard_dropdown");
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
        category_id: formType === "category" || formType === "subcategory" ? formCategoryId : null,
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
        await navigationService.updateNavbarItem(editingItem.id, payload);
        toast.success(`Navigation item '${formTitle}' updated`);
      } else {
        await navigationService.createNavbarItem(payload);
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
      await navigationService.toggleActive(item.id, item.is_active);
      toast.success(`${item.title} is now ${!item.is_active ? "active" : "inactive"}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle item status");
    }
  };

  // Duplicate item and subtree
  const handleDuplicate = async (item: NavbarItem) => {
    setDuplicatingId(item.id);
    try {
      await navigationService.duplicateNavbarItem(item.id);
      toast.success(`Successfully duplicated '${item.title}' and its hierarchy`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to duplicate item");
    } finally {
      setDuplicatingId(null);
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await navigationService.deleteNavbarItem(deletingItem.id);
      toast.success(`Item '${deletingItem.title}' deleted`);
      setDeletingItem(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete navigation item");
    } finally {
      setDeleting(false);
    }
  };

  // Move order up / down among siblings
  const handleMoveOrder = async (siblings: NavbarItem[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reorderPayload = reordered.map((item, idx) => ({
      id: item.id,
      display_order: idx,
      parent_id: item.parent_id ?? null,
    }));

    try {
      await navigationService.reorderNavbarItems(reorderPayload);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update navigation ordering");
    }
  };

  // Indent: Move item in as a child of its previous sibling
  const handleIndent = async (item: NavbarItem, prevSibling: NavbarItem) => {
    try {
      const childCount = prevSibling.children?.length ?? 0;
      await navigationService.updateNavbarItem(item.id, {
        parent_id: prevSibling.id,
        display_order: childCount,
      });
      toast.success(`Nested '${item.title}' under '${prevSibling.title}'`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to indent item");
    }
  };

  // Outdent: Move item out to become a sibling of its parent
  const handleOutdent = async (item: NavbarItem, parent: NavbarItem | null) => {
    if (!parent) return;
    try {
      await navigationService.updateNavbarItem(item.id, {
        parent_id: parent.parent_id ?? null,
        display_order: parent.display_order + 1,
      });
      toast.success(`Moved '${item.title}' up one level`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to outdent item");
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
      const res = await navigationService.getCategoryBrands(categoryId);
      setCategoryBrandsModal({
        open: true,
        categoryId,
        categoryName,
        loading: false,
        linkedBrands: (res.linked_brands || []).map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          is_in_navbar: Boolean(b.is_in_navbar),
          is_featured: Boolean(b.is_featured),
        })),
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
      await navigationService.updateCategoryBrands(
        categoryBrandsModal.categoryId,
        categoryBrandsModal.linkedBrands.map((b, idx) => ({
          brand_id: b.id,
          display_order: idx,
          is_in_navbar: true,
          is_featured: b.is_featured ?? false,
        }))
      );
      toast.success("Category brand relationships saved");
      setCategoryBrandsModal((prev) => ({ ...prev, open: false, saving: false }));
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to update category brands");
      setCategoryBrandsModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const renderTypeBadge = (type: NavbarItemType) => {
    switch (type) {
      case "category":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
            Category
          </span>
        );
      case "subcategory":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20">
            Subcategory
          </span>
        );
      case "brand":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20">
            Brand
          </span>
        );
      case "dropdown_group":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20">
            Group Header
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-slate-400 bg-white/5 border border-white/10">
            Custom Link
          </span>
        );
    }
  };

  // Filtered subcategories based on selected parent category
  const filteredSubcategories = useMemo(() => {
    if (!formCategoryId) return [];
    return options.subcategories.filter((sub) => sub.parent_id === formCategoryId);
  }, [formCategoryId, options.subcategories]);

  // Filtered items based on search query
  const matchesSearch = useCallback(
    (item: NavbarItem): boolean => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const urlMatch = (item.computed_url || item.url || "").toLowerCase().includes(q);
      const typeMatch = item.type?.toLowerCase().includes(q);
      if (titleMatch || urlMatch || typeMatch) return true;
      if (item.children) {
        return item.children.some(matchesSearch);
      }
      return false;
    },
    [searchQuery]
  );

  // Recursive Tree Node Renderer
  const renderTreeNode = (
    item: NavbarItem,
    siblings: NavbarItem[],
    index: number,
    depth: number = 0,
    parent: NavbarItem | null = null
  ) => {
    if (!matchesSearch(item)) return null;

    const isFirst = index === 0;
    const isLast = index === siblings.length - 1;
    const prevSibling = !isFirst ? siblings[index - 1] : null;
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isCollapsed = collapsedNodeIds.has(item.id);
    const isBroken = item.is_valid === false;

    return (
      <div key={item.id} className="space-y-2">
        <div
          className={`rounded-xl border transition-all duration-200 ${
            isBroken
              ? "bg-rose-950/20 border-rose-500/40 shadow-xs"
              : item.is_active
              ? depth === 0
                ? "bg-[#0F141E]/90 border-white/[0.09] shadow-sm hover:border-white/20"
                : "bg-[#121826]/80 border-white/[0.06] hover:border-white/15"
              : "bg-[#0F141E]/40 border-white/[0.04] opacity-70"
          }`}
        >
          <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Reorder & Hierarchy controls + Title info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Hierarchy Position Controls: Move Up, Move Down, Indent, Outdent */}
              <div className="flex items-center gap-0.5 shrink-0 bg-white/[0.03] border border-white/[0.07] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleMoveOrder(siblings, index, "up")}
                  disabled={isFirst}
                  title="Move Up among siblings"
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveOrder(siblings, index, "down")}
                  disabled={isLast}
                  title="Move Down among siblings"
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                {/* Indent (Move in under prev sibling) */}
                <button
                  type="button"
                  onClick={() => prevSibling && handleIndent(item, prevSibling)}
                  disabled={!prevSibling}
                  title={prevSibling ? `Indent under '${prevSibling.title}'` : "Cannot indent first item"}
                  className="p-1 rounded text-slate-400 hover:text-cyan-400 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
                {/* Outdent (Move out to become parent sibling) */}
                <button
                  type="button"
                  onClick={() => handleOutdent(item, parent)}
                  disabled={!parent}
                  title={parent ? "Outdent to level above" : "Already top-level"}
                  className="p-1 rounded text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expand / Collapse toggle for parents */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleCollapse(item.id)}
                  className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                  title={isCollapsed ? "Expand children" : "Collapse children"}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}

              {/* Title, Badges, and Target URL */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {depth > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/5 text-slate-400 border border-white/10">
                      Tier {depth + 1}
                    </span>
                  )}
                  <span className="font-semibold text-sm text-white truncate">{item.title}</span>
                  {renderTypeBadge(item.type)}

                  {item.badge && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-white shadow-xs"
                      style={{ backgroundColor: item.badge_color || "#EF4444" }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.mega_menu_type && item.mega_menu_type !== "none" && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20">
                      Mega Menu: {item.mega_menu_type === "category_brand_grid" ? "Brand Grid" : item.mega_menu_type}
                    </span>
                  )}

                  {!item.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-slate-400 bg-white/5 border border-white/10">
                      Hidden
                    </span>
                  )}

                  {hasChildren && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({item.children!.length} sub-item{item.children!.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  {isBroken ? (
                    /* ACTIONABLE WARNING BADGE */
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Broken Target: {item.invalid_reason || "Referenced target missing"}</span>
                      <button
                        type="button"
                        onClick={() => openDrawer(item)}
                        className="ml-1 text-[10px] text-rose-200 underline hover:text-white font-bold inline-flex items-center gap-0.5"
                      >
                        <Wrench className="w-2.5 h-2.5" /> Fix Target
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-slate-500">Destination:</span>
                      <span className="text-cyan-400/90 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
                        {item.computed_url || item.url || (item.type === "dropdown_group" ? "(Group Container)" : "No Link")}
                      </span>
                    </>
                  )}

                  {item.open_in_new_tab && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> new tab
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0 flex-wrap">
              {item.type === "category" && item.category_id && (
                <button
                  type="button"
                  onClick={() => openCategoryBrands(item.category_id!, item.title)}
                  className="px-2.5 py-1 text-xs font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Select brands visible in this category's dropdown"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Category Brands
                </button>
              )}

              {/* Add Sub-item under THIS node at any depth */}
              <button
                type="button"
                onClick={() => openDrawer(undefined, item.id)}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors flex items-center gap-1"
                title={`Add sub-item under ${item.title}`}
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Sub-item</span>
              </button>

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => handleDuplicate(item)}
                disabled={duplicatingId === item.id}
                className="p-1.5 text-slate-400 hover:text-cyan-400 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Duplicate this item and all sub-items"
              >
                {duplicatingId === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Toggle Active */}
              <button
                type="button"
                onClick={() => handleToggleActive(item)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  item.is_active
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                    : "text-slate-400 bg-white/5 border border-white/10 hover:text-white"
                }`}
                title="Toggle visibility on storefront"
              >
                {item.is_active ? "Active" : "Disabled"}
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => openDrawer(item)}
                className="p-1.5 text-slate-400 hover:text-cyan-400 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/10 rounded-lg transition-colors"
                title="Edit Item"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeletingItem(item)}
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/[0.02] hover:bg-rose-500/10 border border-white/10 rounded-lg transition-colors"
                title="Delete Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recursive Child Branches (Arbitrary Depth up to backend limit) */}
        {hasChildren && !isCollapsed && (
          <div className="pl-4 sm:pl-6 border-l-2 border-cyan-500/25 ml-3 sm:ml-4 space-y-2 mt-2">
            {item.children!.map((child, childIdx) =>
              renderTreeNode(child, item.children!, childIdx, depth + 1, item)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <SettingsNavTabs />

      {/* Header */}
      <AdminPageHeader
        title="Storefront Navigation"
        badge="Hierarchical Menu Engine"
        badgeVariant="cyan"
        description="Single canonical interface for storefront navigation. Manage top-level headers, nested categories, cascading dropdown menus, brand matrices, and custom links with instant storefront sync."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content / CMS", href: "/admin/content/navigation" },
          { label: "Navigation" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => openDrawer()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-sm shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Navigation Item
            </button>
          </div>
        }
      />

      {/* Stats Strip */}
      <AdminStatStrip stats={stats} columns={4} />

      {/* Actionable Warning Banner for broken targets */}
      {brokenTargetCount > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>{brokenTargetCount} navigation item(s)</strong> reference deleted or missing catalog targets.
              They are automatically hidden from the storefront to prevent dead links. Inspect the red badges below to fix or re-link them.
            </span>
          </div>
        </div>
      )}

      {/* Tabs: Tree Manager vs Live Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("tree")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tree"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <ListTree className="w-3.5 h-3.5 text-cyan-400" />
            Navigation Tree & Hierarchy
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "preview"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Live Storefront Navbar Preview
          </button>
        </div>

        {activeTab === "tree" && items.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tree items..."
                className="pl-8 pr-3 py-1 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={expandAll}
              title="Expand All Branches"
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              title="Collapse All Branches"
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === "desktop" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop (Cascading)
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === "mobile" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Drawer (Accordion)
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer"
                >
                  Add First Navigation Item
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {items.map((rootItem, rootIdx) =>
                renderTreeNode(rootItem, items, rootIdx, 0, null)
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Storefront Navbar Dual Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0B0F17] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">
                  Live Storefront Navbar Preview Simulation ({previewDevice === "desktop" ? "Desktop Cascading" : "Mobile Accordion"})
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {items.filter((i) => i.is_active && i.is_valid !== false).length} Active Live Elements
              </span>
            </div>

            {previewDevice === "desktop" ? (
              /* Desktop Header Preview using actual Presentation Renderers */
              <div className="border border-white/10 rounded-lg overflow-visible bg-[#0F141E] shadow-xl relative min-h-[320px]">
                {/* Mock Browser Header Bar */}
                <div className="bg-[#080B11] px-4 py-2 flex items-center gap-2 border-b border-white/[0.06] text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="mx-auto bg-white/5 px-4 py-1 rounded text-[11px] font-mono text-slate-400 w-1/2 text-center truncate">
                    Storefront Live Desktop Simulation
                  </div>
                </div>

                {/* Rendered Dynamic Header Simulation */}
                <div className="px-6 py-2.5 flex items-center justify-between border-b border-white/[0.08] bg-[#0F141E] relative">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-[#005826] flex items-center justify-center font-bold text-white text-sm">
                      {theme?.store_brand_name?.charAt(0) || "S"}
                    </div>
                    <span className="font-bold text-white tracking-wide text-sm">
                      {theme?.store_brand_name || "INHALIQ"}
                    </span>
                  </div>

                  {/* Top-Level Menu Items with Cascading Dropdown */}
                  <div className="flex items-center gap-2 relative">
                    {items
                      .filter((i) => i.is_active && i.is_valid !== false)
                      .map((item, itemIdx, arr) => {
                        const isHovered = previewHoverId === item.id;
                        const hasChildren =
                          (item.children && item.children.length > 0) ||
                          (item.mega_menu_type === "category_brand_grid" &&
                            ((item.brands && item.brands.length > 0) || (item.subcategories && item.subcategories.length > 0)));
                        const isRightSide = itemIdx >= Math.ceil(arr.length / 2);

                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setPreviewHoverId(item.id)}
                            onMouseLeave={() => setPreviewHoverId(null)}
                            className="relative"
                          >
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                isHovered
                                  ? "text-cyan-400 bg-white/10"
                                  : "text-slate-300 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span>{item.title}</span>
                              {item.badge && (
                                <span
                                  className="text-[9px] px-1.5 py-0.2 rounded font-black text-white uppercase shadow-xs"
                                  style={{ backgroundColor: item.badge_color || "#EF4444" }}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {hasChildren && (
                                <ChevronDown
                                  className={`w-3 h-3 text-slate-400 transition-transform ${
                                    isHovered ? "rotate-180 text-cyan-400" : ""
                                  }`}
                                />
                              )}
                            </button>

                            {/* Dropdown Presenters */}
                            {isHovered && hasChildren && (
                              item.mega_menu_type === "category_brand_grid" ? (
                                <CategoryBrandGridMenu
                                  item={item}
                                  isOpen={isHovered}
                                  onClose={() => setPreviewHoverId(null)}
                                  align={isRightSide ? "right" : "left"}
                                />
                              ) : item.mega_menu_type === "columns" ? (
                                <MultiColumnNavMenu
                                  item={item}
                                  isOpen={isHovered}
                                  onClose={() => setPreviewHoverId(null)}
                                  align={isRightSide ? "right" : "left"}
                                />
                              ) : (
                                <CascadingNavDropdown
                                  items={item.children || []}
                                  isOpen={isHovered}
                                  onClose={() => setPreviewHoverId(null)}
                                  align={isRightSide ? "right" : "left"}
                                />
                              )
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Hover to test
                    </span>
                  </div>
                </div>

                <div className="p-16 text-center text-slate-500 text-xs font-mono">
                  Move your mouse over the items above to experience the dynamic cascading dropdown in real-time.
                </div>
              </div>
            ) : (
              /* Mobile Drawer Preview using actual MobileNavTree */
              <div className="max-w-sm mx-auto border border-white/10 rounded-2xl overflow-hidden bg-[#0F141E] shadow-2xl">
                <div className="bg-[#080B11] p-3 text-center text-[10px] font-mono text-slate-400 border-b border-white/[0.06]">
                  Mobile Accordion Simulation
                </div>
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{theme?.store_brand_name || "INHALIQ"}</span>
                  <X className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-3">
                  <MobileNavTree items={items.filter((i) => i.is_active && i.is_valid !== false)} />
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
              {editingItem ? `Edit '${editingItem.title}'` : "New Navigation Item"}
            </SheetTitle>
            <p className="text-xs text-slate-400 mt-1">
              Configure destination, nesting hierarchy, badge, and storefront presentation.
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
                placeholder="e.g. Disposable, Voltbar, 10mg Nic Salt..."
                required
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Parent Item Selector (Hierarchy Path Breadcrumb, Cycle Protected) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Parent Navigation Item <span className="text-slate-500 text-[11px]">(Nesting Hierarchy)</span>
              </label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value === "root" ? "root" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
              >
                <option value="root">● Top-Level Header Item (Root)</option>
                {options.potential_parents
                  .filter((p) => !forbiddenParentIds.has(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      ↳ {p.path || p.title} ({p.type})
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Any item can be a parent. Items cannot be parented under themselves or their descendants.
              </p>
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
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium capitalize border transition-all text-center cursor-pointer ${
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
              <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Select Category Target</label>
                  <Link
                    href="/admin/categories"
                    target="_blank"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage Categories</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <select
                  value={formCategoryId ?? ""}
                  onChange={(e) => {
                    const catId = Number(e.target.value);
                    setFormCategoryId(catId);
                    const selected = options.root_categories.find((c) => c.id === catId);
                    if (selected && !formTitle) setFormTitle(selected.name);
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Subcategory Destination</span>
                  <Link
                    href="/admin/categories"
                    target="_blank"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage Categories</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Parent Category</label>
                  <select
                    value={formCategoryId ?? ""}
                    onChange={(e) => {
                      setFormCategoryId(Number(e.target.value));
                      setFormSubcategoryId(null);
                    }}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
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
                  <label className="text-[11px] font-medium text-slate-400">Subcategory Target</label>
                  <select
                    value={formSubcategoryId ?? ""}
                    onChange={(e) => {
                      const subId = Number(e.target.value);
                      setFormSubcategoryId(subId);
                      const selected = options.subcategories.find((s) => s.id === subId);
                      if (selected && !formTitle) setFormTitle(selected.name);
                    }}
                    disabled={!formCategoryId}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40 cursor-pointer"
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
              <div className="space-y-2 p-3 rounded-lg bg-black/30 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Select Brand Target</label>
                  <Link
                    href="/admin/brands"
                    target="_blank"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage Brands</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <select
                  value={formBrandId ?? ""}
                  onChange={(e) => {
                    const bId = Number(e.target.value);
                    setFormBrandId(bId);
                    const selected = options.brands.find((b) => b.id === bId);
                    if (selected && !formTitle) setFormTitle(selected.name);
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
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
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formType === "dropdown_group" && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <strong>Organizational Header:</strong> This item acts as a non-clickable title (e.g. &apos;Shop by Brand&apos;) that organizes child links in dropdowns.
              </div>
            )}

            {/* Presentation Mode (for Top-Level items) */}
            {formParentId === "root" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Desktop Dropdown Presentation</label>
                <select
                  value={formMegaMenuType}
                  onChange={(e) => setFormMegaMenuType(e.target.value as MegaMenuType)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="none">Standard Cascading Flyout (Default, Compact)</option>
                  <option value="standard_dropdown">Standard Cascading Flyout</option>
                  <option value="category_brand_grid">Category + Brand Grid (Mega Menu)</option>
                  <option value="columns">Multi-Column Subcategories List</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  By default, all items render as a sleek compact cascading flyout that supports arbitrary nesting tiers.
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
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Active (Visible on public storefront)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOpenInNewTab}
                  onChange={(e) => setFormOpenInNewTab(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">Open destination in new tab</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-sm shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                className="text-slate-400 hover:text-white cursor-pointer"
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
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryBrands}
                disabled={categoryBrandsModal.saving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
              Are you sure you want to remove <span className="font-semibold text-white">&apos;{deletingItem.title}&apos;</span>? If this item has child or grandchild items, they will also be permanently removed from the navigation tree.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
