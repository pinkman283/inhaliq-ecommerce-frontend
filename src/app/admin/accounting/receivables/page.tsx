"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowLeft,
  X,
  CreditCard,
  Download,
  Calendar,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AccountingReceivablesResponse, BankAccountItem } from "@/types";
import {
  FinancialKpiCard,
  ReceivablesAgingChart,
} from "@/components/admin/accounting";

import { AdminPageHeader, AdminEmptyState } from "@/components/admin/ui";

export default function ReceivablesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingReceivablesResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"dues" | "receipts">("dues");

  // Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bankAccountId, setBankAccountId] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchReceivables();
    fetchBankAccounts();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingReceivables();
      setData(res);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load receivables.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await adminApi.getAccountingBanking();
      setBankAccounts(res.accounts || []);
      if (res.accounts && res.accounts.length > 0) {
        setBankAccountId(res.accounts[0].id);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleOpenPaymentModal = (order: any) => {
    setSelectedOrder(order);
    setAmount(order.due_amount.toString());
    setReferenceNumber(`REC-${Date.now().toString().slice(-6)}`);
    setNotes(`Customer settlement for Order #${order.order_number}`);
    setModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("error", "Please enter a valid payment amount.");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.recordCustomerPayment({
        order_id: selectedOrder.id,
        amount: numAmount,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
        payment_date: paymentDate,
        reference_number: referenceNumber,
        notes,
      });

      showToast("success", `Payment of $${numAmount.toFixed(2)} recorded successfully.`);
      setModalOpen(false);
      fetchReceivables();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const aging = data?.aging;
  const summary = data?.summary;
  const filteredOrders = (data?.receivables || []).filter((o) => {
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
    );
  });

  const totalDue = aging?.total ?? 0;
  const overdueAmount = (aging?.days_31_60 ?? 0) + (aging?.days_61_90 ?? 0) + (aging?.days_90_plus ?? 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Accounts Receivable & Customer Dues"
        description="Track uncollected customer receivables, aging brackets, overdue risk profiles, and record cash settlements."
        badge={filteredOrders.length > 0 ? `${filteredOrders.length} Open Invoices` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/accounting"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.08] bg-[#0f121b] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accounting Hub</span>
            </Link>
            <button
              onClick={fetchReceivables}
              disabled={loading}
              className="p-1.5 rounded-md border border-white/[0.08] bg-[#0f121b] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <a
              href={adminApi.getAccountingExportUrl("receivables")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export A/R</span>
            </a>
          </div>
        }
      />

      {/* Compact Operational Insight Banner: High-density Metrics & Aging Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Key Operational Numbers */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Open Receivables
            </span>
            <div className="text-xl font-black text-white font-mono my-0.5">
              ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              {filteredOrders.length} Open Invoices
            </span>
          </div>

          <div
            className={`p-3.5 rounded-md border shadow-sm flex flex-col justify-between ${
              overdueAmount > 0
                ? "bg-rose-950/20 border-rose-500/30"
                : "bg-[#0f121b] border-white/[0.08]"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overdue (31+d)
            </span>
            <div
              className={`text-xl font-black font-mono my-0.5 ${
                overdueAmount > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              ${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {totalDue > 0 ? `${((overdueAmount / totalDue) * 100).toFixed(0)}% exposure` : "0% exposure"}
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Recovery Rate
            </span>
            <div className="text-xl font-black text-purple-300 font-mono my-0.5">
              {summary ? `${summary.collection_rate_percent}%` : "—"}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {data?.recent_payments?.length ?? 0} Collections
            </span>
          </div>
        </div>

        {/* Compact Aging Distribution Visualizer */}
        <div className="lg:col-span-7">
          <ReceivablesAgingChart
            aging={aging}
            summary={summary}
            isLoading={loading}
            compact={true}
          />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0f121b] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("dues")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "dues"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Receivables ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "receipts"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Recent Collections ({data?.recent_payments?.length ?? 0})
          </button>
        </div>

        {activeTab === "dues" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f121b] border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === "dues" ? (
        <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm">
          {filteredOrders.length === 0 ? (
            <AdminEmptyState
              icon={CheckCircle2}
              title="All Receivables Settled"
              description="No outstanding customer receivables found. All customer orders are fully settled!"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Order #</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Order Date</th>
                    <th className="pb-3 font-semibold">Age Bracket</th>
                    <th className="pb-3 font-semibold text-right">Order Total</th>
                    <th className="pb-3 font-semibold text-right">Paid</th>
                    <th className="pb-3 font-semibold text-right text-cyan-400">Due Amount</th>
                    <th className="pb-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-cyan-400">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {order.customer_email || order.customer_phone || "No contact"}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{order.order_date}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            order.days_open <= 30
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : order.days_open <= 60
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {order.days_open} days open
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300 font-medium">
                        ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-mono text-emerald-400">
                        ${order.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-cyan-300 text-sm">
                        ${order.due_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleOpenPaymentModal(order)}
                          className="px-3 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold transition-all"
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm">
          {(!data?.recent_payments || data.recent_payments.length === 0) ? (
            <AdminEmptyState
              icon={CreditCard}
              title="No Payment Records"
              description="Customer receipts and settlements will be archived here once collected."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Payment Voucher #</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Order #</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Deposited Account</th>
                    <th className="pb-3 font-semibold text-right">Amount Paid</th>
                    <th className="pb-3 font-semibold">Notes / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recent_payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-emerald-400">{p.payment_number}</td>
                      <td className="py-3 font-mono text-slate-300">{p.payment_date}</td>
                      <td className="py-3 font-mono text-cyan-400">
                        {p.order?.order_number || `Order #${p.order_id}`}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-slate-300">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {p.bank_account?.account_name || "General Cash Drawer"}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-emerald-300 text-sm">
                        ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-slate-400 max-w-xs truncate">
                        {p.reference_number ? `Ref: ${p.reference_number}` : p.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Customer Payment</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Order #{selectedOrder.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 rounded-md bg-[#161a26] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Customer</div>
                  <div className="text-sm font-semibold text-white">{selectedOrder.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Remaining Due</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">
                    ${selectedOrder.due_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedOrder.due_amount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="cash">Physical Cash</option>
                    <option value="bank_transfer">Bank Wire</option>
                    <option value="bkash">bKash MFS</option>
                    <option value="nagad">Nagad MFS</option>
                    <option value="credit_card">Card / POS Terminal</option>
                    <option value="cheque">Company Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Account</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(Number(e.target.value))}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.account_name} (${b.current_balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voucher Ref #</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Settlement Memo / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="Optional notes or teller reference..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Posting..." : "Confirm & Post Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
