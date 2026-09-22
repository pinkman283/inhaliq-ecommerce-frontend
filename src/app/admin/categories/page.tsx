"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  FolderTree, 
  Folder,
  Plus, 
  Search,
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Sparkles,
  Layers,
  X,
  RotateCcw,
  ExternalLink,
  Loader2,
  CornerDownRight,
  ChevronRight,
  ChevronDown,
  Filter,
  LayoutList,
  Boxes,
  Upload
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Category } from "@/types";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { optimizeImageForUpload } from "@/lib/imageOptimizer";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "root_only" | "sub_only" | "level_2" | "level_3">("all");
  const [selectedRootId, setSelectedRootId] = useState<number | "all">("all");
  const [selectedParentId, setSelectedParentId] = useState<number | "all">("all");
  const [viewMode, setViewMode] = useState<"tree" | "table">("table");
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<number[]>([]);

  // View Category Modal State
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [parentId, setParentId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [badge, setBadge] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isFeatured, setIsFeatured] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Ancestry Helper: Builds the full parent chain for any category [Root, Level2, Level3...]
  const getCategoryPath = (cat: Category): Category[] => {
    const path: Category[] = [];
    let current: Category | undefined = cat;
    const visited = new Set<number>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      if (current.parent_id) {
        current = categories.find((c) => c.id === current?.parent_id) || (current.parent as Category | undefined);
      } else {
        break;
      }
    }
    return path;
  };

  const getCategoryLevel = (cat: Category): number => {
    return getCategoryPath(cat).length;
  };

  const getRootCategory = (cat: Category): Category => {
    const path = getCategoryPath(cat);
    return path[0] || cat;
  };

  // Distinct Root Categories for Filter Dropdown
  const rootCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parent_id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
  }, [categories]);

  // Distinct Parent Categories (Categories that have at least one child)
  const parentOptions = useMemo(() => {
    const parentIdSet = new Set(categories.map((c) => c.parent_id).filter(Boolean));
    return categories
      .filter((c) => parentIdSet.has(c.id))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
  }, [categories]);

  // Total Metric Counts
  const stats = useMemo(() => {
    const total = categories.length;
    const rootCount = categories.filter((c) => !c.parent_id).length;
    const subCount = total - rootCount;
    const deepCount = categories.filter((c) => getCategoryLevel(c) >= 3).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
    return { total, rootCount, subCount, deepCount, totalProducts };
  }, [categories]);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const level = getCategoryLevel(c);
      const rootCat = getRootCategory(c);

      // 1. Hierarchy Type Filter
      if (typeFilter === "root_only" && c.parent_id !== null) return false;
      if (typeFilter === "sub_only" && c.parent_id === null) return false;
      if (typeFilter === "level_2" && level !== 2) return false;
      if (typeFilter === "level_3" && level < 3) return false;

      // 2. Root Branch Filter
      if (selectedRootId !== "all" && rootCat.id !== selectedRootId) return false;

      // 3. Specific Parent Filter
      if (selectedParentId !== "all" && c.parent_id !== selectedParentId) return false;

      // 4. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const pathString = getCategoryPath(c).map((p) => p.name).join(" > ").toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchSlug = c.slug.toLowerCase().includes(query);
        const matchBadge = c.badge?.toLowerCase().includes(query) || false;
        const matchDesc = c.description?.toLowerCase().includes(query) || false;
        const matchPath = pathString.includes(query);
        if (!matchName && !matchSlug && !matchBadge && !matchDesc && !matchPath) {
          return false;
        }
      }

      return true;
    });
  }, [categories, typeFilter, selectedRootId, selectedParentId, search]);

  // Hierarchically Sorted Categories for Table View (Parents immediately followed by children)
  const hierarchicallySortedCategories = useMemo(() => {
    const map = new Map<number, Category>();
    const childrenMap = new Map<number | null, Category[]>();

    filteredCategories.forEach((c) => {
      map.set(c.id, c);
      const pid = c.parent_id ?? null;
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(c);
    });

    childrenMap.forEach((list) => {
      list.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
    });

    const result: Category[] = [];
    const visited = new Set<number>();

    function traverse(pid: number | null) {
      const list = childrenMap.get(pid) || [];
      list.forEach((item) => {
        if (!visited.has(item.id)) {
          visited.add(item.id);
          result.push(item);
          traverse(item.id);
        }
      });
    }

    // Traverse root nodes first
    traverse(null);

    // If filtered list has orphaned subcategories (e.g. when filtering by sub_only), add them
    filteredCategories.forEach((c) => {
      if (!visited.has(c.id)) {
        result.push(c);
        visited.add(c.id);
      }
    });

    return result;
  }, [filteredCategories]);

  // Tree View Data: Group filtered categories by Root
  const treeData = useMemo(() => {
    const rootMap = new Map<number, { root: Category; items: Category[] }>();

    // Initialize with all root categories that match root filter
    rootCategories.forEach((r) => {
      if (selectedRootId === "all" || r.id === selectedRootId) {
        rootMap.set(r.id, { root: r, items: [] });
      }
    });

    // Populate items using hierarchicallySortedCategories
    hierarchicallySortedCategories.forEach((cat) => {
      const root = getRootCategory(cat);
      if (!rootMap.has(root.id)) {
        rootMap.set(root.id, { root, items: [] });
      }
      if (cat.id !== root.id) {
        rootMap.get(root.id)!.items.push(cat);
      }
    });

    // Filter out root buckets that have no items if a search/filter was applied and root itself isn't matching
    return Array.from(rootMap.values()).filter((group) => {
      const rootMatches = filteredCategories.some((c) => c.id === group.root.id);
      return rootMatches || group.items.length > 0;
    });
  }, [filteredCategories, rootCategories, selectedRootId, hierarchicallySortedCategories]);

  const handleOpenCreate = (parentCat?: Category | null) => {
    setEditingCategory(null);
    setParentId(parentCat ? parentCat.id : null);
    setName("");
    setDescription("");
    setImage("");
    setIcon("Sparkles");
    setBadge(parentCat ? "" : "Flagship Line");
    setDisplayOrder("0");
    setIsFeatured(true);
    setMetaTitle("");
    setMetaDescription("");
    setImageAlt("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setParentId(c.parent_id ?? null);
    setName(c.name);
    setDescription(c.description || "");
    setImage(c.image || "");
    setIcon(c.icon || "Sparkles");
    setBadge(c.badge || "");
    setDisplayOrder((c.display_order ?? 0).toString());
    setIsFeatured(c.is_featured ?? false);
    setMetaTitle(c.meta_title || "");
    setMetaDescription(c.meta_description || "");
    setImageAlt(c.image_alt || "");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP, GIF, AVIF).");
      return;
    }

    if (file.type === "image/svg+xml") {
      toast.error("SVG vector files are not supported for category cover images. Please select a JPG, PNG, WEBP, or AVIF image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be less than 20MB.");
      return;
    }

    setUploadingImage(true);
    try {
      // Auto-optimize & downscale high-resolution images to fit comfortably within server upload limits
      const fileToUpload = await optimizeImageForUpload(file, {
        maxDimension: 1600,
        maxSizeBytes: 1.5 * 1024 * 1024,
        quality: 0.88,
      });

      const res = await adminApi.uploadCategoryImage(fileToUpload);
      setImage(res.image_url);
      toast.success("Image uploaded from device successfully.");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors?.image?.[0] ||
        err.response?.data?.message ||
        "Failed to upload image from device.";
      toast.error(errMsg);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const isEditDirty = Boolean(
    editingCategory && (
      parentId !== (editingCategory.parent_id ?? null) ||
      name.trim() !== (editingCategory.name || "").trim() ||
      description.trim() !== (editingCategory.description || "").trim() ||
      image.trim() !== (editingCategory.image || "").trim() ||
      icon.trim() !== (editingCategory.icon || "Sparkles").trim() ||
      badge.trim() !== (editingCategory.badge || "").trim() ||
      displayOrder !== (editingCategory.display_order ?? 0).toString() ||
      isFeatured !== (editingCategory.is_featured ?? false) ||
      metaTitle.trim() !== (editingCategory.meta_title || "").trim() ||
      metaDescription.trim() !== (editingCategory.meta_description || "").trim() ||
      imageAlt.trim() !== (editingCategory.image_alt || "").trim()
    )
  );

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }
    setSaving(true);

    const payload = {
      parent_id: parentId,
      name,
      description,
      image: image.trim() || null,
      icon,
      badge: badge || null,
      display_order: Number(displayOrder),
      is_featured: isFeatured,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      image_alt: imageAlt || null,
    };

    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory.id, payload);
        await loadCategories();
        toast.success(`Category '${res.category?.name || name}' updated.`);
      } else {
        const res = await adminApi.createCategory(payload);
        await loadCategories();
        toast.success(`Category '${res.category?.name || name}' created.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleting(true);

    try {
      await adminApi.deleteCategory(deletingCategory.id);
      setCategories(categories.filter((c) => c.id !== deletingCategory.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingCategory.id));
      toast.success(`Category '${deletingCategory.name}' deleted.`);
      setDeletingCategory(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (hierarchicallySortedCategories.length > 0 && selectedIds.length === hierarchicallySortedCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(hierarchicallySortedCategories.map((c) => c.id));
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
      const res = await adminApi.bulkDeleteCategories(selectedIds);
      const updated = await adminApi.getCategories();
      setCategories(updated || []);
      setSelectedIds([]);
      if (res.deleted_count === 0 && (res.skipped_count ?? 0) > 0) {
        toast.error(res.message);
      } else if ((res.skipped_count ?? 0) > 0) {
        toast.warning(res.message);
      } else {
        toast.success(res.message || `Processed category deletion.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete selected categories.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSelectedRootId("all");
    setSelectedParentId("all");
    toast.success("All category filters reset.");
  };

  const isFiltered = Boolean(
    search.trim() ||
    typeFilter !== "all" ||
    selectedRootId !== "all" ||
    selectedParentId !== "all"
  );

  const toggleCollapseTree = (rootId: number) => {
    setCollapsedTreeIds((prev) =>
      prev.includes(rootId) ? prev.filter((id) => id !== rootId) : [...prev, rootId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            Taxonomy & Navigation
          </span>
          <h1 className="text-2xl font-black text-white">Categories ({categories.length})</h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0e121e] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "tree"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreate(null)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Root Category
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Cards & Filter Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => { setTypeFilter("all"); setSelectedRootId("all"); setSelectedParentId("all"); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "all" && selectedRootId === "all" && selectedParentId === "all"
              ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Total Items</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">All taxonomy items</p>
        </button>

        <button
          onClick={() => { setTypeFilter("root_only"); setSelectedRootId("all"); setSelectedParentId("all"); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "root_only"
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Root Categories</span>
            <Folder className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.rootCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Top-level store departments</p>
        </button>

        <button
          onClick={() => { setTypeFilter("sub_only"); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "sub_only"
              ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Subcategories</span>
            <FolderTree className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-400 mt-1">{stats.subCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">All nested subcategories</p>
        </button>

        <button
          onClick={() => { setTypeFilter("level_3"); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "level_3"
              ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-[#0e121e] border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Deep Subcategories</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-indigo-400 mt-1">{stats.deepCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Level 3+ leaf items</p>
        </button>
      </div>

      {/* Powerful Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#0e121e] border border-white/10 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category, subcategory, slug..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9.5 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Hierarchy Level */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-[#131722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Levels (Root & Subcategories)</option>
              <option value="root_only">📁 Root Categories Only (Level 1)</option>
              <option value="sub_only">↳ All Subcategories (Level 2+)</option>
              <option value="level_2">↳ Direct Subcategories (Level 2)</option>
              <option value="level_3">↳↳ Deep Subcategories (Level 3+)</option>
            </select>
          </div>

          {/* Filter by Root Branch */}
          <div>
            <select
              value={selectedRootId === "all" ? "all" : selectedRootId}
              onChange={(e) => setSelectedRootId(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full bg-[#131722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Root Department Branches</option>
              {rootCategories.map((root) => (
                <option key={root.id} value={root.id}>
                  📁 Branch: {root.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Specific Parent */}
          <div className="flex items-center gap-2">
            <select
              value={selectedParentId === "all" ? "all" : selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full bg-[#131722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Parent Categories</option>
              {parentOptions.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  Under: {parent.name}
                </option>
              ))}
            </select>

            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {isFiltered && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5 text-[11px]">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Active Filters:
            </span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearch("")} />
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                Level: {typeFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setTypeFilter("all")} />
              </span>
            )}
            {selectedRootId !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                Branch: {rootCategories.find((r) => r.id === selectedRootId)?.name || selectedRootId}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedRootId("all")} />
              </span>
            )}
            {selectedParentId !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Parent: {categories.find((c) => c.id === selectedParentId)?.name || selectedParentId}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedParentId("all")} />
              </span>
            )}
            <span className="text-slate-400 font-medium ml-auto">
              Showing {filteredCategories.length} of {categories.length} categories
            </span>
          </div>
        )}
      </div>

      {/* ===================== VIEW MODE 1: HIERARCHICAL TREE VIEW ===================== */}
      {viewMode === "tree" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-[#0e121e] rounded-2xl border border-white/10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              Loading category hierarchy...
            </div>
          ) : treeData.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic bg-[#0e121e] rounded-2xl border border-white/10">
              No categories found matching your filter criteria.
            </div>
          ) : (
            treeData.map((group) => {
              const isCollapsed = collapsedTreeIds.includes(group.root.id);
              const rootSubitems = group.items;

              return (
                <div
                  key={group.root.id}
                  className="rounded-2xl bg-[#0e121e] border border-white/10 overflow-hidden shadow-lg"
                >
                  {/* Root Category Header Card */}
                  <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleCollapseTree(group.root.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                        title={isCollapsed ? "Expand Branch" : "Collapse Branch"}
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {group.root.image && (
                        <img
                          src={group.root.image}
                          alt={group.root.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-white/10 shrink-0"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-sm truncate">{group.root.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Root Branch
                          </span>
                          {group.root.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {group.root.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono text-cyan-400">{group.root.slug}</span>
                          <span>·</span>
                          <span>{rootSubitems.length} subcategories</span>
                          <span>·</span>
                          <span>{group.root.products_count ?? 0} direct products</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for Root Category */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenCreate(group.root)}
                        className="h-8 px-2.5 rounded-xl flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition shadow-sm cursor-pointer"
                        title={`Add subcategory under ${group.root.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Subcategory</span>
                      </button>
                      <button
                        onClick={() => setViewingCategory(group.root)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition shadow-sm cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(group.root)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition shadow-sm cursor-pointer"
                        title="Edit Root Category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(group.root)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition shadow-sm cursor-pointer"
                        title="Delete Root Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories List Under This Root */}
                  {!isCollapsed && (
                    <div className="p-3 bg-black/20 space-y-1.5">
                      {rootSubitems.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 text-center">
                          No subcategories under this root department yet.
                        </p>
                      ) : (
                        rootSubitems.map((sub) => {
                          const level = getCategoryLevel(sub);
                          const path = getCategoryPath(sub);
                          const isSelected = selectedIds.includes(sub.id);

                          return (
                            <div
                              key={sub.id}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "bg-amber-500/10 border-amber-500/40"
                                  : "bg-[#0b0e17] border-white/5 hover:border-white/10"
                              }`}
                              style={{ marginLeft: `${Math.max(0, level - 2) * 20}px` }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <AdminCheckbox
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectRow(sub.id)}
                                  title={`Select ${sub.name}`}
                                />

                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <CornerDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                </div>

                                {sub.image && (
                                  <img
                                    src={sub.image}
                                    alt={sub.name}
                                    className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                                  />
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-xs truncate">{sub.name}</span>
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-white/5 border border-white/10 text-slate-400">
                                      L{level}
                                    </span>
                                    {sub.badge && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                    <span className="text-amber-400/80">
                                      {path.slice(0, -1).map((p) => p.name).join(" › ")}
                                    </span>
                                    <span className="mx-1.5 text-slate-600">·</span>
                                    <span className="font-mono text-cyan-400">{sub.slug}</span>
                                    <span className="mx-1.5 text-slate-600">·</span>
                                    <span>{sub.products_count ?? 0} products</span>
                                  </p>
                                </div>
                              </div>

                              {/* Row Action Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenCreate(sub)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition cursor-pointer"
                                  title={`Add nested subcategory under ${sub.name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setViewingCategory(sub)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(sub)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition cursor-pointer"
                                  title="Edit Subcategory"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingCategory(sub)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                                  title="Delete Subcategory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== VIEW MODE 2: HIERARCHICALLY SORTED TABLE VIEW ===================== */}
      {viewMode === "table" && (
        <ScrollableTableCard>
          <table className="w-full text-left text-xs text-slate-300 min-w-[780px]">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 pl-6 pr-3 w-14 text-left">
                  <AdminCheckbox
                    checked={hierarchicallySortedCategories.length > 0 && selectedIds.length === hierarchicallySortedCategories.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < hierarchicallySortedCategories.length}
                    onChange={handleToggleSelectAll}
                    title="Select all categories"
                  />
                </th>
                <th className="p-3.5 text-left w-[36%] min-w-[260px]">Category & Hierarchy</th>
                <th className="p-3.5 text-left w-[12%] min-w-[90px]">Level</th>
                <th className="p-3.5 text-left w-[18%] min-w-[140px]">Slug</th>
                <th className="p-3.5 text-left w-[10%] min-w-[90px]">Badge</th>
                <th className="p-3.5 text-left w-[10%] min-w-[100px]">Products</th>
                <th className="p-3.5 text-left w-[6%] min-w-[60px]">Order</th>
                <th className="p-3.5 text-center min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-1" />
                    Loading categories...
                  </td>
                </tr>
              ) : hierarchicallySortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    {isFiltered ? "No categories matched your filter criteria." : "No categories created yet."}
                  </td>
                </tr>
              ) : (
                hierarchicallySortedCategories.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const level = getCategoryLevel(c);
                  const isRoot = !c.parent_id;
                  const path = getCategoryPath(c);

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-amber-500/10 border-l-2 border-amber-500"
                          : isRoot
                          ? "bg-white/[0.02] hover:bg-white/[0.04]"
                          : "hover:bg-white/[0.015]"
                      }`}
                    >
                      <td className="py-3 pl-6 pr-3 text-left" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(c.id)}
                          title={`Select ${c.name}`}
                        />
                      </td>
                      <td className="p-3 text-left">
                        <div
                          className="flex items-center gap-2.5 min-w-0"
                          style={{ paddingLeft: `${Math.max(0, level - 1) * 16}px` }}
                        >
                          {/* Indentation Branch Indicator */}
                          {!isRoot && (
                            <CornerDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}

                          {c.image && (
                            <img
                              src={c.image}
                              alt={c.name}
                              className={`rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0 ${
                                isRoot ? "w-8 h-8" : "w-6 h-6"
                              }`}
                            />
                          )}

                          <div className="min-w-0">
                            <span className={`text-white block truncate ${isRoot ? "font-black text-xs" : "font-semibold text-xs"}`}>
                              {c.name}
                            </span>
                            {!isRoot ? (
                              <span className="text-[10px] text-amber-400/90 font-medium truncate block">
                                ↳ {path.slice(0, -1).map((p) => p.name).join(" › ")}
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400/90 font-bold block">
                                📁 Root Department
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Level Pill */}
                      <td className="p-3 text-left whitespace-nowrap">
                        {isRoot ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Root (L1)
                          </span>
                        ) : level === 2 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Sub (L2)
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Deep (L{level})
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-left font-mono text-cyan-400 text-[11px] whitespace-nowrap">{c.slug}</td>
                      <td className="p-3 text-left whitespace-nowrap">
                        {c.badge ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {c.badge}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-left whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white">
                          {c.products_count ?? 0} items
                        </span>
                      </td>
                      <td className="p-3 text-left font-mono text-slate-400 whitespace-nowrap">{c.display_order ?? 0}</td>
                    
                      {/* ICON-ONLY ACTION SYSTEM */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 flex-wrap mx-auto">
                          <button
                            onClick={() => handleOpenCreate(c)}
                            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
                            title={`Add Subcategory under ${c.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingCategory(c)}
                            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
                            title="View Category Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(c)}
                            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
                            title="Delete Category"
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
      )}

      {/* View Category Slide-Over Drawer */}
      <Sheet open={!!viewingCategory} onOpenChange={(open) => { if (!open) setViewingCategory(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {viewingCategory && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Compact Header */}
              <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                    Category Details
                  </SheetTitle>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">
                    #{viewingCategory.id}
                  </span>
                  <span className="text-slate-600 text-xs shrink-0">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {viewingCategory.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCategory(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
                {viewingCategory.image && (
                  <img
                    src={viewingCategory.image}
                    alt={viewingCategory.name}
                    className="w-full h-44 rounded-xl object-cover bg-slate-900 border border-white/10"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hierarchy</span>
                    <p className="text-amber-400 font-medium">
                      {viewingCategory.parent ? `Subcategory of ${viewingCategory.parent.name}` : "Root Department Category"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Products</span>
                    <p className="text-white font-medium">{viewingCategory.products_count ?? 0} items</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lineage Trail</span>
                  <p className="text-slate-300 font-medium">
                    {getCategoryPath(viewingCategory).map((p) => p.name).join(" › ")}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Slug</span>
                  <p className="text-cyan-400 font-mono font-medium">{viewingCategory.slug}</p>
                </div>

                {viewingCategory.description && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Description</span>
                    <p className="text-slate-300 leading-relaxed text-xs">{viewingCategory.description}</p>
                  </div>
                )}
              </div>

              {/* Compact Footer */}
              <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <Link
                  href={`/products?category=${viewingCategory.slug}`}
                  target="_blank"
                  className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <span>Storefront</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const c = viewingCategory;
                    setViewingCategory(null);
                    handleOpenEdit(c);
                  }}
                  className="h-8 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Category</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Category Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[540px] md:w-[580px] sm:!max-w-[580px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSaveCategory} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingCategory ? "Edit Category" : parentId ? "Add Subcategory" : "New Root Category"}
                </SheetTitle>
                {editingCategory && (
                  <>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                      #{editingCategory.id}
                    </span>
                    <span className="text-slate-600 text-xs shrink-0">·</span>
                    <span className="text-xs text-slate-400 truncate max-w-[220px]">
                      {editingCategory.name}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable un-boxed form canvas */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {/* Parent Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Parent Category (Optional)</label>
                <select
                  value={parentId === null ? "" : parentId}
                  onChange={(e) => setParentId(e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-amber-400/50 focus:outline-none transition cursor-pointer"
                >
                  <option value="" className="bg-[#131722] text-slate-300">None (Top-Level Root Category)</option>
                  {categories
                    .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                    .map((cat) => {
                      const level = getCategoryLevel(cat);
                      const prefix = level > 1 ? `${"　".repeat(level - 1)}↳ ` : "📁 ";
                      return (
                        <option key={cat.id} value={cat.id} className="bg-[#131722] text-white">
                          {prefix}{cat.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Category Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mechanical Keyboards & Desks"
                  className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Category overview, specifications, and scope..."
                  className="w-full rounded-lg border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition resize-none"
                />
              </div>

              {/* SEO Configuration */}
              <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-4">
                <h4 className="text-[13px] font-medium text-white flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  Search Engine Optimization
                </h4>
                <p className="text-xs text-slate-400">
                  Leave blank to automatically use the category name and description as fallbacks.
                </p>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle || ""}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Custom SEO title..."
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Meta Description</label>
                  <textarea
                    rows={2}
                    value={metaDescription || ""}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Custom SEO description..."
                    className="w-full rounded-lg border border-white/10 bg-[#131722] p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Minimal Device Image Upload & Delete Section */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-300">Cover Image</label>
                    <ImageUploadGuidance slotKey="admin_category_thumbnail" imageUrl={image} layout="inline" />
                  </div>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                      title="Remove current image"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                {/* Minimal Image Thumbnail Preview if an image exists */}
                {image && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-28 flex items-center justify-center group">
                    <img
                      src={image}
                      alt="Category Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                      <label className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white text-[11px] font-bold backdrop-blur-sm cursor-pointer flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Upload Button & Fallback URL input */}
                <div className="flex items-center gap-2">
                  <label className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0">
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload Device Image"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                    />
                  </label>

                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Or paste external image URL..."
                    className="flex-1 h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition min-w-0"
                  />

                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="h-9 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
                      title="Remove current image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Image Alt Text */}
                <div className="space-y-1.5 mt-2">
                  <label className="text-xs font-medium text-slate-300">Image Alt Text (SEO)</label>
                  <input
                    type="text"
                    value={imageAlt || ""}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Leave blank to use category name..."
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Badge & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Flagship"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
                  <AdminCheckbox
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span>Feature in Highlights & Menus</span>
                </label>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage || (Boolean(editingCategory) && !isEditDirty)}
                className="h-8 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Sheet open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[420px] sm:!max-w-[420px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {deletingCategory && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <SheetTitle className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </SheetTitle>
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3 flex-1 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete category <strong className="text-white font-bold">{deletingCategory.name}</strong>?
                </p>
                {(deletingCategory.products_count ?? 0) > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      Cannot delete category because there are <strong>{deletingCategory.products_count} product(s)</strong> assigned to it. Reassign or delete those products first.
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    This action cannot be undone. Once deleted, this category will be permanently removed.
                  </p>
                )}
              </div>

              <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteCategory}
                  className="h-8 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={categories.length}
        itemName="category"
        onClearSelection={() => setSelectedIds([])}
        onConfirmDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
