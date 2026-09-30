"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpDown, 
  Edit3, 
  Eye,
  X,
  Package,
  Layers,
  Sparkles,
  ScrollText,
  Plus,
  Minus,
  PlusCircle,
  MinusCircle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Product, Category } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminEmptyState,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<{
    total_skus: number;
    total_units: number;
    low_stock_count: number;
    out_of_stock_count: number;
  }>({
    total_skus: 0,
    total_units: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fromRecord, setFromRecord] = useState<number | null>(null);
  const [toRecord, setToRecord] = useState<number | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockLevelFilter, setStockLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgent_restock");

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // View Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [unitCostInput, setUnitCostInput] = useState<string>("");
  const [adjustMode, setAdjustMode] = useState<"add" | "reduce">("add");
  const [addQty, setAddQty] = useState<string>("10");
  const [addReason, setAddReason] = useState<string>("Supplier Restock Batch");
  const [reduceQty, setReduceQty] = useState<string>("1");
  const [reduceReason, setReduceReason] = useState<string>("Damaged in Warehouse");
  const [saving, setSaving] = useState(false);

  const loadInventory = async (pageOverride?: number) => {
    setLoading(true);
    const targetPage = pageOverride !== undefined ? pageOverride : page;
    try {
      const [res, cats] = await Promise.all([
        adminApi.getInventory({
          search: search.trim() || undefined,
          filter: stockLevelFilter !== "all" ? stockLevelFilter : undefined,
          category_id: categoryId || undefined,
          sort_by: sortBy,
          page: targetPage,
          per_page: perPage,
        }),
        adminApi.getCategories().catch(() => []),
      ]);
      setInventory(res.inventory.data || []);
      setTotalPages(res.inventory.last_page || 1);
      setTotalRecords(res.inventory.total || 0);
      setFromRecord(res.inventory.from ?? null);
      setToRecord(res.inventory.to ?? null);
      setPage(res.inventory.current_page || 1);
      setSummary(res.summary || {});
      setCategories(cats || []);
    } catch (err) {
      toast.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, stockLevelFilter, categoryId, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadInventory(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryId("");
    setStockLevelFilter("all");
    setSortBy("urgent_restock");
    setPage(1);
    toast.success("Inventory filters reset to default.");
  };

  const handleToggleSelectAll = () => {
    if (displayedInventory.length > 0 && selectedIds.length === displayedInventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedInventory.map((p) => p.id));
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
      setInventory((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      if (viewingProduct && selectedIds.includes(viewingProduct.id)) setViewingProduct(null);
      if (adjustingProduct && selectedIds.includes(adjustingProduct.id)) setAdjustingProduct(null);
      setSelectedIds([]);
      toast.success(res.message || `Deleted ${selectedIds.length} inventory SKU(s).`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to delete selected inventory items.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustMode("add");
    setAddQty("10");
    setAddReason("Supplier Restock Batch");
    setReduceQty("1");
    setReduceReason("Damaged in Warehouse");
    setSelectedVariantId(p.variants && p.variants.length > 0 ? p.variants[0].id : null);
    setUnitCostInput(p.cost_price ? p.cost_price.toString() : "");
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    let adjustmentDelta = 0;
    let memo = "";

    const selectedVariant = adjustingProduct.variants?.find((v) => v.id === selectedVariantId);
    const maxDeduct = selectedVariant
      ? selectedVariant.stock_quantity
      : adjustingProduct.stock_quantity;

    if (adjustMode === "add") {
      const qty = Number(addQty);
      if (isNaN(qty) || qty <= 0) {
        toast.error("Please enter a valid positive quantity to add.");
        return;
      }
      adjustmentDelta = qty;
      memo = addReason.trim() || "Manual Stock Addition";
    } else {
      const qty = Number(reduceQty);
      if (isNaN(qty) || qty <= 0) {
        toast.error("Please enter a valid positive quantity to reduce.");
        return;
      }
      if (qty > maxDeduct) {
        toast.error(`Cannot reduce ${qty} units. Current stock is only ${maxDeduct} units.`);
        return;
      }
      adjustmentDelta = -qty;
      memo = reduceReason.trim() || "Manual Stock Reduction";
    }

    setSaving(true);

    try {
      const res = await adminApi.adjustStock(adjustingProduct.id, {
        adjustment: adjustmentDelta,
        reason: memo,
        variant_id: selectedVariantId || undefined,
        unit_cost: unitCostInput ? Number(unitCostInput) : undefined,
      });

      setInventory(inventory.map((p) => (p.id === adjustingProduct.id ? res.product : p)));
      toast.success(res.message);
      setAdjustingProduct(null);
      loadInventory();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Failed to adjust inventory.");
    } finally {
      setSaving(false);
    }
  };

  // Live Calculations for modal
  const selectedVariant = adjustingProduct?.variants?.find((v) => v.id === selectedVariantId);
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : (adjustingProduct?.stock_quantity ?? 0);
  const parsedAdd = Number(addQty) || 0;
  const parsedReduce = Number(reduceQty) || 0;
  const targetStock = adjustMode === "add" 
    ? currentStock + parsedAdd 
    : Math.max(0, currentStock - parsedReduce);
  const isOverReducing = adjustMode === "reduce" && parsedReduce > currentStock;

  const displayedInventory = inventory;

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Page Header */}
      <AdminPageHeader
        title="Warehouse Inventory & Stock Auditing"
        description="Track live stock levels, execute rapid warehouse adjustments, and manage replenishments across all active SKUs."
        badge={`${displayedInventory.length} SKUs`}
      />

      {/* Summary KPI Strip */}
      <AdminStatStrip
        stats={[
          {
            label: "Total Active SKUs",
            value: summary.total_skus || 0,
            icon: Boxes,
            helper: "Registered catalog items",
          },
          {
            label: "Total Units In Stock",
            value: summary.total_units || 0,
            icon: Package,
            helper: "Physical warehouse count",
          },
          {
            label: "Low Stock Warnings",
            value: summary.low_stock_count || 0,
            icon: AlertTriangle,
            trend: (summary.low_stock_count || 0) > 0 ? "down" : "neutral",
            helper: "Items with ≤ 10 units",
          },
          {
            label: "Depleted Stock",
            value: summary.out_of_stock_count || 0,
            icon: MinusCircle,
            trend: (summary.out_of_stock_count || 0) > 0 ? "down" : "neutral",
            helper: "Zero inventory items",
          },
        ]}
      />

      {/* Controls Bar */}
      <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/[0.08] flex flex-col lg:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or product title..."
            className="w-full bg-[#161a26] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <AdminDropdown
            value={categoryId}
            onChange={(val) => setCategoryId(val)}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
            ]}
          />

          <AdminDropdown
            value={stockLevelFilter}
            onChange={(val) => setStockLevelFilter(val)}
            options={[
              { value: "all", label: "All Stock Levels" },
              { value: "in_stock", label: "Optimal Stock (>10)" },
              { value: "low_stock", label: "Low Stock Alert (1-10)" },
              { value: "out_of_stock", label: "Depleted (0)" },
              { value: "overstocked", label: "Overstocked (≥50)" },
            ]}
          />

          <AdminDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: "urgent_restock", label: "Urgent Restock (Lowest First)" },
              { value: "stock_desc", label: "Highest Stock First" },
              { value: "name_asc", label: "Product Title (A-Z)" },
              { value: "sku_asc", label: "SKU Code" },
              { value: "price_desc", label: "Highest Unit Price" },
            ]}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            title="Reset all filters and search"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalCount={displayedInventory.length}
          onClearSelection={() => setSelectedIds([])}
          onConfirmDelete={handleBulkDelete}
          isDeleting={isBulkDeleting}
          itemName="inventory item"
        />
      )}

      {/* Inventory Table with Scrollable Dragging Card */}
      <ScrollableTableCard className="bg-[#0f121b] border-white/[0.08]">
        <table className="w-full text-xs text-slate-300 min-w-[920px]">
          <thead className="bg-white/[0.01] border-b border-white/[0.06] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3.5 pl-6 pr-3 w-14 text-left">
                <AdminCheckbox
                  checked={displayedInventory.length > 0 && selectedIds.length === displayedInventory.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < displayedInventory.length}
                  onChange={handleToggleSelectAll}
                  title="Select all inventory items"
                />
              </th>
              <th className="p-3 text-left w-[24%] min-w-[200px]">Product</th>
              <th className="p-3 text-left w-[16%] min-w-[140px]">SKU</th>
              <th className="p-3 text-left w-[18%] min-w-[150px]">Category</th>
              <th className="p-3 text-left w-[12%] min-w-[100px]">Unit Price</th>
              <th className="p-3 text-left w-[11%] min-w-[90px]">Stock Level</th>
              <th className="p-3 text-left w-[12%] min-w-[120px]">Status</th>
              <th className="p-3 text-center min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  Auditing live warehouse inventory...
                </td>
              </tr>
            ) : displayedInventory.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <AdminEmptyState
                    icon={Package}
                    title="No inventory records found"
                    description="Try adjusting your category filter, stock level, or search query."
                  />
                </td>
              </tr>
            ) : (
              displayedInventory.map((p) => {
                const img = p.primary_image?.image_url || p.images?.[0]?.image_url;
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-amber-500/10 border-l-2 border-amber-500"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-3.5 pl-6 pr-3 text-left" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(p.id)}
                        title={`Select ${p.name}`}
                      />
                    </td>
                    <td className="p-3 text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-[240px]" title={p.name}>
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-left font-mono text-cyan-400 text-[11px] whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="p-3 text-left text-slate-300 whitespace-nowrap">
                      {p.category?.name || "Uncategorized"}
                    </td>
                    <td className="p-3 text-left font-bold text-white whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>
                    <td className="p-3 text-left font-semibold text-xs text-white whitespace-nowrap">
                      <div>
                        <span>{p.stock_quantity} <span className="text-slate-400 text-[10px] font-normal">units</span></span>
                        {p.variants && p.variants.length > 0 && (
                          <div className="mt-0.5 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                              {p.variants.length} SKUs
                            </span>
                            <span className="text-slate-400 font-sans truncate max-w-[130px]" title={p.variants.map((v) => `${v.name}: ${v.stock_quantity}`).join(', ')}>
                              {p.variants.map((v) => v.stock_quantity).join(' + ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        p.stock_quantity > 10
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : p.stock_quantity > 0
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {p.stock_quantity > 10 ? "Optimal Stock" : p.stock_quantity > 0 ? "Low Stock Alert" : "Depleted"}
                      </span>
                    </td>

                    {/* ICON-ONLY ACTION SYSTEM (UP TO 4 PER ROW) */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 mx-auto">
                        <button
                          onClick={() => setViewingProduct(p)}
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View Stock Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Adjust Units"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/admin/audit-logs?search=${p.sku}`}
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View SKU Audit Logs"
                        >
                          <ScrollText className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* Pagination Bar */}
      <div className="bg-[#0e121e] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-white font-mono">{fromRecord || 0}</strong> to{" "}
            <strong className="text-white font-mono">{toRecord || 0}</strong> of{" "}
            <strong className="text-amber-400 font-mono">{totalRecords.toLocaleString()}</strong> catalog items
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Per Page Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#151824] border border-white/10 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-mono font-bold text-xs">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Stock View Drawer */}
      <Sheet open={!!viewingProduct} onOpenChange={(open) => { if (!open) setViewingProduct(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {viewingProduct && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Compact Header: h-12 */}
              <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                    Product Stock Details
                  </SheetTitle>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                    {viewingProduct.sku || `#${viewingProduct.id}`}
                  </span>
                  <span className="text-slate-600 text-xs shrink-0">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">
                    {viewingProduct.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
                {/* Stock Telemetry Summary */}
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Current In-Stock
                    </span>
                    <div className="text-base font-semibold text-white mt-0.5">
                      {viewingProduct.stock_quantity} units
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                      viewingProduct.stock_quantity > 10
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : viewingProduct.stock_quantity > 0
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {viewingProduct.stock_quantity > 10
                      ? "Healthy Stock"
                      : viewingProduct.stock_quantity > 0
                      ? "Low Stock Warning"
                      : "Depleted / Out of Stock"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      SKU Identifier
                    </span>
                    <span className="font-mono text-xs text-slate-200 block">
                      {viewingProduct.sku || "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Listing Price
                    </span>
                    <span className="font-mono text-xs text-white block font-semibold">
                      {formatPrice(viewingProduct.price)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Category
                    </span>
                    <span className="text-xs text-slate-300 block">
                      {viewingProduct.category?.name || "Uncategorized"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Catalog Status
                    </span>
                    <span className="text-xs text-slate-300 block">
                      {viewingProduct.is_active ? "Active in Storefront" : "Draft / Inactive"}
                    </span>
                  </div>
                </div>

                {viewingProduct.description && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                      Product Summary
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {viewingProduct.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Compact Footer: h-12 */}
              <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setViewingProduct(null);
                    handleOpenAdjust(prod);
                  }}
                  className="h-8 px-4 rounded-lg bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Adjust Stock</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Stock Adjustment Slide-over Drawer */}
      <Sheet open={!!adjustingProduct} onOpenChange={(open) => { if (!open) setAdjustingProduct(null); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[480px] md:w-[520px] sm:!max-w-[520px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {adjustingProduct && (
            <form onSubmit={handleSaveAdjustment} className="flex flex-col h-full overflow-hidden">
              {/* Compact Header: h-12 */}
              <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                    Adjust Stock
                  </SheetTitle>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                    {adjustingProduct.sku || `#${adjustingProduct.id}`}
                  </span>
                  <span className="text-slate-600 text-xs shrink-0">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">
                    {adjustingProduct.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: Clean un-boxed canvas */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
                {/* Stock Level Telemetry Banner */}
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Current In Stock
                    </span>
                    <span className="text-base font-semibold text-white mt-0.5 block font-mono">
                      {currentStock} units
                    </span>
                  </div>

                  <div className="text-slate-500 text-sm">→</div>

                  <div className="text-right">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Resulting Stock
                    </span>
                    <span
                      className={`text-base font-semibold mt-0.5 flex items-center justify-end gap-1 font-mono ${
                        adjustMode === "add"
                          ? "text-emerald-400"
                          : targetStock === 0
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {adjustMode === "add" ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {targetStock} units
                    </span>
                  </div>
                </div>

                {/* Minimal Segmented Mode Switcher */}
                <div className="grid grid-cols-2 gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("add")}
                    className={`h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustMode === "add"
                        ? "bg-white/10 text-white shadow-xs font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restock (Add)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustMode("reduce")}
                    className={`h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustMode === "reduce"
                        ? "bg-white/10 text-white shadow-xs font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5 text-rose-400" />
                    <span>Deduct (Reduce)</span>
                  </button>
                </div>

                {/* Target Variant / SKU Selector */}
                {adjustingProduct.variants && adjustingProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Target SKU / Variant
                    </label>
                    <select
                      value={selectedVariantId ?? ""}
                      onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-white/20 focus:outline-none transition cursor-pointer"
                    >
                      {adjustingProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.sku}) — In Stock: {v.stock_quantity} units
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Input Fields */}
                {adjustMode === "add" ? (
                  <div className="space-y-4">
                    {/* Unit Cost for FIFO Layer */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Acquisition Unit Cost ($) <span className="text-slate-500 font-normal">(Optional, for FIFO cost layer)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitCostInput}
                        onChange={(e) => setUnitCostInput(e.target.value)}
                        placeholder="e.g. 45.00 (leave blank to use default cost price)"
                        className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">
                          Units to Add <span className="text-emerald-400">*</span>
                        </label>
                        {parsedAdd > 0 && (
                          <span className="text-[11px] text-emerald-400 font-mono">
                            +{parsedAdd} units
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                      />
                    </div>

                    {/* Quick Add Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Quick Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[5, 10, 25, 50, 100].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAddQty(num.toString())}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer border ${
                              addQty === num.toString()
                                ? "bg-white/10 text-white border-white/20 font-semibold"
                                : "bg-white/[0.02] hover:bg-white/5 text-slate-300 border-white/5"
                            }`}
                          >
                            +{num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason / Tracking Memo */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Reason / Memo <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={addReason}
                        onChange={(e) => setAddReason(e.target.value)}
                        placeholder="e.g. Supplier Restock Batch"
                        className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {["Supplier Restock", "Warehouse Recount", "Customer Return"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setAddReason(r)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5 transition cursor-pointer"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">
                          Units to Deduct <span className="text-rose-400">*</span>
                        </label>
                        {parsedReduce > 0 && (
                          <span className="text-[11px] text-rose-400 font-mono">
                            -{parsedReduce} units
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={currentStock}
                        required
                        value={reduceQty}
                        onChange={(e) => setReduceQty(e.target.value)}
                        placeholder={`e.g. 5 (max ${currentStock})`}
                        className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition font-mono"
                      />
                    </div>

                    {isOverReducing && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Cannot reduce more than current stock ({currentStock} units).</span>
                      </div>
                    )}

                    {/* Quick Reduce Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Quick Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 5, 10, 25].filter(n => n <= currentStock).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setReduceQty(num.toString())}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer border ${
                              reduceQty === num.toString()
                                ? "bg-white/10 text-white border-white/20 font-semibold"
                                : "bg-white/[0.02] hover:bg-white/5 text-slate-300 border-white/5"
                            }`}
                          >
                            -{num}
                          </button>
                        ))}
                        {currentStock > 0 && (
                          <button
                            type="button"
                            onClick={() => setReduceQty(currentStock.toString())}
                            className="px-2.5 py-1 rounded-md text-xs font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          >
                            Deplete All ({currentStock})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reason / Tracking Memo */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Reason / Memo <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reduceReason}
                        onChange={(e) => setReduceReason(e.target.value)}
                        placeholder="e.g. Damaged in Warehouse / Write-off"
                        className="w-full h-9 rounded-lg border border-white/10 bg-[#131722] px-3 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none transition"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {["Damaged / Defective", "Inventory Discrepancy", "QA Testing", "Write-off"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setReduceReason(r)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5 transition cursor-pointer"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Footer: h-12 */}
              <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="text-xs font-medium text-slate-400 hover:text-white transition px-1 py-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isOverReducing || (adjustMode === "add" ? parsedAdd <= 0 : parsedReduce <= 0)}
                  className={`h-8 px-4 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${
                    adjustMode === "add"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>
                    {saving
                      ? "Updating..."
                      : adjustMode === "add"
                      ? `Add ${parsedAdd || 0} Units`
                      : `Deduct ${parsedReduce || 0} Units`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={displayedInventory.length}
        itemName="inventory SKU"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
