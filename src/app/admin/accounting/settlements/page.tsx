"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { 
  BadgeDollarSign, 
  Search, 
  Filter, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Plus, 
  X, 
  RefreshCw, 
  Loader2, 
  Building2, 
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Receipt,
  Landmark,
  Coins
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { CourierSettlement, BankAccountItem } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function AdminCourierSettlementsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A78BFA] mb-2" />
        Loading Courier Settlements...
      </div>
    }>
      <SettlementsContent />
    </Suspense>
  );
}

function SettlementsContent() {
  const [settlements, setSettlements] = useState<CourierSettlement[]>([]);
  const [stats, setStats] = useState({
    total_settlements: 0,
    pending_count: 0,
    reconciled_count: 0,
    total_cod_collected: 0,
    total_delivery_fees: 0,
    total_actual_payout: 0,
    total_variance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Bank Accounts for Reconciliation
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Statement Detail Drawer
  const [selectedSettlementId, setSelectedSettlementId] = useState<number | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<CourierSettlement | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Reconciliation Modal
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [reconcileBankId, setReconcileBankId] = useState<number | string>("");
  const [reconcilePayout, setReconcilePayout] = useState<number>(0);
  const [reconcileNotes, setReconcileNotes] = useState<string>("");
  const [reconcileSubmitting, setReconcileSubmitting] = useState(false);

  // New Statement Batch Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProvider, setBatchProvider] = useState("steadfast");
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [batchNumber, setBatchNumber] = useState("");
  const [batchActualPayout, setBatchActualPayout] = useState<string>("");
  const [batchItemsRaw, setBatchItemsRaw] = useState<string>("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettlements({
        provider: providerFilter !== "all" ? providerFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
        page: 1,
        per_page: 50,
      });
      setSettlements(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      toast.error("Failed to load courier settlements");
    } finally {
      setLoading(false);
    }
  }, [providerFilter, statusFilter, searchQuery]);

  const fetchBanks = async () => {
    try {
      const res = await adminApi.getAccountingBanking();
      if (res.accounts) {
        setBankAccounts(res.accounts);
        if (res.accounts.length > 0) {
          setReconcileBankId(res.accounts[0].id);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSettlements();
    fetchBanks();
  }, [fetchSettlements]);

  const loadSettlementDetail = async (id: number) => {
    setDrawerLoading(true);
    try {
      const res = await adminApi.getSettlement(id);
      setSelectedSettlement(res.data);
      setSelectedSettlementId(id);
    } catch (err: any) {
      toast.error("Failed to load statement details");
    } finally {
      setDrawerLoading(false);
    }
  };

  const openReconcileModal = (st: CourierSettlement) => {
    setSelectedSettlement(st);
    setReconcilePayout(st.actual_payout || st.expected_payout);
    setReconcileNotes("");
    setReconcileModalOpen(true);
  };

  const handleReconcileSubmit = async () => {
    if (!selectedSettlement || !reconcileBankId) {
      toast.error("Please select a target Bank Account");
      return;
    }
    setReconcileSubmitting(true);
    try {
      await adminApi.reconcileSettlement(selectedSettlement.id, {
        bank_account_id: parseInt(reconcileBankId as string),
        actual_payout: parseFloat(reconcilePayout as any),
        notes: reconcileNotes,
      });
      toast.success("Settlement reconciled! Double-entry journal posted & shipments updated.");
      setReconcileModalOpen(false);
      fetchSettlements();
      loadSettlementDetail(selectedSettlement.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reconcile settlement");
    } finally {
      setReconcileSubmitting(false);
    }
  };

  const handleCreateBatch = async () => {
    // Parse batchItemsRaw
    // Format per line: consignment_id, cod_collected, delivery_fee, rto_fee
    const lines = batchItemsRaw.trim().split("\n");
    const items = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        items.push({
          consignment_id: parts[0],
          cod_collected: parseFloat(parts[1]) || 0,
          delivery_fee: parseFloat(parts[2] || "0") || 0,
          rto_fee: parseFloat(parts[3] || "0") || 0,
        });
      }
    }

    if (items.length === 0) {
      toast.error("Please enter at least one consignment item (ConsignmentID, COD, DeliveryFee)");
      return;
    }

    setBatchSubmitting(true);
    try {
      await adminApi.createSettlement({
        provider: batchProvider,
        settlement_date: batchDate,
        settlement_number: batchNumber || undefined,
        actual_payout: batchActualPayout ? parseFloat(batchActualPayout) : undefined,
        items,
      });
      toast.success("Courier settlement batch created successfully!");
      setBatchModalOpen(false);
      setBatchItemsRaw("");
      setBatchNumber("");
      setBatchActualPayout("");
      fetchSettlements();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create settlement batch");
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-emerald-500" />
            Courier Settlements & Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconcile courier COD remittance advices, delivery fee deductions, RTO reverse fees, and ledger variance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSettlements()}
            className="p-2 border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Settlement Statement
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Statements</span>
          <div className="mt-1 text-2xl font-bold text-foreground">{stats.total_settlements}</div>
          <span className="text-xs text-muted-foreground">{stats.reconciled_count} reconciled, {stats.pending_count} pending</span>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-blue-500 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> Total COD Collected
          </span>
          <div className="mt-1 text-2xl font-bold text-blue-500">{formatPrice(stats.total_cod_collected)}</div>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5" /> Net Actual Payout
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-500">{formatPrice(stats.total_actual_payout)}</div>
        </div>
        <div className="p-4 rounded-md border border-border bg-card shadow-sm">
          <span className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 ${
            stats.total_variance !== 0 ? "text-amber-500" : "text-muted-foreground"
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" /> Variance Discrepancy
          </span>
          <div className={`mt-1 text-2xl font-bold ${stats.total_variance !== 0 ? "text-amber-500" : "text-foreground"}`}>
            {formatPrice(stats.total_variance)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="text-xs p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Couriers</option>
            <option value="steadfast">Steadfast Courier</option>
            <option value="pathao">Pathao Courier</option>
            <option value="redx">RedX Logistics</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reconciled">Reconciled</option>
            <option value="disputed">Disputed / Variance</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search statement #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollableTableCard>
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
            Loading statements...
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BadgeDollarSign className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium text-foreground">No courier settlement statements found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a statement batch to reconcile remittance advices against booked shipments.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Statement #</th>
                <th className="px-4 py-3 font-semibold">Courier</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Total COD</th>
                <th className="px-4 py-3 font-semibold text-right">Deductions</th>
                <th className="px-4 py-3 font-semibold text-right">Actual Payout</th>
                <th className="px-4 py-3 font-semibold text-right">Variance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlements.map((st) => {
                const hasVariance = Math.abs(st.variance) > 0.01;
                return (
                  <tr key={st.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => loadSettlementDetail(st.id)}
                        className="font-mono font-medium text-emerald-500 hover:underline text-left block"
                      >
                        {st.settlement_number}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <span className="capitalize font-medium text-foreground">{st.provider}</span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(st.settlement_date)}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatPrice(st.total_cod_collected)}
                    </td>

                    <td className="px-4 py-3 text-right text-rose-400">
                      -{formatPrice(st.delivery_fees + st.return_fees + st.other_deductions)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-500">
                      {formatPrice(st.actual_payout)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {hasVariance ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <AlertTriangle className="w-3 h-3" />
                          {formatPrice(st.variance)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">৳0.00</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        st.status === "reconciled"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : st.status === "disputed"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {st.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {st.status !== "reconciled" && (
                          <button
                            onClick={() => openReconcileModal(st)}
                            className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
                          >
                            Reconcile
                          </button>
                        )}
                        <button
                          onClick={() => loadSettlementDetail(st.id)}
                          className="p-1 hover:bg-accent text-muted-foreground hover:text-foreground rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollableTableCard>

      {/* Statement Detail Drawer */}
      {selectedSettlementId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto flex flex-col shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-mono text-muted-foreground uppercase">Settlement Statement</span>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BadgeDollarSign className="w-5 h-5 text-emerald-500" />
                  {selectedSettlement?.settlement_number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSettlementId(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading || !selectedSettlement ? (
              <div className="py-20 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                Loading statement details...
              </div>
            ) : (
              <div className="space-y-6 text-sm">
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md border border-border">
                  <div>
                    <span className="text-xs text-muted-foreground block">Provider</span>
                    <span className="font-semibold text-foreground uppercase text-xs">
                      {selectedSettlement.provider}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Date</span>
                    <span className="font-semibold text-foreground text-xs">
                      {formatDate(selectedSettlement.settlement_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Status</span>
                    <span className="font-semibold text-foreground capitalize text-xs">
                      {selectedSettlement.status}
                    </span>
                  </div>
                </div>

                {/* 2. Reconciliation Financials */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Financial Settlement Breakdown
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total COD Collected:</span>
                      <span className="font-medium text-foreground">{formatPrice(selectedSettlement.total_cod_collected)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Delivery & COD Fees:</span>
                      <span>-{formatPrice(selectedSettlement.delivery_fees)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>RTO Reverse Fees:</span>
                      <span>-{formatPrice(selectedSettlement.return_fees)}</span>
                    </div>
                    {selectedSettlement.other_deductions > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Other Deductions:</span>
                        <span>-{formatPrice(selectedSettlement.other_deductions)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                      <span>Expected Net Remittance:</span>
                      <span>{formatPrice(selectedSettlement.expected_payout)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-500">
                      <span>Actual Payout Received:</span>
                      <span>{formatPrice(selectedSettlement.actual_payout)}</span>
                    </div>
                    {Math.abs(selectedSettlement.variance) > 0.01 && (
                      <div className="flex justify-between font-bold text-amber-500 bg-amber-500/10 p-2 rounded">
                        <span>Discrepancy / Variance:</span>
                        <span>{formatPrice(selectedSettlement.variance)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Matched Consignments */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Consignments in this Batch ({selectedSettlement.items?.length || 0})
                  </h3>
                  <div className="divide-y divide-border max-h-60 overflow-y-auto">
                    {selectedSettlement.items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-medium text-foreground block">
                            {item.consignment_id || item.tracking_code || "CID #N/A"}
                          </span>
                          {item.order && (
                            <span className="text-muted-foreground block">
                              Order #{item.order.order_number} ({item.order.customer_name})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-foreground block">
                            COD: {formatPrice(item.cod_collected)}
                          </span>
                          <span className="text-muted-foreground">
                            Fee: {formatPrice(item.delivery_fee + item.rto_fee)} | Net: {formatPrice(item.net_payout)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Action Button */}
                {selectedSettlement.status !== "reconciled" && (
                  <button
                    onClick={() => openReconcileModal(selectedSettlement)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition text-center"
                  >
                    Reconcile to Bank Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcileModalOpen && selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-500" />
                Reconcile Statement ({selectedSettlement.settlement_number})
              </h2>
              <button onClick={() => setReconcileModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Reconciling will credit your Bank Account with the net cash payout, debit Courier Logistics Expense for fees, and clear Accounts Receivable.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Target Bank Account</label>
                <select
                  value={reconcileBankId}
                  onChange={(e) => setReconcileBankId(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} - {b.account_name} ({b.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Actual Cash Payout (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={reconcilePayout}
                  onChange={(e) => setReconcilePayout(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Reconciliation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bank advice slip #..."
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setReconcileModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reconcileSubmitting}
                onClick={handleReconcileSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {reconcileSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Post Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Statement Batch Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                New Courier Statement Batch
              </h2>
              <button onClick={() => setBatchModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Courier Provider</label>
                  <select
                    value={batchProvider}
                    onChange={(e) => setBatchProvider(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                  >
                    <option value="steadfast">Steadfast Courier</option>
                    <option value="pathao">Pathao Courier</option>
                    <option value="redx">RedX Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Statement Date</label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Statement Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ST-20260913-01"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Consignments (Format: ConsignmentID, COD, DeliveryFee, RTOFee)
                </label>
                <textarea
                  rows={4}
                  placeholder={`1234567, 1500, 60, 0\n7654321, 850, 60, 0`}
                  value={batchItemsRaw}
                  onChange={(e) => setBatchItemsRaw(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded-md font-mono text-xs text-foreground focus:outline-none"
                />
                <span className="text-xs text-muted-foreground block mt-0.5">
                  Enter 1 consignment per line. The system automatically links booked shipments.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={batchSubmitting}
                onClick={handleCreateBatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {batchSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
