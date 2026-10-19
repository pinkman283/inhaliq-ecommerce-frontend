"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  Plus,
  Save,
  Lock,
  ShieldCheck
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { Lead, LeadStats } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { toast } from "sonner";

export default function AdminLeadsPage() {
  const router = useRouter();
  const { adminUser } = useAdminAuthStore();

  // Role & Permissions
  const isSuperAdmin = adminUser?.role === "super_admin";
  const isPrivileged = isSuperAdmin || adminUser?.role === "admin";
  const canView = isPrivileged || adminUser?.permissions?.includes("leads.view");
  const canManage = isPrivileged || adminUser?.permissions?.includes("leads.manage");
  const canConvert = isPrivileged || adminUser?.permissions?.includes("leads.convert") || adminUser?.permissions?.includes("leads.manage");
  const canDelete = isPrivileged || adminUser?.permissions?.includes("leads.delete") || adminUser?.permissions?.includes("leads.manage");

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
  const [cancellingLead, setCancellingLead] = useState<Lead | null>(null);
  const [cancelReason, setCancelReason] = useState("Customer changed mind / not interested");
  const [cancelCustomNote, setCancelCustomNote] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);
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

  // 1-Click WhatsApp Cart Recovery State
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [whatsAppDiscountCode, setWhatsAppDiscountCode] = useState("");
  const [whatsAppCustomMessage, setWhatsAppCustomMessage] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const handleOpenWhatsAppModal = (lead: Lead) => {
    setWhatsAppLead(lead);
    setWhatsAppDiscountCode("");
    const itemsText = (lead.cart_items || [])
      .map((i) => `${i.title || "Product"} (x${i.quantity || 1})`)
      .join(", ");
    const storeOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const initialMsg = `Hi ${lead.name || "there"}!\n\nWe noticed you left some great items in your shopping cart at INHALIQ:\n📦 ${itemsText || "Selected cart items"}\nTotal: ৳${Number(lead.total_amount || 0).toLocaleString()}\n\nItems in your cart are in high demand and might sell out soon. Complete your order here:\n${storeOrigin}/cart\n\nNeed help? Simply reply to this message!`;
    setWhatsAppCustomMessage(initialMsg);
  };

  const handleSendWhatsAppRecovery = async () => {
    if (!whatsAppLead) return;
    setSendingWhatsApp(true);
    try {
      const res = await adminApi.sendLeadWhatsAppRecovery(whatsAppLead.id, {
        discount_code: whatsAppDiscountCode.trim() || undefined,
        custom_message: whatsAppCustomMessage.trim() || undefined,
      });
      if (res.success) {
        toast.success("WhatsApp message sent", { id: "lead-wa" });
        setWhatsAppLead(null);
        loadLeads();
      } else {
        toast.error(res.message || "Failed to send WhatsApp message", { id: "lead-wa" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to send WhatsApp message", { id: "lead-wa" });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    if (!whatsAppLead?.phone) return;
    const clean = whatsAppLead.phone.replace(/[^0-9]/g, "");
    const intlPhone = clean.startsWith("01") ? "88" + clean : clean;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsAppCustomMessage)}`;
    window.open(url, "_blank");
  };

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

    const currentLead = leads.find((l) => l.id === id);
    if (currentLead?.status === "converted" && newStatus !== "converted" && !isSuperAdmin) {
      toast.error("Converted leads are locked. Only Super Admin can change status.", { id: "lead-lock" });
      return;
    }

    if (currentLead?.status === "converted" && newStatus !== "converted" && isSuperAdmin) {
      const confirmOverride = confirm(
        `[Super Admin Override]\nAre you sure you want to change Lead #${id} from CONVERTED to ${newStatus.toUpperCase()}?\n\nThis will un-link its conversion status.`
      );
      if (!confirmOverride) return;
    }

    try {
      const res = await adminApi.updateLead(id, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus, converted_order_id: newStatus === "converted" ? l.converted_order_id : null } : l)));
      if (inspectingLead && inspectingLead.id === id) {
        setInspectingLead({ ...inspectingLead, status: newStatus, converted_order_id: newStatus === "converted" ? inspectingLead.converted_order_id : null });
      }
      const label = newStatus === "in_progress" ? "In Progress" : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast.success(`Status updated: ${label}`, { id: "lead-status" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status", { id: "lead-status" });
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
      toast.success("Note saved", { id: "lead-note" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save notes", { id: "lead-note" });
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
      toast.success("Note saved", { id: "lead-note" });
      setInspectingNoteLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save note", { id: "lead-note" });
    } finally {
      setUpdatingNotes(false);
    }
  };

  // Convert via POS Terminal with Preloaded Cart
  const handleConvertToPos = (lead: Lead) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "pos_lead_conversion",
        JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          city: lead.city,
          postal_code: lead.postal_code,
          total_amount: lead.total_amount,
          cart_items: lead.cart_items || [],
          notes: lead.notes || "",
        })
      );
    }
    router.push(`/admin/pos?lead_id=${lead.id}`);
  };

  // Confirm Cancellation with Structured Reason & Notes
  const handleConfirmCancellation = async () => {
    if (!cancellingLead || !canManage) return;
    setSavingCancel(true);
    try {
      const reasonTag = `[Cancelled/Lost Reason: ${cancelReason}]`;
      const combinedNote = cancelCustomNote.trim()
        ? `${reasonTag} ${cancelCustomNote.trim()}`
        : reasonTag;
      const existingNotes = cancellingLead.notes ? `${cancellingLead.notes}\n---\n` : "";
      const finalNotes = `${existingNotes}${combinedNote}`;

      await adminApi.updateLead(cancellingLead.id, {
        status: "lost",
        notes: finalNotes,
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === cancellingLead.id ? { ...l, status: "lost", notes: finalNotes } : l
        )
      );

      if (inspectingLead?.id === cancellingLead.id) {
        setInspectingLead({ ...inspectingLead, status: "lost", notes: finalNotes });
      }

      toast.success("Lead marked as Lost", { id: "lead-lost" });
      setCancellingLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update lead status", { id: "lead-lost" });
    } finally {
      setSavingCancel(false);
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
      toast.success("Lead deleted", { id: "lead-delete" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete lead", { id: "lead-delete" });
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
      toast.success(`Deleted ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""}`, { id: "lead-bulk-delete" });
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected leads", { id: "lead-bulk-delete" });
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

      toast.success(`Order #${res.order.order_number} created`, { id: "lead-convert" });
      setConvertingLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert lead into order", { id: "lead-convert" });
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
        return (
          <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
            <span>Converted</span>
            <Lock className="w-2.5 h-2.5 opacity-80" />
          </span>
        );
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

                            {/* WhatsApp Fast Link with Pre-filled Cart Context */}
                            {(() => {
                              const clean = lead.phone.replace(/[^0-9]/g, "");
                              const intlPhone = clean.startsWith("01") ? "88" + clean : clean;
                              const storeOrigin = typeof window !== "undefined" ? window.location.origin : "";
                              const fastText = encodeURIComponent(
                                `Hi ${lead.name || "there"}! We noticed you left some items in your cart. Complete your order here: ${storeOrigin}/cart`
                              );
                              return (
                                <a
                                  href={`https://wa.me/${intlPhone}?text=${fastText}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  WhatsApp
                                </a>
                              );
                            })()}

                            {lead.email && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {lead.email}
                              </span>
                            )}
                          </div>

                          {/* Note Preview / Cancellation Reason Chip */}
                          {lead.status === "lost" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingNoteLead(lead);
                                setLeadNotes(lead.notes || "");
                              }}
                              className="text-[10px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 max-w-[280px] transition-all cursor-pointer group text-left shadow-xs"
                              title="Click to view & edit cancellation reason"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate whitespace-nowrap overflow-hidden block flex-1 font-medium">
                                {lead.notes || "Cancelled / Lost (Click to add reason)"}
                              </span>
                            </button>
                          ) : lead.notes ? (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingNoteLead(lead);
                                setLeadNotes(lead.notes || "");
                              }}
                              className="text-[10px] text-slate-300 bg-white/[0.04] hover:bg-white/10 hover:border-[#A78BFA]/40 px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 max-w-[280px] transition-all cursor-pointer group text-left shadow-xs"
                              title="Click to view & edit full note"
                            >
                              <span className="shrink-0 text-[#A78BFA] text-xs">💬</span>
                              <span className="truncate whitespace-nowrap overflow-hidden block flex-1 text-slate-300 group-hover:text-[#B9A3FF]">
                                {lead.notes}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingNoteLead(lead);
                                setLeadNotes("");
                              }}
                              className="text-[10px] text-slate-500 hover:text-[#A78BFA] bg-transparent hover:bg-white/[0.04] px-2 py-0.5 rounded border border-dashed border-white/10 hover:border-[#A78BFA]/30 flex items-center gap-1 transition-all cursor-pointer"
                              title="Add a note to this lead"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Note</span>
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

                      {/* Status Dropdown / Locked Status */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[160px]">
                        {lead.status === "converted" && !isSuperAdmin ? (
                          // Locked Converted Badge for non-superadmins
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs cursor-default" title="Locked: Converted to official sale. Only Super Admin can adjust.">
                            <span>🟢 Converted</span>
                            <Lock className="w-3 h-3 text-emerald-400/80" />
                          </div>
                        ) : canManage ? (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenStatusDropdownId(openStatusDropdownId === lead.id ? null : lead.id)}
                              className={`flex items-center justify-between gap-2 bg-[#090b12] hover:bg-white/10 border text-slate-200 rounded-md pl-3 pr-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md ${
                                lead.status === "converted" && isSuperAdmin
                                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                                  : "border-white/10 hover:border-white/25"
                              }`}
                              title={lead.status === "converted" && isSuperAdmin ? "Super Admin Override: Click to adjust status" : undefined}
                            >
                              <span className="flex items-center gap-1.5">
                                {lead.status === "new" && "🔴 New Lead"}
                                {lead.status === "contacted" && "🟡 Contacted"}
                                {lead.status === "in_progress" && "🔵 In Progress"}
                                {lead.status === "converted" && (
                                  <>
                                    <span>🟢 Converted</span>
                                    {isSuperAdmin && (
                                      <ShieldCheck className="w-3 h-3 text-emerald-400 ml-0.5" />
                                    )}
                                  </>
                                )}
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
                                <div className="absolute left-0 top-full mt-1.5 w-48 rounded-md bg-[#0e121e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                                  {lead.status === "converted" && isSuperAdmin && (
                                    <div className="px-2.5 py-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded border border-amber-500/20 mb-1 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 shrink-0" />
                                      <span>Super Admin Override</span>
                                    </div>
                                  )}
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
                                        if (st.id === "lost") {
                                          setCancellingLead(lead);
                                          setCancelReason("Customer changed mind / not interested");
                                          setCancelCustomNote("");
                                        } else {
                                          handleStatusChange(lead.id, st.id as any);
                                        }
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

                        {/* Linked Order shortcut */}
                        {lead.status === "converted" && (lead.converted_order_id || lead.converted_order) && (
                          <div className="mt-1">
                            <Link
                              href={`/admin/orders?search=${lead.converted_order?.order_number || lead.converted_order_id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                              title="View generated order"
                            >
                              <span>Order #{lead.converted_order?.order_number || lead.converted_order_id}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Captured At Timestamp (Accurate Date + Time) */}
                      <td className="py-4 px-4 text-slate-300 text-xs whitespace-nowrap min-w-[150px] font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white text-xs font-semibold">
                            {new Date(lead.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#A78BFA] shrink-0" />
                            {new Date(lead.created_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions: Strictly Icon Buttons with Floating Tooltips */}
                      <td className="py-4 px-4 text-right whitespace-nowrap min-w-[180px]">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. WhatsApp Recovery */}
                          {canManage && lead.status !== "converted" && (
                            <div className="relative group/action">
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(lead)}
                                className="w-8 h-8 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="1-Click WhatsApp Cart Recovery"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                                1-Click WhatsApp Recovery
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161a26]" />
                              </div>
                            </div>
                          )}

                          {/* 2. Convert to Order via POS OR View Converted Order */}
                          {lead.status === "converted" && (lead.converted_order_id || lead.converted_order) ? (
                            <div className="relative group/action">
                              <Link
                                href={`/admin/orders?search=${lead.converted_order?.order_number || lead.converted_order_id}`}
                                className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="View Converted Order in Orders"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </Link>
                              <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                                View Converted Order
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161a26]" />
                              </div>
                            </div>
                          ) : canConvert && lead.status !== "converted" ? (
                            <div className="relative group/action">
                              <button
                                type="button"
                                onClick={() => handleConvertToPos(lead)}
                                className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Convert to Order via POS Terminal"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                                Convert via POS Terminal
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161a26]" />
                              </div>
                            </div>
                          ) : null}

                          {/* 3. Note / Cancellation Reason View & Edit */}
                          <div className="relative group/action">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingNoteLead(lead);
                                setLeadNotes(lead.notes || "");
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                                lead.notes
                                  ? "bg-[#A78BFA]/15 hover:bg-[#A78BFA]/25 border-[#A78BFA]/30 text-[#A78BFA]"
                                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white"
                              }`}
                              title={lead.notes ? "View & Edit Lead Notes" : "Add Note"}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                              {lead.notes ? "View & Edit Notes" : "Add Note"}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161a26]" />
                            </div>
                          </div>

                          {/* 4. Inspect Details */}
                          <div className="relative group/action">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingLead(lead);
                                setLeadNotes(lead.notes || "");
                              }}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                              title="View Prospect & Cart Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                              View Cart & Details
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161a26]" />
                            </div>
                          </div>

                          {/* 5. Delete Lead */}
                          {canDelete && (
                            <div className="relative group/action">
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full mb-1.5 right-0 opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 z-50 bg-[#161a26] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap">
                                Delete Lead
                                <span className="absolute top-full right-3 border-4 border-transparent border-t-[#161a26]" />
                              </div>
                            </div>
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

            {/* Converted Milestone Banner */}
            {inspectingLead.status === "converted" && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Converted to Official Sale</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked Milestone
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This lead was completed and converted into an official order.
                    </p>
                  </div>
                </div>
                {(inspectingLead.converted_order_id || inspectingLead.converted_order) && (
                  <Link
                    href={`/admin/orders?search=${inspectingLead.converted_order?.order_number || inspectingLead.converted_order_id}`}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0 self-start sm:self-auto"
                  >
                    <span>View Order #{inspectingLead.converted_order?.order_number || inspectingLead.converted_order_id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

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
                    handleConvertToPos(inspectingLead);
                    setInspectingLead(null);
                  }}
                  className="px-5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Convert to Sales (POS)
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

      {/* Modal 3: 1-Click WhatsApp Cart Recovery */}
      {whatsAppLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg bg-[#0e121e] border border-[#25D366]/30 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">1-Click WhatsApp Recovery</h3>
                  <p className="text-xs text-slate-400">
                    Recover cart for <span className="text-white font-semibold">{whatsAppLead.name}</span> ({whatsAppLead.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppLead(null)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/10 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block">Abandoned Cart Value</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {formatPrice(whatsAppLead.total_amount)} ({whatsAppLead.cart_items?.length || 0} items)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Lead Status</span>
                  <span className="font-semibold text-white capitalize">{whatsAppLead.status}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Optional Discount Promo Voucher
                </label>
                <input
                  type="text"
                  value={whatsAppDiscountCode}
                  onChange={(e) => setWhatsAppDiscountCode(e.target.value.toUpperCase())}
                  placeholder="e.g. COMEBACK10 or SAVE5"
                  className="w-full bg-[#090b12] border border-white/10 focus:border-[#25D366]/50 rounded-md px-3.5 py-2 text-xs text-white uppercase font-mono placeholder:text-slate-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  If entered, discount voucher code will be highlighted in the message template.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  WhatsApp Message Content
                </label>
                <textarea
                  rows={6}
                  value={whatsAppCustomMessage}
                  onChange={(e) => setWhatsAppCustomMessage(e.target.value)}
                  className="w-full bg-[#090b12] border border-white/10 focus:border-[#25D366]/50 rounded-md p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none leading-relaxed font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Open WhatsApp Web or desktop application"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Open in WhatsApp Web</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsAppLead(null)}
                  className="px-3 py-2 rounded-md bg-transparent hover:bg-white/5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppRecovery}
                  disabled={sendingWhatsApp}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-[#090B10] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-[#25D366]/20"
                >
                  {sendingWhatsApp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Send via Cloud API</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Structured Cancellation / Lost Reason Modal */}
      {cancellingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-[#0e121e] border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Cancellation Reason</h3>
                  <p className="text-xs text-slate-400">
                    Lead #{cancellingLead.id} &bull; <span className="text-white font-medium">{cancellingLead.name}</span> ({cancellingLead.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellingLead(null)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Preset Reasons */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Primary Reason for Cancellation
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Customer changed mind / not interested",
                    "Price or shipping cost too high",
                    "Bought from competitor",
                    "Unreachable / invalid phone number",
                    "Duplicate or test checkout",
                    "Out of stock / requested variant unavailable",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCancelReason(preset)}
                      className={`text-left p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        cancelReason === preset
                          ? "bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm"
                          : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <span>{preset}</span>
                      {cancelReason === preset && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Specific Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Additional Context / Tele-sales Notes <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelCustomNote}
                  onChange={(e) => setCancelCustomNote(e.target.value)}
                  placeholder="e.g. Customer stated they already purchased elsewhere. Reason shared during call."
                  className="w-full bg-[#090b12] border border-white/10 focus:border-amber-500/50 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition leading-relaxed"
                />
              </div>

              {/* Cart Summary Snippet */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex justify-between items-center text-xs">
                <span className="text-slate-400">Cart Total Being Cancelled</span>
                <span className="text-amber-400 font-bold font-mono">
                  {formatPrice(cancellingLead.total_amount)} ({cancellingLead.cart_items?.length || 0} items)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCancellingLead(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={savingCancel}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
              >
                {savingCancel ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Confirm & Mark as Lost</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Dedicated Lead Note Quick Editor */}
      {inspectingNoteLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-[#0e121e] border border-[#A78BFA]/30 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Lead Internal Notes</h3>
                  <p className="text-xs text-slate-400">
                    Lead #{inspectingNoteLead.id} &bull; <span className="text-white font-medium">{inspectingNoteLead.name}</span> ({inspectingNoteLead.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingNoteLead(null)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Internal Outreach Log, Call Feedback & Follow-up Notes
              </label>
              <textarea
                rows={6}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Log outreach attempts, special requests, reason for abandonment, discounts discussed..."
                className="w-full bg-[#090b12] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition leading-relaxed font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Visible to all admins and sales agents working on lead recovery.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setInspectingNoteLead(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveNoteForLead(inspectingNoteLead.id, leadNotes)}
                disabled={updatingNotes}
                className="px-5 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#906ef5] text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-[#A78BFA]/20"
              >
                {updatingNotes ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note</span>
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
