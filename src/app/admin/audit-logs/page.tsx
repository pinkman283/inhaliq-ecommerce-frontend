"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ScrollText, 
  Search, 
  Eye, 
  X, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Layers, 
  Code2, 
  CheckCircle2, 
  MinusCircle, 
  Calendar, 
  Globe, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Lock,
  BadgeDollarSign,
  PackageCheck,
  UserCheck,
  Building2,
  Trash2
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AuditLog, AuditLogStats, AuditLogFacets } from "@/types";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats>({
    total_logs: 0,
    today_logs: 0,
    auth_events: 0,
    financial_ops: 0,
  });
  const [facets, setFacets] = useState<AuditLogFacets>({
    entity_types: [],
    actors: [],
    modules: [],
  });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter Dropdown Open State
  const [openModuleDropdown, setOpenModuleDropdown] = useState(false);
  const [openEntityDropdown, setOpenEntityDropdown] = useState(false);
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fromRecord, setFromRecord] = useState<number | null>(null);
  const [toRecord, setToRecord] = useState<number | null>(null);

  // Inspect Diff Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({
        search: search.trim() || undefined,
        module: moduleFilter !== "all" ? moduleFilter : undefined,
        entity_type: entityFilter !== "all" ? entityFilter : undefined,
        user_role: roleFilter !== "all" ? roleFilter : undefined,
        user_id: actorFilter !== "all" ? actorFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: perPage,
      });

      setLogs(res.logs.data || []);
      setPage(res.logs.current_page || 1);
      setTotalPages(res.logs.last_page || 1);
      setTotalRecords(res.logs.total || 0);
      setFromRecord(res.logs.from);
      setToRecord(res.logs.to);

      if (res.stats) setStats(res.stats);
      if (res.facets) setFacets(res.facets);
    } catch (err) {
      toast.error("Failed to load audit trail records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, perPage, moduleFilter, entityFilter, roleFilter, actorFilter, dateFrom, dateTo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAuditLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setModuleFilter("all");
    setEntityFilter("all");
    setRoleFilter("all");
    setActorFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    toast.success("Audit filters reset.");
  };

  const handleToggleSelectAll = () => {
    if (logs.length > 0 && selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((l) => l.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently purge ${selectedIds.length} audit log record(s)? This action is immutable.`)) return;

    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteAuditLogs(selectedIds);
      if (selectedLog && selectedIds.includes(selectedLog.id)) setSelectedLog(null);
      setSelectedIds([]);
      toast.success(res.message || `Purged ${selectedIds.length} audit log record(s).`);
      loadAuditLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to purge selected audit logs.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Helper to format keys cleanly (e.g. stock_quantity -> Stock Quantity)
  const formatKeyName = (key: string): string => {
    const customMappings: Record<string, string> = {
      stock_quantity: "Stock Quantity",
      order_status: "Fulfillment Status",
      payment_status: "Payment Status",
      reason: "Audit / Restock Reason",
      unit_price: "Unit Price",
      total_amount: "Total Amount",
      is_active: "Active Status",
      is_approved: "Approval Status",
      role: "Security Role",
      tracking_code: "Tracking Code",
      carrier: "Shipping Carrier",
    };
    if (customMappings[key]) return customMappings[key];

    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper to render property values cleanly
  const renderValueBadge = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-500 italic text-[11px]">None / Unset</span>;
    }
    if (typeof val === "boolean") {
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
          val 
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
        }`}>
          {val ? "Enabled" : "Disabled"}
        </span>
      );
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-500 italic text-[11px]">Empty Array</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px] font-medium border border-white/10">
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof val === "object") {
      return (
        <div className="space-y-1 pl-2 border-l border-white/10">
          {Object.entries(val).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 text-[11px]">
              <span className="text-slate-400 font-semibold">{formatKeyName(k)}:</span>
              <span className="text-white font-bold">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="font-bold text-white text-xs">{String(val)}</span>;
  };

  // Helper to colorize actions
  const getActionColor = (action: string) => {
    if (action.includes("deleted") || action.includes("purged") || action.includes("cancelled") || action.includes("suspended") || action.includes("rejected")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (action.includes("created") || action.includes("approved") || action.includes("received") || action.includes("reactivated")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (action.startsWith("auth.")) {
      return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
    }
    if (action.startsWith("pos.") || action.startsWith("order.") || action.startsWith("sales.")) {
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    }
    if (action.startsWith("inventory.") || action.startsWith("purchase_order.") || action.startsWith("goods_receipt.")) {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    }
    return "bg-purple-500/10 text-purple-300 border-purple-500/30";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0f18] p-5 rounded-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
                Immutable Cryptographic Ledger
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">System Audit Trail</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive telemetry, mutation diffs, and security audit logs across all business modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAuditLogs}
            className="px-3.5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
            title="Refresh Audit Trail"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#A78BFA] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Logs */}
        <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Total Events</span>
            <Activity className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#A78BFA] font-mono">
            {stats.total_logs.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Recorded in immutable ledger
          </div>
        </div>

        {/* Logs Today */}
        <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Activity Today</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
            {stats.today_logs.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Operations executed today
          </div>
        </div>

        {/* Security & Auth */}
        <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Security & Auth</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
            {stats.auth_events.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Logins, passwords & permissions
          </div>
        </div>

        {/* Financial & Commercial Ops */}
        <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Commercial Ops</span>
            <BadgeDollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
            {stats.financial_ops.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            POS, Orders, POs & Expenses
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Toolbar */}
      <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user, entity, description..."
              className="w-full bg-[#151824] border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
            />
          </form>

          {/* Rounded Filter Popover Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* System Module Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenModuleDropdown(!openModuleDropdown);
                  setOpenEntityDropdown(false);
                  setOpenRoleDropdown(false);
                }}
                className="bg-[#151824] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md px-3.5 py-2 text-xs font-bold text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                  <Layers className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                  <span className="truncate">
                    {moduleFilter === "all"
                      ? "All System Modules"
                      : facets.modules.find(m => m.id === moduleFilter)?.label || moduleFilter}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openModuleDropdown ? "rotate-180 text-[#A78BFA]" : ""}`} />
              </button>

              {openModuleDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenModuleDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                    {facets.modules.map(mod => (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setModuleFilter(mod.id);
                          setPage(1);
                          setOpenModuleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          moduleFilter === mod.id
                            ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{mod.label}</span>
                        {moduleFilter === mod.id && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Entity Type Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenEntityDropdown(!openEntityDropdown);
                  setOpenModuleDropdown(false);
                  setOpenRoleDropdown(false);
                }}
                className="bg-[#151824] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md px-3.5 py-2 text-xs font-bold text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {entityFilter === "all" ? "All Entity Types" : entityFilter}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openEntityDropdown ? "rotate-180 text-[#A78BFA]" : ""}`} />
              </button>

              {openEntityDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenEntityDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEntityFilter("all");
                        setPage(1);
                        setOpenEntityDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        entityFilter === "all"
                          ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>All Entity Types</span>
                      {entityFilter === "all" && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                    </button>
                    {facets.entity_types.map(ent => (
                      <button
                        key={ent}
                        type="button"
                        onClick={() => {
                          setEntityFilter(ent);
                          setPage(1);
                          setOpenEntityDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          entityFilter === ent
                            ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{ent}</span>
                        {entityFilter === ent && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Role Filter Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenRoleDropdown(!openRoleDropdown);
                  setOpenModuleDropdown(false);
                  setOpenEntityDropdown(false);
                }}
                className="bg-[#151824] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md px-3.5 py-2 text-xs font-bold text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {roleFilter === "all" && "All Roles"}
                    {roleFilter === "super_admin" && "Super Admin"}
                    {roleFilter === "admin" && "Admin"}
                    {roleFilter === "staff" && "Staff"}
                    {roleFilter === "system" && "System Bot"}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openRoleDropdown ? "rotate-180 text-[#A78BFA]" : ""}`} />
              </button>

              {openRoleDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenRoleDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                    {[
                      { id: "all", label: "All Roles" },
                      { id: "super_admin", label: "Super Admin" },
                      { id: "admin", label: "Admin" },
                      { id: "staff", label: "Staff" },
                      { id: "system", label: "System Bot" },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRoleFilter(r.id);
                          setPage(1);
                          setOpenRoleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          roleFilter === r.id
                            ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{r.label}</span>
                        {roleFilter === r.id && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date Range Pickers */}
            <div className="flex items-center gap-1.5 bg-[#151824] px-3 py-1.5 rounded-md border border-white/10 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="bg-transparent text-white text-xs focus:outline-none [color-scheme:dark]"
              />
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="bg-transparent text-white text-xs focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table with Scrollable Table Card */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs text-slate-300 min-w-[850px]">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <AdminCheckbox
                  checked={logs.length > 0 && selectedIds.length === logs.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < logs.length}
                  onChange={handleToggleSelectAll}
                  title="Select all audit logs"
                />
              </th>
              <th className="p-3.5 min-w-[160px]">Timestamp & Time</th>
              <th className="p-3.5">Administrator</th>
              <th className="p-3.5">Action Type</th>
              <th className="p-3.5">Entity / Target</th>
              <th className="p-3.5">Operation Description</th>
              <th className="p-3.5 text-center min-w-[90px]">Inspect Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCcw className="w-5 h-5 text-[#A78BFA] animate-spin" />
                    <span>Querying cryptographic audit records...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500 italic">
                  No matching audit records found for the selected filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <tr
                    key={log.id}
                    className={`transition-colors font-mono text-[11px] ${
                      isSelected
                        ? "bg-[#211B32] border-l-2 border-[#A78BFA]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(log.id)}
                        title="Select log entry"
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-white font-bold font-sans text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {formatDate(log.created_at)}
                        </span>
                        <span className="text-[10px] text-[#A78BFA] font-mono flex items-center gap-1 mt-0.5 font-semibold">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          {formatTime(log.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-sans font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-[#A78BFA] shrink-0">
                          {log.user_name ? log.user_name.slice(0, 2).toUpperCase() : "SY"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-white leading-tight">{log.user_name || "System"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.user_role ? log.user_role.toUpperCase() : "SYSTEM"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-cyan-300 font-bold whitespace-nowrap">
                      {log.entity_type ? (
                        <span>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""}</span>
                      ) : (
                        <span className="text-slate-500 italic">Global</span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans text-slate-300 max-w-sm truncate">
                      {log.description || "No description logged"}
                    </td>
                    <td className="p-3.5 text-center font-sans whitespace-nowrap">
                      {(log.old_values || log.new_values) ? (
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowRawJson(false);
                          }}
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 transition-all shadow-sm mx-auto cursor-pointer"
                          title="View Change Diff Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px] italic">No Diff</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* Pagination Bar */}
      <div className="bg-[#0e121e] p-4 sm:p-5 rounded-md border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-white font-mono">{fromRecord || 0}</strong> to <strong className="text-white font-mono">{toRecord || 0}</strong> of <strong className="text-[#A78BFA] font-mono">{totalRecords.toLocaleString()}</strong> audit records
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
              className="bg-[#151824] border border-white/10 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-[#A78BFA]/50 cursor-pointer"
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
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-md bg-[#211B32] border border-[#A78BFA]/30 text-[#A78BFA] font-mono font-bold text-xs">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition cursor-pointer border border-white/5"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Structured Change Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedLog(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" />

          <div className="relative w-full max-w-2xl rounded-lg bg-[#0c0e15] border border-white/15 shadow-2xl p-6 sm:p-8 z-10 space-y-5 text-xs max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A78BFA] block">
                  Action Inspection & Audit Diff
                </span>
                <h3 className="text-base font-black text-white font-mono">{selectedLog.action}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Telemetry Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A78BFA]" /> Timestamp
                </span>
                <span className="text-xs font-mono font-bold text-[#A78BFA] block">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> Executor
                </span>
                <span className="text-xs font-bold text-white block truncate">
                  {selectedLog.user_name || "System"} <span className="text-[10px] text-slate-400 font-mono">({selectedLog.user_role || "system"})</span>
                </span>
              </div>
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3 text-purple-400" /> Entity & Source
                </span>
                <span className="text-xs font-mono text-purple-300 block truncate">
                  {selectedLog.entity_type || "System"} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ""} {selectedLog.ip_address ? `• ${selectedLog.ip_address}` : ""}
                </span>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Operation Summary
              </span>
              <p className="text-slate-200 text-xs leading-relaxed font-sans">{selectedLog.description}</p>
            </div>

            {/* Structured Property Comparison Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  State Mutation Properties
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[10px] text-slate-400 hover:text-[#A78BFA] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showRawJson ? "Show Formatted Cards" : "View Raw JSON Payload"}
                </button>
              </div>

              {!showRawJson ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ORIGINAL STATE (OLD) */}
                  <div className="p-4 rounded-md bg-[#0e121e] border border-rose-500/20 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <MinusCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                        Original State (Old)
                      </span>
                    </div>

                    {!selectedLog.old_values || Object.keys(selectedLog.old_values).length === 0 ? (
                      <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 text-center text-slate-500 italic text-[11px]">
                        No prior state (New Entity Created)
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(selectedLog.old_values).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-2.5 rounded-md bg-rose-500/5 border border-rose-500/20 flex flex-col gap-1"
                          >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatKeyName(k)}
                            </span>
                            <div>{renderValueBadge(v)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* MUTATED STATE (NEW) */}
                  <div className="p-4 rounded-md bg-[#0e121e] border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                        Mutated State (New)
                      </span>
                    </div>

                    {!selectedLog.new_values || Object.keys(selectedLog.new_values).length === 0 ? (
                      <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 text-center text-slate-500 italic text-[11px]">
                        Entity Deleted / Depleted
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(selectedLog.new_values).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1"
                          >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatKeyName(k)}
                            </span>
                            <div>{renderValueBadge(v)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Raw JSON toggle for technical inspection */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                      Original State JSON
                    </span>
                    <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto p-3 bg-black/60 rounded-md max-h-56">
                      {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : "null"}
                    </pre>
                  </div>

                  <div className="p-4 rounded-md bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Mutated State JSON
                    </span>
                    <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto p-3 bg-black/60 rounded-md max-h-56">
                      {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : "null"}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-black uppercase tracking-wide text-xs transition-all shadow-md cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={logs.length}
        itemName="audit log"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
