"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Magnet, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  MessageCircle, 
  Trash2, 
  Eye, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  UserX, 
  X, 
  ArrowRight,
  ShieldAlert,
  ChevronDown
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { Lead, LeadStats } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { toast } from "sonner";

export default function AdminLeadsPage() {
  const { adminUser } = useAdminAuthStore();

  // Role & Permissions
  const canView = adminUser?.role === "super_admin" || adminUser?.permissions?.includes("leads.view");
  const canManage = adminUser?.role === "super_admin" || adminUser?.permissions?.includes("leads.manage");
  const canConvert = adminUser?.role === "super_admin" || adminUser?.permissions?.includes("leads.convert") || adminUser?.permissions?.includes("leads.manage");
  const canDelete = adminUser?.role === "super_admin" || adminUser?.permissions?.includes("leads.delete") || adminUser?.permissions?.includes("leads.manage");

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total_leads: 0,
    pipeline_value: 0,
    new_leads_count: 0,
    contacted_count: 0,
    in_progress_count: 0,
    converted_count: 0,
    lost_count: 0,
    conversion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modals State
  const [inspectingLead, setInspectingLead] = useState<Lead | null>(null);
  const [inspectingNoteLead, setInspectingNoteLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [converting, setConverting] = useState(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<number | null>(null);

  // Cursor Drag Scrolling State
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  
  // Convert to order form state
  const [convertPaymentMethod, setConvertPaymentMethod] = useState("cash_on_delivery");
  const [convertPaymentStatus, setConvertPaymentStatus] = useState("pending");
  const [convertOrderStatus, setConvertOrderStatus] = useState("processing");
  const [convertNotes, setConvertNotes] = useState("");

  const loadLeads = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await adminApi.getLeads({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setLeads(data.leads.data || []);
      setStats(data.stats);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load lead records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [canView, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  // Row selection handlers
  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  // Status Change
  const handleStatusChange = async (id: number, newStatus: Lead["status"]) => {
    if (!canManage) {
      toast.error("You lack permission to update lead statuses.");
      return;
    }

    try {
      const res = await adminApi.updateLead(id, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
      if (inspectingLead && inspectingLead.id === id) {
        setInspectingLead({ ...inspectingLead, status: newStatus });
      }
      toast.success(`Lead status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!inspectingLead || !canManage) return;
    setUpdatingNotes(true);
    try {
      await adminApi.updateLead(inspectingLead.id, { notes: leadNotes });
      setLeads((prev) => prev.map((l) => (l.id === inspectingLead.id ? { ...l, notes: leadNotes } : l)));
      setInspectingLead({ ...inspectingLead, notes: leadNotes });
      toast.success("Lead notes updated successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save notes.");
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleSaveNoteForLead = async (leadId: number, notesToSave: string) => {
    if (!canManage) return;
    setUpdatingNotes(true);
    try {
      await adminApi.updateLead(leadId, { notes: notesToSave });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes: notesToSave } : l)));
      if (inspectingLead?.id === leadId) {
        setInspectingLead({ ...inspectingLead, notes: notesToSave });
      }
      if (inspectingNoteLead?.id === leadId) {
        setInspectingNoteLead({ ...inspectingNoteLead, notes: notesToSave });
      }
      toast.success("Lead note saved successfully.");
      setInspectingNoteLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save note.");
    } finally {
      setUpdatingNotes(false);
    }
  };

  // Drag-to-scroll Handlers for Table
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) return;
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Delete Single
  const handleDeleteLead = async (id: number) => {
    if (!canDelete) {
      toast.error("You lack permission to delete lead records.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;

    try {
      await adminApi.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      if (inspectingLead?.id === id) setInspectingLead(null);
      toast.success("Lead record deleted permanently.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!canDelete) {
      toast.error("You lack permission to delete lead records.");
      return;
    }
    if (selectedIds.length === 0) return;

    setBulkDeleting(true);
    try {
      await adminApi.bulkDeleteLeads(selectedIds);
      setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
      toast.success(`Successfully deleted ${selectedIds.length} lead record(s).`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected leads.");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Convert to Order Execution
  const handleExecuteConversion = async () => {
    if (!convertingLead || !canConvert) return;
    setConverting(true);
    try {
      const res = await adminApi.convertLeadToOrder(convertingLead.id, {
        payment_method: convertPaymentMethod,
        payment_status: convertPaymentStatus,
        order_status: convertOrderStatus,
        notes: convertNotes || undefined,
      });

      // Update state
      setLeads((prev) => prev.map((l) => (l.id === convertingLead.id ? { ...l, status: "converted", converted_order_id: res.order.id } : l)));
      if (inspectingLead?.id === convertingLead.id) {
        setInspectingLead({ ...inspectingLead, status: "converted", converted_order_id: res.order.id });
      }

      toast.success(`Successfully created Order #${res.order.order_number}!`);
      setConvertingLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert lead into order.");
    } finally {
      setConverting(false);
    }
  };

  if (!canView) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center space-y-4">
        <div className="w-16 h-16 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Access Denied: Restricted Module</h2>
        <p className="text-xs text-slate-400">
          You do not have the <span className="text-rose-400 font-mono">leads.view</span> permission required to inspect leads. Please contact the Super Administrator.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">New Lead</span>;
      case "contacted":
        return <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">Contacted</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">In Progress</span>;
      case "converted":
        return <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Converted</span>;
      case "lost":
        return <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">Lost</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
              <Magnet className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Leads</h1>
          </div>
          <p className="text-xs text-slate-400">
            Automatically capture prospects, manage outreach, and convert them to official orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLeads}
            disabled={loading}
            className="px-4 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="p-5 rounded-md bg-[#0e121e] border border-white/10 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
            <Magnet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_leads}</div>
          <p className="text-[11px] text-slate-500">Total checkout drop-offs captured</p>
        </div>

        {/* Pipeline Value */}
        <div className="p-5 rounded-md bg-[#0e121e] border border-white/10 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pipeline Potential</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatPrice(stats.pipeline_value)}</div>
          <p className="text-[11px] text-slate-500">Unrecovered cart value</p>
        </div>

        {/* Action Required (New Leads) */}
        <div className="p-5 rounded-md bg-[#0e121e] border border-white/10 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Action Required</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.new_leads_count}</div>
          <p className="text-[11px] text-slate-500">Fresh leads awaiting contact</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-md bg-[#0e121e] border border-white/10 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">{stats.conversion_rate}%</div>
          <p className="text-[11px] text-slate-500">{stats.converted_count} converted to official orders</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 sm:p-5 rounded-md bg-[#0e121e] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Leads", count: stats.total_leads },
              { id: "new", label: "New", count: stats.new_leads_count },
              { id: "contacted", label: "Contacted", count: stats.contacted_count },
              { id: "in_progress", label: "In Progress", count: stats.in_progress_count },
              { id: "converted", label: "Converted", count: stats.converted_count },
              { id: "lost", label: "Lost", count: stats.lost_count },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(statusFilter === tab.id ? "all" : tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  statusFilter === tab.id ? "bg-black/20 text-slate-950 font-black" : "bg-white/10 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, notes..."
              className="w-full bg-white/5 border border-white/10 focus:border-[#A78BFA]/50 rounded-md pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
            />
          </form>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="rounded-md bg-[#0e121e] border border-white/10 shadow-2xl overflow-hidden">
        <div 
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`overflow-x-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} custom-horizontal-scrollbar pb-3`}
        >
          <table className="w-full text-left text-xs text-slate-300 min-w-[1100px]">
            <thead className="bg-white/[0.02] border-b border-white/10 uppercase font-bold text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 w-10 min-w-[40px] whitespace-nowrap">
                  <AdminCheckbox
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < leads.length}
                    onChange={handleSelectAll}
                    title="Select all leads"
                  />
                </th>
                <th className="py-3.5 px-4 min-w-[320px] whitespace-nowrap">Prospect Info</th>
                <th className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">Location</th>
                <th className="py-3.5 px-4 min-w-[170px] whitespace-nowrap">Lead Items / Cart</th>
                <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">Captured At</th>
                <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading lead records...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Magnet className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#A78BFA]" />
                    <p className="font-bold text-slate-400">No leads found</p>
                    <p className="text-[11px] text-slate-600 mt-1">Leads will automatically populate as visitors start checkout.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const itemsCount = lead.cart_items?.length || 0;

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? "bg-[#211B32]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 w-10 min-w-[40px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(lead.id)}
                          title={`Select lead #${lead.id}`}
                        />
                      </td>

                      {/* Prospect Info */}
                      <td className="py-4 px-4 min-w-[320px]">
                        <div className="space-y-1.5">
                          <div className="font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                            <span>{lead.name}</span>
                            {lead.converted_order_id && (
                              <Link
                                href={`/admin/orders/${lead.converted_order_id}`}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase"
                                title="View Converted Order"
                              >
                                Order #{lead.converted_order_id}
                              </Link>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] whitespace-nowrap">
                            {/* Phone & Direct Contact */}
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </a>

                            {/* WhatsApp Fast Link */}
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>

                            {lead.email && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {lead.email}
                              </span>
                            )}
                          </div>

                          {/* Clean Note Preview Chip (1-Line Truncated with Zero Peek & Click-to-Open Popup) */}
                          {lead.notes && (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingNoteLead(lead);
                                setLeadNotes(lead.notes || "");
                              }}
                              className="text-[10px] text-slate-300 bg-white/[0.04] hover:bg-white/10 hover:border-[#A78BFA]/40 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5 max-w-[280px] transition-all cursor-pointer group text-left"
                              title="Click to view & edit full note"
                            >
                              <span className="shrink-0 text-[#A78BFA] text-xs">💬</span>
                              <span className="truncate whitespace-nowrap overflow-hidden block flex-1 text-slate-300 group-hover:text-[#B9A3FF]">
                                {lead.notes}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap min-w-[130px]">
                        {lead.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{lead.city}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Abandoned Cart */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[170px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {formatPrice(lead.total_amount)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300">
                              {itemsCount} {itemsCount === 1 ? "item" : "items"}
                            </span>
                          </div>

                          {/* Thumbnails preview */}
                          {lead.cart_items && lead.cart_items.length > 0 && (
                            <div className="flex items-center gap-1">
                              {lead.cart_items.slice(0, 3).map((item, idx) => (
                                <img
                                  key={idx}
                                  src={item.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=80&q=80"}
                                  alt={item.title || "Product"}
                                  className="w-6 h-6 rounded-md object-cover border border-white/10"
                                  title={`${item.title} (x${item.quantity})`}
                                />
                              ))}
                              {lead.cart_items.length > 3 && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  +{lead.cart_items.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[160px]">
                        {canManage ? (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenStatusDropdownId(openStatusDropdownId === lead.id ? null : lead.id)}
                              className="flex items-center justify-between gap-2.5 bg-[#090b12] hover:bg-white/10 border border-white/10 hover:border-white/25 text-slate-200 rounded-md pl-3 pr-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                            >
                              <span className="flex items-center gap-1.5">
                                {lead.status === "new" && "🔴 New Lead"}
                                {lead.status === "contacted" && "🟡 Contacted"}
                                {lead.status === "in_progress" && "🔵 In Progress"}
                                {lead.status === "converted" && "🟢 Converted"}
                                {lead.status === "lost" && "⚫ Lost"}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openStatusDropdownId === lead.id ? "rotate-180 text-[#A78BFA]" : ""}`} />
                            </button>

                            {/* Luxury Rounded Dropdown Card */}
                            {openStatusDropdownId === lead.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setOpenStatusDropdownId(null)} 
                                />
                                <div className="absolute left-0 top-full mt-1.5 w-44 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                                  {[
                                    { id: "new", label: "New Lead", dot: "🔴" },
                                    { id: "contacted", label: "Contacted", dot: "🟡" },
                                    { id: "in_progress", label: "In Progress", dot: "🔵" },
                                    { id: "converted", label: "Converted", dot: "🟢" },
                                    { id: "lost", label: "Lost", dot: "⚫" },
                                  ].map(st => (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => {
                                        handleStatusChange(lead.id, st.id as any);
                                        setOpenStatusDropdownId(null);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                        lead.status === st.id 
                                          ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30" 
                                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{st.dot}</span>
                                        <span>{st.label}</span>
                                      </div>
                                      {lead.status === st.id && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          getStatusBadge(lead.status)
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-300 text-xs whitespace-nowrap min-w-[140px] font-mono">
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Convert to Order Button */}
                          {canConvert && lead.status !== "converted" && (
                            <button
                              onClick={() => {
                                setConvertingLead(lead);
                                setConvertNotes(lead.notes || "");
                              }}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Convert this lead into a confirmed Order"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Convert</span>
                            </button>
                          )}

                          {/* Inspect Details */}
                          <button
                            onClick={() => {
                              setInspectingLead(lead);
                              setLeadNotes(lead.notes || "");
                            }}
                            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="View Cart & Notes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      </div>

      {/* Floating Multi-Row Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={leads.length}
        itemName="lead"
        isDeleting={bulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />

      {/* Modal 3: Dedicated Note View & Edit Popup */}
      {inspectingNoteLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg bg-[#0e121e] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Prospect Outreach Note</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {inspectingNoteLead.name} • {inspectingNoteLead.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingNoteLead(null)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note Editor */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Conversation Notes & Audit Log
              </label>
              <textarea
                rows={6}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Type customer notes, phone call outcomes, agreed custom pricing, or special requests..."
                className="w-full bg-[#090b12] border border-white/10 focus:border-[#A78BFA]/50 rounded-md p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${inspectingNoteLead.phone}`}
                  className="px-3 py-1.5 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/${inspectingNoteLead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingNoteLead(null)}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Close
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleSaveNoteForLead(inspectingNoteLead.id, leadNotes)}
                    disabled={updatingNotes}
                    className="px-5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-xs font-black text-[#090B10] shadow-lg shadow-[#A78BFA]/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {updatingNotes ? "Saving..." : "Save Note"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Lead Details & Cart Inspection */}
      {inspectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-lg bg-[#0e121e] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black text-white">{inspectingLead.name}</span>
                  {getStatusBadge(inspectingLead.status)}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#A78BFA] font-mono">
                    <Phone className="w-3 h-3" /> {inspectingLead.phone}
                  </span>
                  {inspectingLead.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {inspectingLead.email}
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setInspectingLead(null)}
                className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abandoned Cart Items */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                Lead Items & Cart ({inspectingLead.cart_items?.length || 0} items)
              </span>

              <div className="divide-y divide-white/5 border border-white/10 rounded-md bg-white/[0.02] p-4 max-h-60 overflow-y-auto space-y-2">
                {(!inspectingLead.cart_items || inspectingLead.cart_items.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No individual items recorded for this checkout session.</p>
                ) : (
                  inspectingLead.cart_items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 pt-2 first:pt-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=80&q=80"}
                          alt={item.title}
                          className="w-10 h-10 rounded-md object-cover border border-white/10"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{item.title}</div>
                          {item.variant_name && (
                            <div className="text-[10px] text-slate-400">Variant: {item.variant_name}</div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Qty: {item.quantity} × {formatPrice(item.price || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="font-bold text-white text-xs">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center px-4 py-2 rounded-md bg-white/5 text-xs font-bold text-white">
                <span>Calculated Pipeline Total</span>
                <span className="text-emerald-400 text-sm">{formatPrice(inspectingLead.total_amount)}</span>
              </div>
            </div>

            {/* Address Details */}
            {inspectingLead.address && (
              <div className="p-4 rounded-md bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shipping Destination</span>
                <p className="text-xs text-slate-300">{inspectingLead.address}</p>
                {(inspectingLead.city || inspectingLead.postal_code) && (
                  <p className="text-xs text-slate-400">
                    {[inspectingLead.city, inspectingLead.postal_code].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Internal Outreach Notes Editor */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                Internal Outreach Log & Notes
              </span>
              <textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Log outreach calls, customer feedback, discount offers, or special requirements..."
                rows={3}
                className="w-full bg-[#090b12] border border-white/10 focus:border-[#A78BFA]/50 rounded-md p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={updatingNotes || !canManage}
                  className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  {updatingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${inspectingLead.phone}`}
                  className="px-3.5 py-2 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/${inspectingLead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>

              {canConvert && inspectingLead.status !== "converted" && (
                <button
                  type="button"
                  onClick={() => {
                    setConvertingLead(inspectingLead);
                    setConvertNotes(inspectingLead.notes || "");
                    setInspectingLead(null);
                  }}
                  className="px-5 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Convert to Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: 1-Click Convert Lead to Official Order */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg bg-[#0e121e] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">Convert Lead to Order</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Generate an official customer invoice & inventory deduction for <span className="text-white font-bold">{convertingLead.name}</span>.
                </p>
              </div>

              <button
                onClick={() => setConvertingLead(null)}
                className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-md bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Customer Phone:</span>
                  <span className="text-white font-mono">{convertingLead.phone}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Items:</span>
                  <span className="text-white">{convertingLead.cart_items?.length || 0} product(s)</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span className="text-slate-300">Total Amount:</span>
                  <span className="text-emerald-400 text-sm">{formatPrice(convertingLead.total_amount)}</span>
                </div>
              </div>

              {/* Form Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={convertPaymentMethod}
                    onChange={(e) => setConvertPaymentMethod(e.target.value)}
                    className="w-full bg-[#090b12] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="credit_card">Credit Card (Paid/Auth)</option>
                    <option value="bank_transfer">Direct Bank Wire</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Payment Status</label>
                  <select
                    value={convertPaymentStatus}
                    onChange={(e) => setConvertPaymentStatus(e.target.value)}
                    className="w-full bg-[#090b12] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Initial Order Status</label>
                  <select
                    value={convertOrderStatus}
                    onChange={(e) => setConvertOrderStatus(e.target.value)}
                    className="w-full bg-[#090b12] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="processing">Processing (Ready to pack)</option>
                    <option value="pending">Pending Review</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Order Notes</label>
                  <input
                    type="text"
                    value={convertNotes}
                    onChange={(e) => setConvertNotes(e.target.value)}
                    placeholder="Converted from phone outreach lead..."
                    className="w-full bg-[#090b12] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConvertingLead(null)}
                className="px-4 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConversion}
                disabled={converting}
                className="px-6 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                {converting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Generate Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
