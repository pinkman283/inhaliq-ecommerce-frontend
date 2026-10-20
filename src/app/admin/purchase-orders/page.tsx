"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  Send, 
  ShieldCheck, 
  Ban, 
  Package, 
  Calendar, 
  DollarSign, 
  Truck
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Product, PurchaseOrder, Vendor } from "@/types";
import { TableSkeletonRows } from "@/components/admin/ui/TableSkeletonRows";

interface PoLineInput {
  product_id: string;
  variant_id?: string | null;
  unit_cost: string;
  quantity_ordered: number;
}

export default function AdminPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Create Form State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PoLineInput[]>([
    { product_id: "", unit_cost: "", quantity_ordered: 10 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [search, statusFilter, page]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPurchaseOrders({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
      });
      setPurchaseOrders(res.purchase_orders.data);
      setTotalPages(res.purchase_orders.last_page);
      setStats(res.stats);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setVendorId("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setExpectedDate("");
    setShippingCost("0");
    setTaxAmount("0");
    setNotes("");
    setItems([{ product_id: "", unit_cost: "", quantity_ordered: 10 }]);
    setCreateModal(true);

    try {
      const [vRes, pRes] = await Promise.all([
        adminApi.getVendors({ per_page: 100 }),
        adminApi.getProducts({ per_page: 100 }),
      ]);
      setVendors(vRes.vendors.data);
      setAllProducts(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addItemLine = () => {
    setItems([...items, { product_id: "", unit_cost: "", quantity_ordered: 10 }]);
  };

  const removeItemLine = (index: number) => {
    if (items.length <= 1) return;
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const updateItemLine = (index: number, field: keyof PoLineInput, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // If product selected, pre-fill default purchase cost if available
    if (field === "product_id" && value) {
      const p = allProducts.find(prod => prod.id.toString() === value.toString());
      if (p && !updated[index].unit_cost) {
        updated[index].unit_cost = (p.price * 0.5).toFixed(2);
      }
    }

    setItems(updated);
  };

  const subtotal = items.reduce((acc, item) => {
    const cost = parseFloat(item.unit_cost) || 0;
    return acc + (cost * item.quantity_ordered);
  }, 0);

  const totalAmount = subtotal + (parseFloat(shippingCost) || 0) + (parseFloat(taxAmount) || 0);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      showToast("error", "Please select a supplier vendor.");
      return;
    }

    for (const it of items) {
      if (!it.product_id || !it.unit_cost) {
        showToast("error", "Please complete product selection and unit costs for all line items.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vendor_id: parseInt(vendorId),
        order_date: orderDate,
        expected_delivery_date: expectedDate || undefined,
        shipping_cost: parseFloat(shippingCost) || 0,
        tax_amount: parseFloat(taxAmount) || 0,
        notes: notes || undefined,
        items: items.map(it => ({
          product_id: parseInt(it.product_id),
          variant_id: it.variant_id ? parseInt(it.variant_id) : null,
          unit_cost: parseFloat(it.unit_cost),
          quantity_ordered: it.quantity_ordered,
        })),
      };

      const res = await adminApi.createPurchaseOrder(payload);
      showToast("success", res.message);
      setCreateModal(false);
      fetchPurchaseOrders();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to create purchase order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (po: PurchaseOrder) => {
    try {
      const res = await adminApi.submitPurchaseOrder(po.id);
      showToast("success", res.message);
      fetchPurchaseOrders();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to submit PO.");
    }
  };

  const handleApprovePo = async (po: PurchaseOrder) => {
    try {
      const res = await adminApi.approvePurchaseOrder(po.id);
      showToast("success", res.message);
      fetchPurchaseOrders();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to approve PO.");
    }
  };

  const handleCancelPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo || !cancellationReason) return;
    try {
      const res = await adminApi.cancelPurchaseOrder(selectedPo.id, cancellationReason);
      showToast("success", res.message);
      setCancelModal(false);
      setCancellationReason("");
      fetchPurchaseOrders();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to cancel PO.");
    }
  };

  const openViewPo = async (po: PurchaseOrder) => {
    setSelectedPo(po);
    setViewModal(true);
    try {
      const full = await adminApi.getPurchaseOrder(po.id);
      setSelectedPo(full);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "submitted":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "approved":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "partially_received":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "received":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Purchase Orders & Procurement</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Draft, authorize, and fulfill procurement orders to replenish FIFO cost tranches.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Draft Purchase Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Spend</span>
          <span className="text-2xl font-black text-[#A78BFA] font-mono">${stats.total_procurement_spend?.toFixed(2) || "0.00"}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Approved & Open</span>
          <span className="text-2xl font-black text-blue-400 font-mono">{(stats.approved_count || 0) + (stats.partially_received_count || 0)}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Pending Approval</span>
          <span className="text-2xl font-black text-amber-300 font-mono">{stats.submitted_count || 0}</span>
        </div>
        <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10">
          <span className="text-xs text-slate-400 font-bold uppercase block">Fully Received</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{stats.received_count || 0}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search PO number or vendor..."
            className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
          {["all", "draft", "submitted", "approved", "partially_received", "received", "cancelled"].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize whitespace-nowrap transition ${
                statusFilter === st 
                  ? "bg-[#A78BFA] text-[#090B10] shadow-md" 
                  : "bg-white/5 text-slate-400 hover:bg-white/10 text-slate-300"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Order Date</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <TableSkeletonRows rows={6} colSpan={7} hasCheckbox={false} />
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No purchase orders found matching selected filters.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white font-mono block">{po.po_number}</span>
                      <span className="text-[10px] text-slate-400">By: {po.created_by_user?.name || "Staff"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200 block">{po.vendor?.company_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{po.vendor?.vendor_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {po.order_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {po.items_count || po.items?.length || 0} line items
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#A78BFA] font-mono text-sm block">
                        ${po.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(po.status)}`}>
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === "draft" && (
                          <button
                            onClick={() => handleSubmitForApproval(po)}
                            title="Submit for Approval"
                            className="px-2.5 py-1 rounded bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] font-bold text-[10px] flex items-center gap-1 border border-[#A78BFA]/30"
                          >
                            <Send className="w-3 h-3" />
                            Submit
                          </button>
                        )}
                        {po.status === "submitted" && (
                          <button
                            onClick={() => handleApprovePo(po)}
                            title="Approve Purchase Order"
                            className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-[10px] flex items-center gap-1 border border-blue-500/30"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => openViewPo(po)}
                          title="Inspect PO"
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!["received", "cancelled"].includes(po.status) && (
                          <button
                            onClick={() => { setSelectedPo(po); setCancelModal(true); }}
                            title="Cancel PO"
                            className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#151824] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Draft Purchase Order */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <FileText className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Draft New Purchase Order</h3>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={vendorId}
                    onChange={e => setVendorId(e.target.value)}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.company_name} ({v.vendor_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={e => setOrderDate(e.target.value)}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="uppercase font-bold text-slate-300">Procurement Items & Unit Costs</label>
                  <button
                    type="button"
                    onClick={addItemLine}
                    className="text-[#A78BFA] hover:text-[#B9A3FF] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-[#151824] p-3 rounded-md border border-white/5 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          required
                          value={item.product_id}
                          onChange={e => updateItemLine(idx, "product_id", e.target.value)}
                          className="w-full bg-[#0b0d14] border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                        >
                          <option value="">-- Choose Product --</option>
                          {allProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Unit Cost $"
                          value={item.unit_cost}
                          onChange={e => updateItemLine(idx, "unit_cost", e.target.value)}
                          className="w-full bg-[#0b0d14] border border-white/10 rounded-md px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity_ordered}
                          onChange={e => updateItemLine(idx, "quantity_ordered", parseInt(e.target.value) || 1)}
                          className="w-full bg-[#0b0d14] border border-white/10 rounded-md px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50 text-center"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemLine(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2 bg-[#12141e] p-3.5 rounded-md border border-white/5">
                <div>
                  <label className="block text-slate-400 mb-1">Shipping Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost}
                    onChange={e => setShippingCost(e.target.value)}
                    className="w-full bg-[#181b28] border border-white/10 rounded-md px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Taxes / Customs ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxAmount}
                    onChange={e => setTaxAmount(e.target.value)}
                    className="w-full bg-[#181b28] border border-white/10 rounded-md px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#151824] p-3 rounded-md font-bold">
                <span className="text-slate-300">Total Purchase Commitment:</span>
                <span className="text-[#A78BFA] font-mono text-base">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "Drafting..." : "Create Draft PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Purchase Order Details */}
      {viewModal && selectedPo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPo.po_number}</h3>
                  <span className="text-[10px] text-slate-400">Vendor: {selectedPo.vendor?.company_name}</span>
                </div>
              </div>
              <button onClick={() => setViewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Banner */}
            <div className="flex items-center justify-between bg-[#151824] p-3.5 rounded-md border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lifecycle Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase mt-1 ${getStatusBadge(selectedPo.status)}`}>
                  {selectedPo.status.replace("_", " ")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Order Value</span>
                <span className="text-amber-400 font-mono font-bold text-base">${selectedPo.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Line Items Progress Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase text-[11px]">Ordered Items Fulfillment</h4>
              <div className="bg-[#151824] rounded-md border border-white/10 divide-y divide-white/5">
                {selectedPo.items?.map(it => (
                  <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-bold text-white block">{it.product_name}</span>
                      <span className="text-[10px] text-slate-400">SKU: {it.sku} | Unit Cost: ${it.unit_cost.toFixed(2)}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-white block">
                        {it.quantity_received} / {it.quantity_ordered} received
                      </span>
                      <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="bg-emerald-400 h-full rounded-full" 
                          style={{ width: `${Math.min(100, (it.quantity_received / it.quantity_ordered) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel PO Confirmation */}
      {cancelModal && selectedPo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Cancel Purchase Order</h3>
              </div>
              <button onClick={() => setCancelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300">
              Are you sure you want to cancel PO <span className="font-mono text-[#A78BFA] font-bold">{selectedPo.po_number}</span>?
            </p>

            <form onSubmit={handleCancelPo} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Reason for Cancellation *</label>
                <textarea
                  rows={2}
                  required
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  placeholder="e.g. Vendor out of stock, Price renegotiation failed"
                  className="w-full bg-[#151824] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[#A78BFA]/50 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Keep PO
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
