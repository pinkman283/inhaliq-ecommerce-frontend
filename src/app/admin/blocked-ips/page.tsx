"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Plus, 
  Clock, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  X, 
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { BlockedIp, Order, User } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { toast } from "sonner";

export default function AdminBlockedIpsPage() {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State: Block New IP
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [ipToBlock, setIpToBlock] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockNotes, setBlockNotes] = useState("");
  const [blockDuration, setBlockDuration] = useState<"1_hour" | "24_hours" | "7_days" | "30_days" | "permanent" | "custom">("permanent");
  const [customExpiresAt, setCustomExpiresAt] = useState("");

  // Modal State: Related Entities Inspection Drawer
  const [inspectingIp, setInspectingIp] = useState<BlockedIp | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedOrders, setRelatedOrders] = useState<Order[]>([]);
  const [relatedCustomers, setRelatedCustomers] = useState<User[]>([]);

  const fetchBlockedIps = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBlockedIps({
        search: search || undefined,
        status: statusFilter,
        page,
        per_page: 20,
      });
      setBlockedIps(res.data);
      setTotalPages(res.last_page);
      setTotalCount(res.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load blocked IP registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIps();
  }, [search, statusFilter, page]);

  const handleOpenInspect = async (item: BlockedIp) => {
    setInspectingIp(item);
    try {
      setRelatedLoading(true);
      const res = await adminApi.getBlockedIpRelated(item.id);
      setRelatedOrders(res.orders || []);
      setRelatedCustomers(res.customers || []);
    } catch (err: any) {
      toast.error("Failed to load associated orders and customers.");
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipToBlock.trim() || !blockReason.trim()) {
      toast.error("Please enter a valid IP address and reason.");
      return;
    }

    try {
      setSubmittingBlock(true);
      const res = await adminApi.blockIp({
        ip_address: ipToBlock.trim(),
        reason: blockReason.trim(),
        notes: blockNotes.trim() || undefined,
        duration: blockDuration,
        custom_expires_at: blockDuration === "custom" ? customExpiresAt : undefined,
      });

      toast.success(res.message);
      if (res.co_tenant_warning) {
        toast.warning(res.co_tenant_warning, { duration: 6000 });
      }

      setIsBlockModalOpen(false);
      setIpToBlock("");
      setBlockReason("");
      setBlockNotes("");
      setBlockDuration("permanent");
      setCustomExpiresAt("");
      fetchBlockedIps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to block IP address.");
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleUnblock = async (id: number, ip: string) => {
    if (!confirm(`Are you sure you want to unblock IP address ${ip}?`)) return;

    try {
      const res = await adminApi.unblockIp(id, "Admin manual unblock");
      toast.success(res.message);
      fetchBlockedIps();
      if (inspectingIp?.id === id) {
        setInspectingIp(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unblock IP.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">IP Abuse & Blocking Registry</h1>
              <p className="text-xs text-slate-400">Enforce network-level perimeter defenses, prevent automated fraud probes, and investigate IP co-tenants.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Block New IP</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0e131f] p-4 rounded-md border border-white/5">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP address, reason, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#07080c] border border-white/10 rounded-md pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <AdminDropdown
            value={statusFilter}
            onChange={(val: string) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active Blocks", value: "active" },
              { label: "Expired Blocks", value: "expired" },
              { label: "Revoked Blocks", value: "revoked" },
            ]}
          />

          <button
            onClick={fetchBlockedIps}
            className="p-2 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Blocked IP Table */}
      <div className="p-4 rounded-md bg-[#0b0d14] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Blocked IP Addresses ({totalCount})</h2>
        </div>
        <ScrollableTableCard className="border-white/5">
          <table className="w-full min-w-[950px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4">Blocked By</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4 text-center">Associated Entities</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                      <span>Loading blocked IP security telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : blockedIps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
                    <p className="font-semibold text-slate-400">No Blocked IPs Found</p>
                    <p className="text-[11px]">No active network block rules match your search criteria.</p>
                  </td>
                </tr>
              ) : (
                blockedIps.map((item) => {
                  const isActive = item.is_active ?? item.status === "active";
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <span className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
                          IP
                        </span>
                        {item.ip_address}
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : item.status === "expired" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            REVOKED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-white font-medium truncate" title={item.reason}>{item.reason}</p>
                        {item.notes && <p className="text-slate-500 text-[11px] truncate" title={item.notes}>{item.notes}</p>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {item.blocked_by?.name || "System Automated"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.expires_at ? (
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{formatDate(item.expires_at)} {formatTime(item.expires_at)}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                            <Lock className="w-3 h-3" />
                            Permanent
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenInspect(item)}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-cyan-400 hover:text-cyan-300 transition-all font-mono text-[11px]"
                        >
                          <span>{item.related_orders_count ?? 0} Orders</span>
                          <span className="text-slate-600">|</span>
                          <span>{item.related_customers_count ?? 0} Users</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenInspect(item)}
                            className="p-1.5 rounded-md bg-white/[0.03] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 border border-white/5 transition-all"
                            title="Inspect related orders & customers"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {isActive && (
                            <button
                              onClick={() => handleUnblock(item.id, item.ip_address)}
                              className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold transition-all"
                              title="Revoke block rule"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-slate-400">
            <span>Page {page} of {totalPages} ({totalCount} total rules)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none border border-white/10 text-white transition-all"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none border border-white/10 text-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ScrollableTableCard>
      </div>

      {/* Block New IP Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0d14] border border-white/10 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Add IP Block Rule</h3>
                  <p className="text-[11px] text-slate-400">Restricts order creation and protected customer actions from this IP.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBlockIp} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  IP Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 198.51.100.45 or 2001:db8::1"
                  value={ipToBlock}
                  onChange={(e) => setIpToBlock(e.target.value)}
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Reason for Block <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abusive cancellation flood, Botnet probe, Chargeback fraud"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Block Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "1 Hour", value: "1_hour" },
                    { label: "24 Hours", value: "24_hours" },
                    { label: "7 Days", value: "7_days" },
                    { label: "30 Days", value: "30_days" },
                    { label: "Permanent", value: "permanent" },
                    { label: "Custom", value: "custom" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBlockDuration(opt.value as any)}
                      className={`py-2 px-3 rounded-md border text-xs font-semibold transition-all ${
                        blockDuration === opt.value
                          ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {blockDuration === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Expiration Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    className="w-full bg-[#07080c] border border-white/10 rounded-md px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500/50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Internal Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add internal security investigation details..."
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3.5 py-2 text-white text-xs focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <p>
                  <strong>Shared Network Caution:</strong> Ensure this IP is not a major corporate proxy or cellular NAT gateway before applying long-term blocks to prevent collateral impact on innocent customers.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBlock}
                  className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submittingBlock && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm IP Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Related Entities Drawer/Modal */}
      {inspectingIp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0d14] border border-white/10 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    IP Intelligence & Co-Tenancy: <span className="font-mono text-cyan-400">{inspectingIp.ip_address}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reason: <span className="text-white">{inspectingIp.reason}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingIp(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
              {relatedLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                  <span>Loading IP association ledger...</span>
                </div>
              ) : (
                <>
                  {/* Co-Tenant Accounts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                        <Users className="w-4 h-4 text-purple-400" />
                        Associated Customer Accounts ({relatedCustomers.length})
                      </h4>
                    </div>

                    {relatedCustomers.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">No registered customer accounts recorded for this IP.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {relatedCustomers.map((c) => (
                          <div key={c.id} className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{c.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                c.status === "blocked" ? "bg-red-500/10 text-red-400" :
                                c.status === "suspended" ? "bg-amber-500/10 text-amber-400" :
                                "bg-emerald-500/10 text-emerald-400"
                              }`}>
                                {c.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px]">{c.email}</p>
                            <p className="text-slate-500 text-[10px]">Type: {c.customer_type === "guest" ? "Guest Purchaser" : "Registered User"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Associated Orders */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        Order History from this IP ({relatedOrders.length})
                      </h4>
                    </div>

                    {relatedOrders.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">No orders recorded originating from this IP address.</p>
                    ) : (
                      <div className="border border-white/5 rounded-md overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01] text-slate-400 font-semibold text-[11px]">
                              <th className="py-2.5 px-3">Order #</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Total</th>
                              <th className="py-2.5 px-3 text-right">Placed At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {relatedOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-white/[0.02]">
                                <td className="py-2.5 px-3 font-mono font-bold text-white">{ord.order_number}</td>
                                <td className="py-2.5 px-3 text-slate-400">{ord.customer_name}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    ord.order_status === "cancelled" ? "bg-red-500/10 text-red-400" :
                                    ord.order_status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                                    "bg-cyan-500/10 text-cyan-400"
                                  }`}>
                                    {ord.order_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold text-white">\${ord.total_amount}</td>
                                <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">{formatDate(ord.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">Security Audit Log ID: #{inspectingIp.id}</span>
              <button
                onClick={() => setInspectingIp(null)}
                className="px-4 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
