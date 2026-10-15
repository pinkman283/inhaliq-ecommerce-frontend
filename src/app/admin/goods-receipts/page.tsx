"use client";

import { useEffect, useState } from "react";
import { 
  PackageCheck, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Building2, 
  Layers, 
  ShieldCheck, 
  X,
  Boxes,
  AlertTriangle
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { GoodsReceipt, PurchaseOrder } from "@/types";

interface ReceivingLineInput {
  purchase_order_item_id: number;
  product_name: string;
  sku: string;
  unit_cost: number;
  quantity_ordered: number;
  quantity_already_received: number;
  quantity_received: number;
  quantity_damaged: number;
  quantity_rejected: number;
}

export default function AdminGoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);

  // Create GRN Form State
  const [openPOs, setOpenPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [receivingLines, setReceivingLines] = useState<ReceivingLineInput[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchGoodsReceipts();
  }, [search, page]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchGoodsReceipts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGoodsReceipts({
        search: search || undefined,
        page,
      });
      setReceipts(res.data);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load goods receipts.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setSelectedPoId("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setReceivingLines([]);
    setCreateModal(true);

    try {
      const res = await adminApi.getPurchaseOrders({ per_page: 100 });
      // Filter POs that are approved or partially received
      const validPOs = res.purchase_orders.data.filter(
        (po: any) => po.status === "approved" || po.status === "partially_received"
      );
      setOpenPOs(validPOs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPo = async (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) {
      setReceivingLines([]);
      return;
    }

    try {
      const po = await adminApi.getPurchaseOrder(parseInt(poId));
      if (po.items) {
        const lines = po.items.map(it => {
          const remaining = Math.max(0, it.quantity_ordered - it.quantity_received);
          return {
            purchase_order_item_id: it.id,
            product_name: it.product_name,
            sku: it.sku,
            unit_cost: it.unit_cost,
            quantity_ordered: it.quantity_ordered,
            quantity_already_received: it.quantity_received,
            quantity_received: remaining, // Pre-fill remaining expected
            quantity_damaged: 0,
            quantity_rejected: 0,
          };
        });
        setReceivingLines(lines);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateLineQty = (index: number, field: "quantity_received" | "quantity_damaged" | "quantity_rejected", value: number) => {
    const updated = [...receivingLines];
    updated[index][field] = Math.max(0, value);
    setReceivingLines(updated);
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) {
      showToast("error", "Please select a purchase order.");
      return;
    }

    const hasAnyQty = receivingLines.some(l => l.quantity_received > 0 || l.quantity_damaged > 0 || l.quantity_rejected > 0);
    if (!hasAnyQty) {
      showToast("error", "Please enter at least 1 received or inspected item quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        purchase_order_id: parseInt(selectedPoId),
        received_date: receivedDate,
        notes: notes || undefined,
        items: receivingLines.map(l => ({
          purchase_order_item_id: l.purchase_order_item_id,
          quantity_received: l.quantity_received,
          quantity_damaged: l.quantity_damaged,
          quantity_rejected: l.quantity_rejected,
        })),
      };

      const res = await adminApi.createGoodsReceipt(payload);
      showToast("success", res.message);
      setCreateModal(false);
      fetchGoodsReceipts();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to process goods receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = async (gr: GoodsReceipt) => {
    setSelectedReceipt(gr);
    setViewModal(true);
    try {
      const full = await adminApi.getGoodsReceipt(gr.id);
      setSelectedReceipt(full);
    } catch (err) {
      console.error(err);
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
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Goods Receiving Notes (GRN)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect physical warehouse shipments and automatically instantiate FIFO inventory cost tranches.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Receive Physical Shipment
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search GRN, PO, or supplier..."
            className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Receipt (GRN) #</th>
                <th className="py-3.5 px-4">PO Reference</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Received By</th>
                <th className="py-3.5 px-4">Items Received</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading goods receipts...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No goods receipts recorded yet. Receive shipments against approved POs.
                  </td>
                </tr>
              ) : (
                receipts.map(gr => (
                  <tr key={gr.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white font-mono block">{gr.receipt_number}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A78BFA] font-bold">
                      {gr.purchase_order?.po_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {gr.vendor?.company_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {gr.received_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {gr.received_by_user?.name || "Warehouse Officer"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {gr.items?.reduce((a, b) => a + b.quantity_received, 0) || 0} units accepted
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openViewModal(gr)}
                        title="View Shipment Details"
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Receive Physical Shipment (Create GRN) */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <PackageCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Receive Physical Shipment (Create GRN)</h3>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGRN} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Select Approved Purchase Order *</label>
                  <select
                    required
                    value={selectedPoId}
                    onChange={e => handleSelectPo(e.target.value)}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="">-- Choose Approved PO --</option>
                    {openPOs.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} - {po.vendor?.company_name} ({po.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Physical Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                    className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              {/* Receiving Line Items Stream */}
              {receivingLines.length > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="uppercase font-bold text-slate-300 block">
                    Shipment Item Inspection (Received vs Damaged vs Rejected)
                  </label>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {receivingLines.map((line, idx) => (
                      <div key={idx} className="bg-[#151824] p-3.5 rounded-md border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">{line.product_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {line.sku} | Unit Cost: ${line.unit_cost.toFixed(2)} | Ordered: {line.quantity_ordered} (Already received: {line.quantity_already_received})
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-emerald-400 font-bold block mb-1">Accepted Stock Qty</label>
                            <input
                              type="number"
                              min="0"
                              value={line.quantity_received}
                              onChange={e => updateLineQty(idx, "quantity_received", parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0b0d14] border border-emerald-500/30 rounded-md px-2.5 py-1.5 text-emerald-300 font-mono text-center font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-amber-400 font-bold block mb-1">Damaged Qty</label>
                            <input
                              type="number"
                              min="0"
                              value={line.quantity_damaged}
                              onChange={e => updateLineQty(idx, "quantity_damaged", parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0b0d14] border border-amber-500/30 rounded-md px-2.5 py-1.5 text-amber-300 font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-rose-400 font-bold block mb-1">Rejected / Returned Qty</label>
                            <input
                              type="number"
                              min="0"
                              value={line.quantity_rejected}
                              onChange={e => updateLineQty(idx, "quantity_rejected", parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0b0d14] border border-rose-500/30 rounded-md px-2.5 py-1.5 text-rose-300 font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Receiving Notes / Bill of Lading</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Carrier tracking, batch lot numbers, inspector notes..."
                  className="w-full bg-[#151824] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[#A78BFA]/50"
                />
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
                  disabled={isSubmitting || receivingLines.length === 0}
                  className="flex-1 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Generating FIFO Layers..." : "Confirm & Accept into Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View GRN Details */}
      {viewModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400">
                <PackageCheck className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedReceipt.receipt_number}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">PO: {selectedReceipt.purchase_order?.po_number}</span>
                </div>
              </div>
              <button onClick={() => setViewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[#151824] p-3.5 rounded-md border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier</span>
                <span className="text-white font-bold">{selectedReceipt.vendor?.company_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Received Date</span>
                <span className="text-slate-200 font-mono">{selectedReceipt.received_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Inspected By</span>
                <span className="text-slate-200">{selectedReceipt.received_by_user?.name || "Staff"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase text-[11px]">Accepted Shipment Items</h4>
              <div className="bg-[#151824] rounded-md border border-white/10 divide-y divide-white/5">
                {selectedReceipt.items?.map(it => (
                  <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-white block">{it.product?.name}</span>
                      <span className="text-[10px] text-slate-400">Unit Cost: ${it.unit_cost.toFixed(2)} | Total: ${it.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-bold text-sm block">+{it.quantity_received} units</span>
                      {(it.quantity_damaged > 0 || it.quantity_rejected > 0) && (
                        <span className="text-[10px] text-rose-400">
                          (Damaged: {it.quantity_damaged}, Rejected: {it.quantity_rejected})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
