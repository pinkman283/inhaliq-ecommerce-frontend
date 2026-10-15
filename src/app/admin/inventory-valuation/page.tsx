"use client";

import { useEffect, useState } from "react";
import { 
  Boxes, 
  Search, 
  Layers, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  AlertTriangle, 
  History, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSpreadsheet, 
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { InventoryMovement, Product, ProductValuation } from "@/types";

export default function AdminInventoryValuationPage() {
  const [activeTab, setActiveTab] = useState<"valuation" | "ledger">("valuation");
  const [loading, setLoading] = useState(true);

  // Valuation State
  const [valuationProducts, setValuationProducts] = useState<ProductValuation[]>([]);
  const [valuationSummary, setValuationSummary] = useState<any>({});
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Ledger State
  const [ledgerMovements, setLedgerMovements] = useState<InventoryMovement[]>([]);
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [totalLedgerPages, setTotalLedgerPages] = useState(1);

  // Stock Adjustment Modal
  const [adjustModal, setAdjustModal] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [adjustForm, setAdjustForm] = useState({
    product_id: "",
    adjustment_quantity: 0,
    unit_cost: "",
    reason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (activeTab === "valuation") {
      fetchValuation();
    } else {
      fetchLedger();
    }
  }, [activeTab, search, categoryFilter, movementTypeFilter, ledgerPage]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchValuation = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInventoryValuation({
        search: search || undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
      });
      setValuationProducts(res.products);
      setValuationSummary(res.summary);
      setCategoryBreakdown(res.category_breakdown);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load inventory valuation.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInventoryLedger({
        search: search || undefined,
        movement_type: movementTypeFilter !== "all" ? movementTypeFilter : undefined,
        page: ledgerPage,
      });
      setLedgerMovements(res.data);
      setTotalLedgerPages(res.last_page);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load audit ledger.");
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = async () => {
    setAdjustForm({
      product_id: "",
      adjustment_quantity: 0,
      unit_cost: "",
      reason: "",
    });
    setAdjustModal(true);
    try {
      const pRes = await adminApi.getProducts({ per_page: 100 });
      setAllProducts(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.product_id || adjustForm.adjustment_quantity === 0) {
      showToast("error", "Please specify product and a non-zero adjustment quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.adjustInventoryValuation({
        product_id: parseInt(adjustForm.product_id),
        adjustment_quantity: adjustForm.adjustment_quantity,
        reason: adjustForm.reason,
        unit_cost: adjustForm.unit_cost ? parseFloat(adjustForm.unit_cost) : undefined,
      });
      showToast("success", res.message);
      setAdjustModal(false);
      if (activeTab === "valuation") fetchValuation();
      else fetchLedger();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Adjustment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "purchase_received":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pos_sale":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "online_sale":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "refund_restock":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "damage_writeoff":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "manual_adjustment":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-white/5 text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-md text-sm font-semibold flex items-center gap-3 border shadow-lg animate-in fade-in slide-in-from-top-2 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0f18] p-5 rounded-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FIFO Inventory Valuation & Ledger</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable First-In First-Out cost layers, real-time inventory asset balance sheet, and transaction ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAdjustModal}
            className="px-4 py-2.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Manual Stock Adjustment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Warehouse Units</span>
          <span className="text-2xl font-black text-white font-mono">{valuationSummary.total_units || 0}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">FIFO Asset Cost</span>
          <span className="text-2xl font-black text-[#A78BFA] font-mono">
            ${valuationSummary.total_asset_valuation?.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Potential Retail Value</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            ${valuationSummary.total_potential_retail_value?.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Low / Out of Stock</span>
          <span className="text-2xl font-black text-rose-400 font-mono">
            {(valuationSummary.low_stock_count || 0) + (valuationSummary.out_of_stock_count || 0)}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("valuation")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "valuation"
              ? "bg-[#A78BFA] text-[#090B10] shadow-md"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Boxes className="w-4 h-4" />
          FIFO Asset Valuation
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "ledger"
              ? "bg-[#A78BFA] text-[#090B10] shadow-md"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <History className="w-4 h-4" />
          Auditable Movement Ledger
        </button>
      </div>

      {/* TAB 1: FIFO Valuation Table */}
      {activeTab === "valuation" && (
        <div className="space-y-4">
          <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hardware name, SKU..."
                className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
          </div>

          <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Hardware Item</th>
                    <th className="py-3.5 px-4">Stock on Hand</th>
                    <th className="py-3.5 px-4">Avg FIFO Unit Cost</th>
                    <th className="py-3.5 px-4">Total Inventory Cost</th>
                    <th className="py-3.5 px-4">Retail Price</th>
                    <th className="py-3.5 px-4">Potential Gross Margin</th>
                    <th className="py-3.5 px-4">Cost Layers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Calculating FIFO layer asset valuations...
                      </td>
                    </tr>
                  ) : valuationProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No product inventory found.
                      </td>
                    </tr>
                  ) : (
                    valuationProducts.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">SKU: {p.sku} | {p.category}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            p.stock_quantity > 10 
                              ? "text-emerald-400 bg-emerald-500/10" 
                              : p.stock_quantity > 0 
                              ? "text-amber-400 bg-amber-500/10" 
                              : "text-rose-400 bg-rose-500/10"
                          }`}>
                            {p.stock_quantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {p.average_unit_cost !== null ? (
                            <span className={p.is_estimated ? "text-amber-400" : "text-emerald-400"}>
                              ${p.average_unit_cost.toFixed(2)}
                              {p.is_estimated && <span className="text-[10px] text-slate-500 font-sans ml-1">(Est.)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-sans italic">Not Established</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          ${p.total_inventory_cost.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          ${p.retail_price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          +${p.potential_gross_margin.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.cost_layers_count > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {p.cost_layers_count} FIFO tranche(s)
                            </span>
                          ) : p.stock_quantity <= 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                              Depleted
                            </span>
                          ) : p.cost_status === 'opening_cost_pending_layer' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Cost Set (${p.cost_price?.toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Opening Cost Required
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Auditable Movement Ledger Stream */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setLedgerPage(1); }}
                placeholder="Search reference # or notes..."
                className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
              {["all", "purchase_received", "pos_sale", "online_sale", "refund_restock", "damage_writeoff", "manual_adjustment"].map(mt => (
                <button
                  key={mt}
                  onClick={() => { setMovementTypeFilter(mt); setLedgerPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize whitespace-nowrap transition ${
                    movementTypeFilter === mt 
                      ? "bg-[#A78BFA] text-[#090B10] shadow-md" 
                      : "bg-white/5 text-slate-400 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {mt.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Movement Type</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Quantity Δ</th>
                    <th className="py-3.5 px-4">Unit Cost</th>
                    <th className="py-3.5 px-4">Balance After</th>
                    <th className="py-3.5 px-4">Reference & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading ledger transaction stream...
                      </td>
                    </tr>
                  ) : ledgerMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No ledger transactions recorded matching filters.
                      </td>
                    </tr>
                  ) : (
                    ledgerMovements.map(m => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {m.created_at}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getMovementBadge(m.movement_type)}`}>
                            {m.movement_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{m.product?.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {m.product?.sku}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          <span className={m.quantity > 0 ? "text-emerald-400" : "text-rose-400"}>
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#A78BFA] font-bold">
                          ${m.unit_cost?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {m.balance_after} units
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-300 font-mono block">{m.reference_id}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{m.notes}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalLedgerPages > 1 && (
              <div className="p-4 bg-[#151824] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Page {ledgerPage} of {totalLedgerPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={ledgerPage >= totalLedgerPages}
                    onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                    className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Manual Stock Adjustment */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Manual Stock Adjustment</h3>
              </div>
              <button onClick={() => setAdjustModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Select Hardware Product *</label>
                <select
                  required
                  value={adjustForm.product_id}
                  onChange={e => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                >
                  <option value="">-- Choose Product --</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current Stock: {p.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Adjustment Δ Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="+5 or -3"
                    value={adjustForm.adjustment_quantity || ""}
                    onChange={e => setAdjustForm({ ...adjustForm, adjustment_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50 text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Positive adds, negative deducts.</span>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Layer Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional Cost"
                    value={adjustForm.unit_cost}
                    onChange={e => setAdjustForm({ ...adjustForm, unit_cost: e.target.value })}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Adjustment Reason / Memo *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Broken in showroom display, Annual physical audit sync"
                  className="w-full bg-[#151824] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "Adjusting..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
