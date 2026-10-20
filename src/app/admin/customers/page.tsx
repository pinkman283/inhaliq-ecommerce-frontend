"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  ShoppingBag, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Lock, 
  Unlock,
  MapPin, 
  AlertTriangle,
  History,
  Clock,
  PackageCheck,
  PackageX,
  RotateCcw,
  Sparkles,
  Activity,
  Network,
  Ban,
  CheckCircle2,
  FileText,
  Save,
  RefreshCw,
  Info,
  Crown,
  MessageCircle,
  TrendingUp,
  Gift
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { User, Order, CustomerIpHistoryItem, CustomerActivityTimelineItem } from "@/types";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { SuspensionModal, SuspensionPayload } from "@/components/admin/SuspensionModal";
import { ImageUploadAvatar } from "@/components/ui/ImageUploadAvatar";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import { toast } from "sonner";
import { 
  AdminPageHeader, 
  AdminStatusBadge, 
  AdminEmptyState 
} from "@/components/admin/ui";
import { TableSkeletonRows } from "@/components/admin/ui/TableSkeletonRows";

function AdminCustomersContent() {
  const { adminUser } = useAdminAuthStore();
  const canDeleteCustomer = 
    adminUser?.role === "super_admin" || 
    adminUser?.role === "admin" || 
    adminUser?.permissions?.includes("customers.delete");

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || searchParams.get("email") || "";
  const initialViewId = searchParams.get("view");

  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [rfmFilter, setRfmFilter] = useState("all");

  // Customer Intelligence Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"overview" | "rfm" | "ips" | "timeline" | "orders">("overview");

  // Notes state in drawer
  const [customerNotes, setCustomerNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Quick Block IP Modal
  const [quickBlockIp, setQuickBlockIp] = useState<string | null>(null);
  const [quickBlockReason, setQuickBlockReason] = useState("");
  const [submittingQuickBlock, setSubmittingQuickBlock] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Suspension Modal State
  const [suspendingCustomer, setSuspendingCustomer] = useState<User | null>(null);
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Create Customer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [creating, setCreating] = useState(false);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("active");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Customer State
  const [deletingCustomer, setDeletingCustomer] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCustomers({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        customer_type: typeFilter !== "all" ? typeFilter : undefined,
        risk_level: riskFilter !== "all" ? riskFilter : undefined,
        rfm_segment: rfmFilter !== "all" ? rfmFilter : undefined,
        per_page: 50,
      });
      setCustomers(res.data || []);
    } catch (err) {
      toast.error("Failed to load customer registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!canDeleteCustomer) {
      toast.error("You lack permission to delete customer records.");
      return;
    }
    if (selectedIds.length === 0) return;

    try {
      setIsBulkDeleting(true);
      const res = await adminApi.bulkDeleteCustomers(selectedIds);
      toast.success(res.message || `Successfully deleted ${selectedIds.length} customer(s).`);
      setSelectedIds([]);
      if (selectedCustomer && selectedIds.includes(selectedCustomer.id)) {
        setSelectedCustomer(null);
      }
      loadCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected customers.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteCustomer = async (customer: User) => {
    if (!canDeleteCustomer) {
      toast.error("You lack permission to delete customer records.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete customer account "${customer.name}" (${customer.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await adminApi.deleteCustomer(customer.id);
      toast.success(res.message || `Customer "${customer.name}" deleted.`);
      setSelectedIds((prev) => prev.filter((id) => id !== customer.id));
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
      }
      loadCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [statusFilter, typeFilter, riskFilter, rfmFilter]);

  // Auto-open profile drawer if redirected from Orders page
  useEffect(() => {
    if (initialViewId && !selectedCustomer) {
      adminApi.getCustomer(Number(initialViewId))
        .then((cust) => {
          if (cust) openCustomerIntelligence(cust);
        })
        .catch(() => {});
    } else if (initialSearch && customers.length > 0 && !selectedCustomer) {
      const match = customers.find(c => 
        (c.customer_id && c.customer_id.toLowerCase() === initialSearch.toLowerCase()) ||
        c.email.toLowerCase() === initialSearch.toLowerCase() ||
        c.name.toLowerCase().includes(initialSearch.toLowerCase())
      );
      if (match) {
        openCustomerIntelligence(match);
      }
    }
  }, [customers, initialViewId, initialSearch]);

  const openCustomerIntelligence = async (customer: User) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.internal_notes || "");
    setActiveDrawerTab("overview");
    setLoadingCustomerDetails(true);

    try {
      const fullCustomer = await adminApi.getCustomer(customer.id);
      setSelectedCustomer(fullCustomer);
      setCustomerNotes(fullCustomer.internal_notes || "");
    } catch (err) {
      toast.error("Failed to load comprehensive customer risk intelligence.");
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    try {
      setSavingNotes(true);
      await adminApi.updateCustomerNotes(selectedCustomer.id, customerNotes);
      toast.success("Internal security notes updated.");
      setSelectedCustomer((prev) => prev ? { ...prev, internal_notes: customerNotes } : null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleBlockCustomer = async (customer: User) => {
    const reason = prompt(`Enter reason for blocking customer account ${customer.name}:`, "Repeated abusive cancellations / Fraud risk");
    if (!reason) return;

    try {
      const res = await adminApi.blockCustomer(customer.id, reason);
      toast.success(res.message);
      loadCustomers();
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to block customer.");
    }
  };

  const handleUnblockCustomer = async (customer: User) => {
    if (!confirm(`Are you sure you want to unblock customer ${customer.name}?`)) return;

    try {
      const res = await adminApi.unblockCustomer(customer.id);
      toast.success(res.message);
      loadCustomers();
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unblock customer.");
    }
  };

  const handleFlagReview = async (customer: User) => {
    try {
      const res = await adminApi.setCustomerReview(customer.id);
      toast.success(res.message);
      loadCustomers();
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to flag customer.");
    }
  };

  const handleExecuteQuickBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBlockIp || !quickBlockReason.trim()) return;

    try {
      setSubmittingQuickBlock(true);
      const res = await adminApi.blockIp({
        ip_address: quickBlockIp,
        reason: quickBlockReason.trim(),
        duration: "7_days",
      });
      toast.success(res.message);
      setQuickBlockIp(null);
      setQuickBlockReason("");
      if (selectedCustomer) {
        openCustomerIntelligence(selectedCustomer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to block IP.");
    } finally {
      setSubmittingQuickBlock(false);
    }
  };

  const handleConfirmSuspension = async (payload: SuspensionPayload) => {
    if (!suspendingCustomer) return;
    try {
      setIsSubmittingSuspension(true);
      const res = await adminApi.suspendCustomer(suspendingCustomer.id, {
        duration_type: payload.duration_type,
        suspended_until: payload.suspended_until,
        reason: payload.reason,
      });
      toast.success(res.message);
      setSuspendingCustomer(null);
      loadCustomers();
      if (selectedCustomer?.id === suspendingCustomer.id) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to suspend customer.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const handleReactivateCustomer = async (customer: User) => {
    try {
      const res = await adminApi.reactivateCustomer(customer.id);
      toast.success(res.message);
      loadCustomers();
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reactivate customer.");
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await adminApi.createCustomer({
        name: fullName,
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        avatar: avatar || undefined,
        status,
        address_line1: addressLine.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || undefined,
      });

      toast.success("Customer created successfully.");
      setIsCreateModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create customer.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <AdminPageHeader
        title="Customer Intelligence & Risk Control"
        description="Holistic buyer profiling, automated cancellation risk scoring, and multi-IP telemetry."
        badge={`${customers.length} records`}
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </button>
        }
      />

      {/* RFM Segment Quick Filters Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Customers" },
          { id: "champions", label: "VIP Champions", icon: Crown, color: "text-purple-400" },
          { id: "loyal", label: "Loyal Buyers", icon: Users, color: "text-blue-400" },
          { id: "promising", label: "Promising", icon: TrendingUp, color: "text-cyan-400" },
          { id: "at_risk", label: "At-Risk (Churn)", icon: AlertTriangle, color: "text-amber-400" },
          { id: "new", label: "New Leads", icon: Clock, color: "text-emerald-400" },
          { id: "inactive", label: "Inactive", icon: Ban, color: "text-slate-400" },
        ].map((tab) => {
          const isActive = rfmFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setRfmFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? "bg-[#211B32] border-[#A78BFA] text-[#A78BFA] shadow-xs"
                  : "bg-[#0f121b] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color || ""}`} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0f121b] p-3.5 rounded-md border border-white/[0.08]">
        <div className="relative lg:col-span-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer ID, name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
            className="w-full bg-[#161a26] border border-white/[0.08] focus:border-[#A78BFA]/50 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition"
          />
        </div>

        <AdminDropdown
          value={statusFilter}
          onChange={(val: string) => setStatusFilter(val)}
          options={[
            { label: "All Account Statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
            { label: "Blocked", value: "blocked" },
            { label: "Under Review", value: "review" },
          ]}
        />

        <AdminDropdown
          value={typeFilter}
          onChange={(val: string) => setTypeFilter(val)}
          options={[
            { label: "All Customer Types", value: "all" },
            { label: "Registered Accounts", value: "registered" },
            { label: "Guest Purchasers", value: "guest" },
          ]}
        />

        <AdminDropdown
          value={riskFilter}
          onChange={(val: string) => setRiskFilter(val)}
          options={[
            { label: "All Risk Levels", value: "all" },
            { label: "Low Risk", value: "low" },
            { label: "Medium Risk", value: "medium" },
            { label: "High Risk", value: "high" },
            { label: "Critical Abuse", value: "critical" },
          ]}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={customers.length}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={() => setSelectedIds(customers.map((c) => c.id))}
        onConfirmDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        itemName="customer"
      />

      {/* Main Customers Table */}
      <div className="p-4 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Records ({customers.length})</h2>
        </div>
        <ScrollableTableCard className="border-white/[0.06]">
          <table className="w-full min-w-[950px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 w-10 min-w-[40px] max-w-[40px] text-center">
                  <AdminCheckbox
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < customers.length}
                    onChange={handleToggleSelectAll}
                    title="Select all customers"
                  />
                </th>
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">RFM Segment</th>
                <th className="py-2.5 px-3.5">Risk Profile</th>
                <th className="py-2.5 px-3.5">Orders</th>
                <th className="py-2.5 px-3.5">Total Spent</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {loading ? (
                <TableSkeletonRows rows={8} colSpan={9} hasCheckbox={true} hasThumbnail={false} />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-0">
                    <AdminEmptyState
                      icon={Users}
                      title="No Customers Found"
                      description="Try adjusting your search criteria or filters."
                    />
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isGuest = c.customer_type === "guest";
                  const riskLevel = c.risk_level || "low";
                  const riskScore = c.risk_score ?? 0;

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors group ${
                        isSelected ? "bg-[#211B32]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="py-3 px-3 w-10 min-w-[40px] max-w-[40px] text-center" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(c.id)}
                          title={`Select customer ${c.name}`}
                        />
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                            alt={c.name}
                            className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openCustomerIntelligence(c)}
                                className="font-semibold text-white hover:text-[#A78BFA] transition-colors text-left block"
                              >
                                {c.name}
                              </button>
                              {c.customer_id && (
                                <span className="font-mono text-[10px] text-[#A78BFA] bg-[#211B32] px-1.5 py-0.5 rounded border border-[#A78BFA]/30 leading-none">
                                  {c.customer_id}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[11px]">{c.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 uppercase">
                          {isGuest ? "Guest" : "Registered"}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <AdminStatusBadge status={c.status || "active"} size="sm" />
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.rfm_segment === "champions" 
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : c.rfm_segment === "loyal"
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : c.rfm_segment === "promising"
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                              : c.rfm_segment === "at_risk"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : c.rfm_segment === "new"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                          }`}>
                            {c.rfm_segment === "champions" && <Crown className="w-2.5 h-2.5 text-purple-400" />}
                            {c.rfm_segment === "at_risk" && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                            {c.rfm_segment === "new" && <Clock className="w-2.5 h-2.5 text-emerald-400" />}
                            {c.rfm_label || "Standard"}
                          </span>
                          {c.rfm_recency_days !== undefined && c.rfm_recency_days !== null ? (
                            <span className="text-[10px] text-slate-400">
                              Active {c.rfm_recency_days === 0 ? "today" : `${c.rfm_recency_days}d ago`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">No purchase</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              riskLevel === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                              riskLevel === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                              riskLevel === "medium" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {riskLevel}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">({riskScore} pts)</span>
                          </div>
                          {(c.cod_orders_count ?? 0) > 0 ? (
                            <div className="text-[10px] font-mono flex items-center gap-1.5">
                              <span className="text-slate-500">COD:</span>
                              {(c.cod_returned_count ?? 0) > 0 ? (
                                <span className="text-red-400 font-semibold">{c.cod_returned_count} RTO ({c.cod_return_rate}%)</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold">{c.cod_orders_count} ord (0 RTO)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">No COD orders</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {c.orders_count ?? 0}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {formatPrice(c.total_spent || 0)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCustomerIntelligence(c)}
                            className="p-1.5 rounded-md bg-white/[0.03] hover:bg-purple-500/10 text-slate-400 hover:text-purple-400 border border-white/5 transition-all"
                            title="Open Customer Intelligence Hub"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {c.status === "active" ? (
                            <button
                              onClick={() => setSuspendingCustomer(c)}
                              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-[#211B32] text-slate-400 hover:text-[#A78BFA] border border-white/5 transition-all"
                              title="Suspend Customer"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateCustomer(c)}
                              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 transition-all"
                              title="Reactivate Customer"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}

                          {c.status !== "blocked" ? (
                            <button
                              onClick={() => handleBlockCustomer(c)}
                              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 transition-all"
                              title="Block Customer Account"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockCustomer(c)}
                              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 transition-all"
                              title="Unblock Customer Account"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteCustomer && (
                            <button
                              onClick={() => handleDeleteCustomer(c)}
                              className="p-1.5 rounded-md bg-white/[0.03] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 transition-all"
                              title="Delete Customer Account"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </ScrollableTableCard>
      </div>

      {/* Customer Intelligence Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustomer.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt={selectedCustomer.name}
                  className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base">{selectedCustomer.name}</h3>
                    {selectedCustomer.customer_id && (
                      <span className="font-mono text-xs text-[#A78BFA] bg-[#211B32] px-2 py-0.5 rounded border border-[#A78BFA]/30">
                        {selectedCustomer.customer_id}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      selectedCustomer.customer_type === "guest" ? "bg-white/5 text-slate-300 border border-white/10" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    }`}>
                      {selectedCustomer.customer_type === "guest" ? "GUEST" : "REGISTERED"}
                    </span>
                    <AdminStatusBadge status={selectedCustomer.status || "active"} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCustomer.email} • {selectedCustomer.phone || "No phone recorded"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-white/[0.08] bg-white/[0.01] shrink-0 text-xs font-medium">
              {[
                { id: "overview", label: "Risk & KPIs", icon: Activity },
                { id: "rfm", label: "Customer 360 (RFM)", icon: Sparkles },
                { id: "ips", label: `IP History (${selectedCustomer.ip_history?.length || 0})`, icon: Network },
                { id: "timeline", label: `Timeline (${selectedCustomer.activity_timeline?.length || 0})`, icon: History },
                { id: "orders", label: `Orders (${selectedCustomer.orders?.length || selectedCustomer.orders_count || 0})`, icon: ShoppingBag },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveDrawerTab(t.id as any)}
                  className={`flex items-center gap-2 py-2 px-3.5 border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === t.id
                      ? "border-[#A78BFA] text-[#A78BFA] bg-[#211B32] rounded-t-md font-semibold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {loadingCustomerDetails ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                  <span>Calculating live abuse signals and telemetry...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & RISK ANALYSIS */}
                  {activeDrawerTab === "overview" && (
                    <div className="space-y-5">
                      {/* Metric KPI Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Orders</span>
                          <p className="text-lg font-mono font-bold text-white">{selectedCustomer.risk_metrics?.total_orders ?? selectedCustomer.orders_count ?? 0}</p>
                          <span className="text-[10px] text-emerald-400">{selectedCustomer.risk_metrics?.completed_orders ?? 0} Completed</span>
                        </div>

                        <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cancellations</span>
                          <p className="text-lg font-mono font-bold text-red-400">{selectedCustomer.risk_metrics?.cancelled_orders ?? 0}</p>
                          <span className="text-[10px] text-slate-400">{selectedCustomer.risk_metrics?.cancellation_rate ?? 0}% Rate</span>
                        </div>

                        <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Spent</span>
                          <p className="text-lg font-mono font-bold text-emerald-400">{formatPrice(selectedCustomer.risk_metrics?.total_spent ?? selectedCustomer.total_spent ?? 0)}</p>
                          <span className="text-[10px] text-slate-400">AOV: {formatPrice(selectedCustomer.risk_metrics?.aov ?? 0)}</span>
                        </div>

                        <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recent Velocity</span>
                          <p className="text-lg font-mono font-bold text-amber-400">{selectedCustomer.risk_metrics?.cancellations_24h ?? 0}</p>
                          <span className="text-[10px] text-slate-400">Cancels in 24h</span>
                        </div>
                      </div>

                      {/* DEDICATED COD RETURN RISK SCORE (COURIER TELEMETRY) */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#121624] via-white/[0.02] to-transparent border border-white/10 space-y-3.5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
                              <RotateCcw className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xs tracking-tight">COD Return Risk Score</h4>
                              <p className="text-[10px] text-slate-400">Cash-on-Delivery fulfillment reliability & RTO prediction</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              selectedCustomer.cod_risk?.level === "high" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              selectedCustomer.cod_risk?.level === "moderate" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            }`}>
                              {selectedCustomer.cod_risk?.level === "high" ? "High Return Risk" :
                               selectedCustomer.cod_risk?.level === "moderate" ? "Moderate Risk" :
                               "Low COD Risk"}
                            </span>
                            <div className="flex items-baseline gap-1 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                              <span className="text-xs font-extrabold text-white">{selectedCustomer.cod_risk?.score ?? 15}</span>
                              <span className="text-[9px] text-slate-400">/ 100</span>
                            </div>
                          </div>
                        </div>

                        {/* Visual Risk Gauge Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>Return Probability Index</span>
                            <span className="font-mono font-medium text-slate-300">
                              Delivery Success: <strong className="text-emerald-400">{selectedCustomer.cod_risk?.delivery_rate ?? 100}%</strong>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                (selectedCustomer.cod_risk?.score ?? 15) > 60 ? "bg-gradient-to-r from-orange-500 to-red-500" :
                                (selectedCustomer.cod_risk?.score ?? 15) > 30 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                                "bg-gradient-to-r from-emerald-500 to-teal-400"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, selectedCustomer.cod_risk?.score ?? 15))}%` }}
                            />
                          </div>
                        </div>

                        {/* COD Telemetry Grid */}
                        <div className="grid grid-cols-4 gap-2 pt-0.5 text-center">
                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-slate-400 uppercase font-semibold block">COD Orders</span>
                            <span className="text-sm font-mono font-bold text-white">{selectedCustomer.cod_risk?.orders_count ?? selectedCustomer.cod_orders_count ?? 0}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-emerald-400 uppercase font-semibold block">Delivered</span>
                            <span className="text-sm font-mono font-bold text-emerald-400">{selectedCustomer.cod_risk?.delivered_count ?? 0}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-red-400 uppercase font-semibold block">Returned/RTO</span>
                            <span className="text-sm font-mono font-bold text-red-400">{selectedCustomer.cod_risk?.returned_count ?? selectedCustomer.cod_returned_count ?? 0}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-slate-400 uppercase font-semibold block">Return Rate</span>
                            <span className="text-sm font-mono font-bold text-white">{selectedCustomer.cod_risk?.return_rate ?? selectedCustomer.cod_return_rate ?? 0}%</span>
                          </div>
                        </div>

                        {/* Staff Action Guidance */}
                        <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                          selectedCustomer.cod_risk?.level === "high" ? "bg-red-500/10 border-red-500/20 text-red-200" :
                          selectedCustomer.cod_risk?.level === "moderate" ? "bg-amber-500/10 border-amber-500/20 text-amber-200" :
                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                        }`}>
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <strong className="font-semibold block mb-0.5">Courier Dispatch Recommendation:</strong>
                            {selectedCustomer.cod_risk?.recommendation || "Safe for 100% Cash on Delivery fulfillment."}
                          </div>
                        </div>
                      </div>

                      {/* Transparent Risk Assessment Card */}
                      <div className="p-4 rounded-md bg-gradient-to-br from-red-500/5 via-white/[0.02] to-transparent border border-red-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                            <h4 className="font-bold text-white text-sm">Transparent Risk Scoring Engine</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                              selectedCustomer.risk_analysis?.level === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                              selectedCustomer.risk_analysis?.level === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                              selectedCustomer.risk_analysis?.level === "medium" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              Risk Level: {selectedCustomer.risk_analysis?.level ?? selectedCustomer.risk_level ?? "LOW"}
                            </span>
                            <span className="font-mono text-xs text-white font-bold bg-white/10 px-2 py-0.5 rounded">
                              {selectedCustomer.risk_analysis?.score ?? selectedCustomer.risk_score ?? 0} / 100
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Risk Factors Identified:</span>
                          <ul className="space-y-1">
                            {(selectedCustomer.risk_analysis?.reasons ?? selectedCustomer.risk_reasons ?? ["No adverse risk signals identified."]).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                          <strong className="text-purple-300">Staff Recommendation: </strong>
                          {selectedCustomer.risk_analysis?.recommendation || "Account in good standing with standard transaction history."}
                        </div>
                      </div>

                      {/* Internal Security Notes */}
                      <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            Internal Security Notes
                          </span>
                          <button
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[11px] font-bold transition-all disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Record investigation notes, phone verification logs, or special handling directives..."
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          className="w-full bg-[#07080c] border border-white/10 rounded-md p-3 text-white text-xs focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CUSTOMER 360 & RFM SEGMENTATION */}
                  {activeDrawerTab === "rfm" && (
                    <div className="space-y-5">
                      {/* Segment Banner */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 via-[#161a26] to-[#0f121b] border border-[#A78BFA]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#211B32] border border-[#A78BFA]/40 flex items-center justify-center text-[#A78BFA] shrink-0 shadow-lg">
                            {selectedCustomer.rfm?.segment === "champions" ? (
                              <Crown className="w-6 h-6 text-purple-400" />
                            ) : selectedCustomer.rfm?.segment === "at_risk" ? (
                              <AlertTriangle className="w-6 h-6 text-amber-400" />
                            ) : (
                              <Sparkles className="w-6 h-6 text-[#A78BFA]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">
                                {selectedCustomer.rfm?.label || selectedCustomer.rfm_label || "Customer RFM Profile"}
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 font-bold uppercase">
                                {selectedCustomer.rfm?.segment || "STANDARD"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {selectedCustomer.rfm?.advice || "Standard customer lifecycle marketing and order fulfillment."}
                            </p>
                          </div>
                        </div>

                        {selectedCustomer.phone && (
                          <a
                            href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Hello ${selectedCustomer.name}! Thank you for being a valued customer at our store. Here is a special voucher code for you: VIP10. Let us know if we can assist you with your next purchase!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-[#090B10] font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-md"
                          >
                            <MessageCircle className="w-4 h-4 fill-current" />
                            <span>1-Click WhatsApp VIP Offer</span>
                          </a>
                        )}
                      </div>

                      {/* RFM 3-Pillar Deep Dive Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Recency Pillar */}
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              Recency (R)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                              Days Ago
                            </span>
                          </div>
                          <div>
                            <p className="text-2xl font-bold font-mono text-white">
                              {selectedCustomer.rfm?.recency_days != null
                                ? `${selectedCustomer.rfm.recency_days}d`
                                : "No Orders"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedCustomer.rfm?.last_order_at
                                ? `Last purchase: ${formatDate(selectedCustomer.rfm.last_order_at)}`
                                : "Account has not placed any orders yet"}
                            </p>
                          </div>
                          <div className="text-[11px] text-slate-300 bg-white/[0.02] p-2.5 rounded border border-white/5">
                            {selectedCustomer.rfm?.recency_days != null && selectedCustomer.rfm.recency_days <= 30
                              ? "Active & Engaged (< 30 days)"
                              : selectedCustomer.rfm?.recency_days != null && selectedCustomer.rfm.recency_days <= 60
                              ? "Nearing Inactivity (30-60 days)"
                              : selectedCustomer.rfm?.recency_days != null
                              ? "Slipping / Dormant (> 60 days)"
                              : "New lead - no checkout history"}
                          </div>
                        </div>

                        {/* Frequency Pillar */}
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                              Frequency (F)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              Repeat Cadence
                            </span>
                          </div>
                          <div>
                            <p className="text-2xl font-bold font-mono text-white">
                              {selectedCustomer.orders_count ?? 0} Orders
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedCustomer.risk_metrics?.completed_orders ?? 0} completed successfully
                            </p>
                          </div>
                          <div className="text-[11px] text-slate-300 bg-white/[0.02] p-2.5 rounded border border-white/5">
                            {(selectedCustomer.orders_count ?? 0) >= 4
                              ? "Power Buyer (4+ lifetime orders)"
                              : (selectedCustomer.orders_count ?? 0) >= 2
                              ? "Repeat Customer (2-3 orders)"
                              : (selectedCustomer.orders_count ?? 0) === 1
                              ? "First-Time Buyer (1 order)"
                              : "Lead (0 orders placed)"}
                          </div>
                        </div>

                        {/* Monetary Pillar */}
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                              Monetary (M)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                              LTV
                            </span>
                          </div>
                          <div>
                            <p className="text-2xl font-bold font-mono text-emerald-400">
                              {formatPrice(selectedCustomer.total_spent || 0)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Average Order Value: {formatPrice(selectedCustomer.rfm?.aov || 0)}
                            </p>
                          </div>
                          <div className="text-[11px] text-slate-300 bg-white/[0.02] p-2.5 rounded border border-white/5">
                            {(selectedCustomer.total_spent || 0) >= 8000
                              ? "High LTV Tier (Top 5% customer)"
                              : (selectedCustomer.total_spent || 0) >= 2000
                              ? "Mid-Tier Contributor"
                              : "Standard Tier Spend"}
                          </div>
                        </div>
                      </div>

                      {/* Retention Playbook & Quick Direct Actions */}
                      <div className="p-4 rounded-lg bg-[#161a26] border border-white/10 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                          Retention Playbook & Recommended Marketing Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="font-semibold text-slate-200 block">Recommended Outreach</span>
                            <p className="text-slate-400 text-[11px]">
                              {selectedCustomer.rfm?.advice || "No automated rule triggered."}
                            </p>
                          </div>
                          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="font-semibold text-slate-200 block">Account Status & Risk Alignment</span>
                            <p className="text-slate-400 text-[11px]">
                              Status is <strong className="text-white uppercase">{selectedCustomer.status || "active"}</strong> with risk score of <strong className="text-white">{selectedCustomer.risk_score || 0}/100</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MULTI-IP HISTORY & TELEMETRY */}
                  {activeDrawerTab === "ips" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-xs">Originating IP Telemetry & Co-Tenancy</h4>
                          <p className="text-[11px] text-slate-400">All distinct IP addresses associated with orders and sessions for this customer.</p>
                        </div>
                      </div>

                      {(!selectedCustomer.ip_history || selectedCustomer.ip_history.length === 0) ? (
                        <p className="text-slate-500 text-xs italic py-8 text-center">No IP telemetry records logged yet.</p>
                      ) : (
                        <div className="border border-white/5 rounded-md overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/[0.01] text-slate-400 font-semibold text-[11px]">
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3">First Seen</th>
                                <th className="py-2.5 px-3">Last Seen</th>
                                <th className="py-2.5 px-3">Orders</th>
                                <th className="py-2.5 px-3">Cancels</th>
                                <th className="py-2.5 px-3">Co-Tenants</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {selectedCustomer.ip_history.map((ip) => (
                                <tr key={ip.ip_address} className="hover:bg-white/[0.02]">
                                  <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                                    <span>{ip.ip_address}</span>
                                    {ip.is_blocked && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                        BLOCKED
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{formatDate(ip.first_seen)}</td>
                                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{formatDate(ip.last_seen)}</td>
                                  <td className="py-2.5 px-3 font-mono text-white">{ip.total_orders}</td>
                                  <td className="py-2.5 px-3 font-mono text-red-400">{ip.cancelled_orders}</td>
                                  <td className="py-2.5 px-3 text-slate-400">{ip.other_customers_count} other user(s)</td>
                                  <td className="py-2.5 px-3 text-right">
                                    {!ip.is_blocked && (
                                      <button
                                        onClick={() => {
                                          setQuickBlockIp(ip.ip_address);
                                          setQuickBlockReason("Repeated cancellations / Abuse association");
                                        }}
                                        className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold transition-all"
                                      >
                                        Block IP
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ACTIVITY TIMELINE */}
                  {activeDrawerTab === "timeline" && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-white text-xs">Chronological Activity & Abuse Trail</h4>

                      {(!selectedCustomer.activity_timeline || selectedCustomer.activity_timeline.length === 0) ? (
                        <p className="text-slate-500 text-xs italic py-8 text-center">No lifecycle activity events recorded.</p>
                      ) : (
                        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                          {selectedCustomer.activity_timeline.map((item) => (
                            <div key={item.id} className="relative group">
                              <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0b0d14] ${
                                item.severity === "danger" ? "bg-red-500 shadow-sm shadow-red-500/50" :
                                item.severity === "warning" ? "bg-amber-500" :
                                item.severity === "success" ? "bg-emerald-500" : "bg-cyan-500"
                              }`} />
                              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">{item.title}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{formatDate(item.timestamp)} {formatTime(item.timestamp)}</span>
                                </div>
                                <p className="text-slate-400 text-[11px]">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: ORDERS */}
                  {activeDrawerTab === "orders" && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-white text-xs">Order History ({selectedCustomer.orders?.length || 0})</h4>

                      {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                        <p className="text-slate-500 text-xs italic py-8 text-center">No orders found for this customer.</p>
                      ) : (
                        <div className="border border-white/5 rounded-md overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/[0.01] text-slate-400 font-semibold text-[11px]">
                                <th className="py-2.5 px-3">Order Number</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Total</th>
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3 text-right">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {selectedCustomer.orders.map((ord) => (
                                <tr key={ord.id} className="hover:bg-white/[0.02]">
                                  <td className="py-2.5 px-3 font-mono font-bold text-white">{ord.order_number}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      ord.order_status === "cancelled" ? "bg-red-500/10 text-red-400" :
                                      ord.order_status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                                      "bg-cyan-500/10 text-cyan-400"
                                    }`}>
                                      {ord.order_status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{formatPrice(ord.total_amount)}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{ord.ip_address || "N/A"}</td>
                                  <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">{formatDate(ord.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {selectedCustomer.status === "active" ? (
                  <button
                    onClick={() => setSuspendingCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Suspend Customer</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivateCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reactivate Customer</span>
                  </button>
                )}

                {selectedCustomer.status !== "blocked" ? (
                  <button
                    onClick={() => handleBlockCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block Identity</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnblockCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unblock Identity</span>
                  </button>
                )}

                {selectedCustomer.status !== "review" && (
                  <button
                    onClick={() => handleFlagReview(selectedCustomer)}
                    className="px-3 py-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag for Review</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Block IP Modal */}
      {quickBlockIp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0d14] border border-white/10 rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Block IP: <span className="font-mono text-cyan-400">{quickBlockIp}</span>
              </h3>
              <button onClick={() => setQuickBlockIp(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteQuickBlockIp} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Reason for Block</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excessive abusive cancellations"
                  value={quickBlockReason}
                  onChange={(e) => setQuickBlockReason(e.target.value)}
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickBlockIp(null)}
                  className="px-3 py-1.5 rounded-md bg-white/[0.04] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuickBlock}
                  className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submittingQuickBlock ? "Blocking..." : "Confirm 7-Day Block"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {suspendingCustomer && (
        <SuspensionModal
          isOpen={true}
          targetName={suspendingCustomer.name}
          targetEmail={suspendingCustomer.email}
          targetType="customer"
          onClose={() => setSuspendingCustomer(null)}
          onConfirm={handleConfirmSuspension}
          isSubmitting={isSubmittingSuspension}
        />
      )}

      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0d14] border border-white/10 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Register New Customer</h3>
                  <p className="text-[11px] text-slate-400">Create a customer profile and credentials.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div className="flex justify-center pb-2">
                <ImageUploadAvatar
                  value={avatar}
                  onChange={(val) => setAvatar(val)}
                  name={firstName || "Customer"}
                  size="lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-[#07080c] border border-white/10 rounded-md px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-[#07080c] border border-white/10 rounded-md px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Password *</label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#07080c] border border-white/10 rounded-md px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/[0.04] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Loading Customer Intelligence...</span>
        </div>
      </div>
    }>
      <AdminCustomersContent />
    </Suspense>
  );
}
