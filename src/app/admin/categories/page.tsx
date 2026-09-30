"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Category } from "@/types";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import {
  CategoriesKpiCards,
  CategoryStats,
} from "@/components/admin/categories/CategoriesKpiCards";
import { CategoriesFilterToolbar } from "@/components/admin/categories/CategoriesFilterToolbar";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { CategoriesTreeView } from "@/components/admin/categories/CategoriesTreeView";
import {
  CategoryFormDrawer,
  CategoryFormData,
} from "@/components/admin/categories/CategoryFormDrawer";
import { CategoryPreviewDrawer } from "@/components/admin/categories/CategoryPreviewDrawer";
import { CategoryDeleteModal } from "@/components/admin/categories/CategoryDeleteModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "root_only" | "sub_only" | "level_2" | "level_3">("all");
  const [selectedRootId, setSelectedRootId] = useState<number | "all">("all");
  const [selectedParentId, setSelectedParentId] = useState<number | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<number[]>([]);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview Drawer State
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  // Delete Modal State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await adminApi.getCategories();
        if (!ignore) {
          setCategories(data || []);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to load categories.");
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

  // Ancestry Helper: Builds the full parent chain for any category [Root, Level2, Level3...]
  const getCategoryPath = useCallback(
    (cat: Category): Category[] => {
      const path: Category[] = [];
      let current: Category | undefined = cat;
      const visited = new Set<number>();
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        path.unshift(current);
        if (current.parent_id) {
          current =
            categories.find((c) => c.id === current?.parent_id) ||
            (current.parent as Category | undefined);
        } else {
          break;
        }
      }
      return path;
    },
    [categories]
  );

  const getCategoryLevel = useCallback(
    (cat: Category): number => {
      return getCategoryPath(cat).length;
    },
    [getCategoryPath]
  );

  const getRootCategory = useCallback(
    (cat: Category): Category => {
      const path = getCategoryPath(cat);
      return path[0] || cat;
    },
    [getCategoryPath]
  );

  // Distinct Root Categories
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

  // Overall KPI Metrics
  const stats: CategoryStats = useMemo(() => {
    const total = categories.length;
    const rootCount = categories.filter((c) => !c.parent_id).length;
    const subCount = total - rootCount;
    const deepCount = categories.filter((c) => getCategoryLevel(c) >= 3).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
    return { total, rootCount, subCount, deepCount, totalProducts };
  }, [categories, getCategoryLevel]);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const level = getCategoryLevel(c);
      const rootCat = getRootCategory(c);

      // 1. Hierarchy Level Filter
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
  }, [categories, typeFilter, selectedRootId, selectedParentId, search, getCategoryLevel, getRootCategory, getCategoryPath]);

  // Hierarchically Sorted Categories for Table View (Parents immediately followed by children)
  const hierarchicallySortedCategories = useMemo(() => {
    const childrenMap = new Map<number | null, Category[]>();

    filteredCategories.forEach((c) => {
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

    // If filtered list has orphaned subcategories, add them
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

    rootCategories.forEach((r) => {
      if (selectedRootId === "all" || r.id === selectedRootId) {
        rootMap.set(r.id, { root: r, items: [] });
      }
    });

    hierarchicallySortedCategories.forEach((cat) => {
      const root = getRootCategory(cat);
      if (!rootMap.has(root.id)) {
        rootMap.set(root.id, { root, items: [] });
      }
      if (cat.id !== root.id) {
        rootMap.get(root.id)!.items.push(cat);
      }
    });

    return Array.from(rootMap.values()).filter((group) => {
      const rootMatches = filteredCategories.some((c) => c.id === group.root.id);
      return rootMatches || group.items.length > 0;
    });
  }, [rootCategories, selectedRootId, hierarchicallySortedCategories, getRootCategory, filteredCategories]);

  // Modal Handlers
  const handleOpenCreate = (parentCat?: Category | null) => {
    setEditingCategory(null);
    setDefaultParentId(parentCat ? parentCat.id : null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setDefaultParentId(null);
    setIsFormOpen(true);
  };

  const handleSaveCategory = async (payload: CategoryFormData) => {
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory.id, payload);
        await loadCategories();
        toast.success(`Category '${res.category?.name || payload.name}' updated.`);
      } else {
        const res = await adminApi.createCategory(payload);
        await loadCategories();
        toast.success(`Category '${res.category?.name || payload.name}' created.`);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(axiosErr.response?.data?.message || axiosErr.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingCategory.id));
      toast.success(`Category '${deletingCategory.name}' deleted.`);
      setDeletingCategory(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(axiosErr.response?.data?.message || axiosErr.message || "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
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
        toast.success(res.message || "Processed category deletion.");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(axiosErr.response?.data?.message || axiosErr.message || "Failed to delete selected categories.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (
      hierarchicallySortedCategories.length > 0 &&
      selectedIds.length === hierarchicallySortedCategories.length
    ) {
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

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSelectedRootId("all");
    setSelectedParentId("all");
    toast.success("All category filters reset.");
  };

  const handleToggleCollapse = (rootId: number) => {
    setCollapsedTreeIds((prev) =>
      prev.includes(rootId) ? prev.filter((id) => id !== rootId) : [...prev, rootId]
    );
  };

  const isFiltered = Boolean(
    search.trim() ||
      typeFilter !== "all" ||
      selectedRootId !== "all" ||
      selectedParentId !== "all"
  );

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
          <button
            type="button"
            onClick={() => {
              if (typeFilter === "sub_only" && rootCategories.length > 0) {
                handleOpenCreate(rootCategories[0]);
              } else if (typeFilter === "level_3" && parentOptions.length > 0) {
                handleOpenCreate(parentOptions[0]);
              } else {
                handleOpenCreate(null);
              }
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {typeFilter === "sub_only"
                ? "Add Subcategory"
                : typeFilter === "level_3"
                ? "Add Child Category"
                : "Add Category"}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Level Tabs */}
      <CategoriesKpiCards
        stats={stats}
        typeFilter={typeFilter}
        selectedRootId={selectedRootId}
        selectedParentId={selectedParentId}
        onSelectFilter={(type) => {
          setTypeFilter(type);
          setSelectedRootId("all");
          setSelectedParentId("all");
        }}
      />

      {/* Filter Toolbar */}
      <CategoriesFilterToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        selectedRootId={selectedRootId}
        onSelectedRootIdChange={setSelectedRootId}
        selectedParentId={selectedParentId}
        onSelectedParentIdChange={setSelectedParentId}
        rootCategories={rootCategories}
        parentOptions={parentOptions}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content: Table or Tree View */}
      {viewMode === "table" ? (
        <CategoriesTable
          categories={hierarchicallySortedCategories}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          getCategoryPath={getCategoryPath}
          getCategoryLevel={getCategoryLevel}
          onAddSubcategory={handleOpenCreate}
          onView={setViewingCategory}
          onEdit={handleOpenEdit}
          onDelete={setDeletingCategory}
          loading={loading}
        />
      ) : (
        <CategoriesTreeView
          treeData={treeData}
          loading={loading}
          collapsedTreeIds={collapsedTreeIds}
          onToggleCollapse={handleToggleCollapse}
          selectedIds={selectedIds}
          onToggleSelectRow={handleToggleSelectRow}
          getCategoryLevel={getCategoryLevel}
          getCategoryPath={getCategoryPath}
          onAddSubcategory={handleOpenCreate}
          onView={setViewingCategory}
          onEdit={handleOpenEdit}
          onDelete={setDeletingCategory}
        />
      )}

      {/* Create / Edit Form Drawer */}
      <CategoryFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingCategory={editingCategory}
        defaultParentId={defaultParentId}
        categories={categories}
        getCategoryLevel={getCategoryLevel}
        onSave={handleSaveCategory}
        saving={saving}
      />

      {/* Read-Only Preview Drawer */}
      <CategoryPreviewDrawer
        category={viewingCategory}
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
        categories={categories}
        getCategoryPath={getCategoryPath}
        getCategoryLevel={getCategoryLevel}
        onEdit={handleOpenEdit}
        onSelectCategory={setViewingCategory}
      />

      {/* Delete Confirmation Modal */}
      <CategoryDeleteModal
        category={deletingCategory}
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirmDelete={handleDeleteCategory}
        deleting={deleting}
        categories={categories}
      />

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
