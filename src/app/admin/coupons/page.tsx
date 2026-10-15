"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Tag, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Sparkles, 
  Check, 
  X,
  Percent,
  DollarSign,
  Clock,
  Calendar,
  Infinity as InfinityIcon,
  Timer,
  AlertTriangle,
  RotateCcw,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("20");
  const [minOrderAmount, setMinOrderAmount] = useState("50");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("1000");
  const [isActive, setIsActive] = useState(true);
  const [hasDuration, setHasDuration] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [customDurationVal, setCustomDurationVal] = useState("10");
  const [customDurationUnit, setCustomDurationUnit] = useState<"hours" | "days" | "weeks">("days");
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingCoupon, setDeletingCoupon] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toDateTimeLocalValue = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const applyDurationPreset = (hours: number) => {
    const base = startsAt ? new Date(startsAt) : new Date();
    if (!startsAt) {
      setStartsAt(toDateTimeLocalValue(new Date().toISOString()));
    }
    const end = new Date(base.getTime() + hours * 60 * 60 * 1000);
    setExpiresAt(toDateTimeLocalValue(end.toISOString()));
    setHasDuration(true);
  };

  const applyCustomDuration = () => {
    const num = Number(customDurationVal);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive number for duration.");
      return;
    }
    let hours = num;
    if (customDurationUnit === "days") hours = num * 24;
    if (customDurationUnit === "weeks") hours = num * 24 * 7;

    const base = startsAt ? new Date(startsAt) : new Date();
    if (!startsAt) {
      setStartsAt(toDateTimeLocalValue(new Date().toISOString()));
    }
    const end = new Date(base.getTime() + hours * 60 * 60 * 1000);
    setExpiresAt(toDateTimeLocalValue(end.toISOString()));
    setHasDuration(true);
    toast.success(`Calculated end date (+${num} ${customDurationUnit}).`);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons({ search: search.trim() || undefined });
      setCoupons(res.data || []);
    } catch (err) {
      toast.error("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    adminApi.getCoupons({}).then((res) => {
      setCoupons(res.data || []);
    });
    toast.success("Coupon filters reset to default.");
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode("");
    setType("percentage");
    setValue("20");
    setMinOrderAmount("50");
    setMaxDiscountAmount("");
    setUsageLimit("1000");
    setIsActive(true);
    setHasDuration(false);
    setStartsAt("");
    setExpiresAt("");
    setCustomDurationVal("10");
    setCustomDurationUnit("days");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(c.value.toString());
    setMinOrderAmount(c.min_order_amount?.toString() || "");
    setMaxDiscountAmount(c.max_discount_amount?.toString() || "");
    setUsageLimit(c.usage_limit?.toString() || "");
    setIsActive(c.is_active);
    setHasDuration(Boolean(c.starts_at || c.expires_at));
    setStartsAt(toDateTimeLocalValue(c.starts_at));
    setExpiresAt(toDateTimeLocalValue(c.expires_at));
    setCustomDurationVal("10");
    setCustomDurationUnit("days");
    setIsModalOpen(true);
  };

  const isEditDirty = Boolean(
    editingCoupon && (
      code.trim().toUpperCase() !== (editingCoupon.code || "").toUpperCase() ||
      type !== editingCoupon.type ||
      value !== (editingCoupon.value?.toString() || "0") ||
      minOrderAmount !== (editingCoupon.min_order_amount?.toString() || "") ||
      maxDiscountAmount !== (editingCoupon.max_discount_amount?.toString() || "") ||
      usageLimit !== (editingCoupon.usage_limit?.toString() || "") ||
      isActive !== editingCoupon.is_active ||
      hasDuration !== Boolean(editingCoupon.starts_at || editingCoupon.expires_at) ||
      (hasDuration && startsAt !== toDateTimeLocalValue(editingCoupon.starts_at)) ||
      (hasDuration && expiresAt !== toDateTimeLocalValue(editingCoupon.expires_at))
    )
  );

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon && !isEditDirty) {
      toast.info("No changes were made.");
      return;
    }

    if (hasDuration && startsAt && expiresAt) {
      if (new Date(expiresAt).getTime() <= new Date(startsAt).getTime()) {
        toast.error("The End Date & Time (To) must be after the Start Date & Time (From).");
        return;
      }
    }

    setSaving(true);

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      is_active: isActive,
      starts_at: hasDuration && startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: hasDuration && expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    try {
      if (editingCoupon) {
        const res = await adminApi.updateCoupon(editingCoupon.id, payload);
        setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? res.coupon : c)));
        toast.success(`Coupon '${res.coupon.code}' updated.`);
      } else {
        const res = await adminApi.createCoupon(payload);
        setCoupons([res.coupon, ...coupons]);
        toast.success(`Coupon '${res.coupon.code}' created.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    setDeleting(true);

    try {
      await adminApi.deleteCoupon(deletingCoupon.id);
      setCoupons(coupons.filter((c) => c.id !== deletingCoupon.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingCoupon.id));
      toast.success(`Coupon '${deletingCoupon.code}' removed.`);
      setDeletingCoupon(null);
    } catch (err: any) {
      toast.error("Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (filteredCoupons.length > 0 && selectedIds.length === filteredCoupons.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCoupons.map((c) => c.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteCoupons(selectedIds);
      setCoupons((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      toast.success(res.message || `Deleted ${selectedIds.length} coupon(s).`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected coupons.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
    const isScheduled = c.starts_at && new Date(c.starts_at).getTime() > Date.now();
    if (statusFilter === "active") return c.is_active && !isExpired && !isScheduled;
    if (statusFilter === "scheduled") return c.is_active && isScheduled;
    if (statusFilter === "expired") return isExpired;
    if (statusFilter === "inactive") return !c.is_active;
    return true;
  });

  const renderCouponStatus = (c: any) => {
    const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
    const isScheduled = c.starts_at && new Date(c.starts_at).getTime() > Date.now();
    if (!c.is_active) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
          Inactive
        </span>
      );
    }
    if (isScheduled) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit">
          <Calendar className="w-3 h-3 text-cyan-400 shrink-0" /> Scheduled
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3 text-rose-400 shrink-0" /> Expired
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
        <Check className="w-3 h-3 text-emerald-400 shrink-0" /> Active
      </span>
    );
  };

  const renderCouponDuration = (c: any) => {
    const isScheduled = c.starts_at && new Date(c.starts_at).getTime() > Date.now();

    if (isScheduled) {
      return (
        <div className="flex flex-col text-xs">
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400 shrink-0" /> Starts {formatDate(c.starts_at)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatTime(c.starts_at)} {c.expires_at ? `• Until ${formatDate(c.expires_at)}` : "• No Expiry"}
          </span>
        </div>
      );
    }

    if (!c.expires_at) {
      if (c.starts_at) {
        return (
          <div className="flex flex-col text-xs">
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" /> Active since {formatDate(c.starts_at)}
            </span>
            <span className="text-[10px] text-slate-500">Never Expires</span>
          </div>
        );
      }
      return (
        <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
          <InfinityIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          Never Expires
        </span>
      );
    }

    const expDate = new Date(c.expires_at);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const isExpired = diffMs <= 0;

    if (isExpired) {
      return (
        <div className="flex flex-col text-xs">
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-400 shrink-0" /> Automatically Halted
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Expired on {formatDate(c.expires_at)}
          </span>
        </div>
      );
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let countdownText = "";
    if (diffDays > 1) {
      countdownText = `${diffDays} days remaining`;
    } else if (diffHours > 0) {
      countdownText = `${diffHours} hours remaining`;
    } else {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      countdownText = `${diffMins} mins remaining`;
    }

    const isUrgent = diffHours < 24;

    return (
      <div className="flex flex-col text-xs">
        <span className={`font-bold flex items-center gap-1 ${isUrgent ? "text-amber-400" : "text-[#A78BFA]"}`}>
          <Clock className={`w-3 h-3 shrink-0 ${isUrgent ? "text-amber-400" : "text-[#A78BFA]"}`} /> {countdownText}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          Until {formatDate(c.expires_at)}, {formatTime(c.expires_at)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
            Promotions & Discounts
          </span>
          <h1 className="text-2xl font-black text-white">Coupons & Campaigns ({coupons.length})</h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* PromotionEngine Modern Bridge Banner */}
      <div className="p-4 rounded-md bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">Modern PromotionEngine Active</h4>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">Authoritative Engine</span>
            </div>
            <p className="text-[11px] text-slate-400">
              For advanced BXGY, tiered discounts, claimable vouchers, customer rewards, and store credits, use the authoritative Promotion Engine. Existing legacy coupons remain active and manageable below.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/promotions/new"
            className="px-3.5 py-1.5 rounded-md bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Promotion Builder</span>
          </Link>
          <Link
            href="/admin/promotions"
            className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center justify-center"
          >
            All Promotions
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-md bg-[#0e121e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); loadCoupons(); }} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon codes..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-9.5 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <AdminDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: "All Campaigns" },
              { value: "active", label: "Active & Valid" },
              { value: "scheduled", label: "Scheduled (Future)" },
              { value: "expired", label: "Expired Duration" },
              { value: "inactive", label: "Manually Disabled" },
            ]}
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
            title="Reset all coupon filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Coupons Table with Scrollable Drag Card */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs text-slate-300 min-w-[750px]">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <AdminCheckbox
                  checked={filteredCoupons.length > 0 && selectedIds.length === filteredCoupons.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredCoupons.length}
                  onChange={handleToggleSelectAll}
                  title="Select all coupons"
                />
              </th>
              <th className="p-3.5">Coupon Code</th>
              <th className="p-3.5">Discount Value</th>
              <th className="p-3.5">Min Spend</th>
              <th className="p-3.5 min-w-[180px]">Duration & Expiry</th>
              <th className="p-3.5">Redemptions</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-center min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Loading promotional campaigns...
                </td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                  No discount coupons matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredCoupons.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-[#211B32] border-l-2 border-[#A78BFA]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(c.id)}
                        title={`Select coupon ${c.code}`}
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#A78BFA] bg-[#211B32] border border-[#A78BFA]/30 px-2 py-0.5 rounded text-xs tracking-wider inline-block">
                        {c.code}
                      </span>
                    </td>
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">
                    {c.type === "percentage" ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`}
                  </td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {c.min_order_amount ? formatPrice(c.min_order_amount) : "No minimum"}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {renderCouponDuration(c)}
                  </td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap">
                    <span className="font-bold text-white">{c.used_count ?? c.usage_count ?? 0}</span>
                    <span className="text-slate-500"> / {c.usage_limit ?? "∞"}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {renderCouponStatus(c)}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1.5 flex-wrap w-[146px] mx-auto">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] hover:scale-105 transition-all shadow-sm"
                        title="Edit Coupon & Duration"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCoupon(c)}
                        className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:scale-105 transition-all shadow-sm"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* Create / Edit Coupon Slide-over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[580px] md:w-[620px] sm:!max-w-[620px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSaveCoupon} className="flex flex-col h-full overflow-hidden">
            {/* Compact Header: h-12 */}
            <div className="h-12 px-6 border-b border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <SheetTitle className="text-xs font-semibold text-white tracking-wide shrink-0">
                  {editingCoupon ? "Edit Coupon" : "New Promotion"}
                </SheetTitle>
                {editingCoupon && (
                  <>
                    <span className="text-[10px] font-mono text-[#A78BFA] bg-[#211B32] border border-[#A78BFA]/30 px-2 py-0.5 rounded shrink-0">
                      {editingCoupon.code}
                    </span>
                    <span className="text-slate-600 text-xs shrink-0">·</span>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">
                      {editingCoupon.type === "percentage" ? `${editingCoupon.value}% OFF` : `$${editingCoupon.value} OFF`}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Coupon Code <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. STUDIO25"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none font-mono uppercase font-bold transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Discount Type</label>
                  <AdminDropdown
                    value={type}
                    onChange={(val: any) => setType(val)}
                    className="w-full"
                    buttonClassName="w-full h-9 rounded-md"
                    options={[
                      { value: "percentage", label: "Percentage (%)" },
                      { value: "fixed", label: "Fixed Amount ($)" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Value {type === "percentage" ? "(%)" : "($)"} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Min Spend ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Campaign Duration & Timing Policy Panel */}
              <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Campaign Duration & Timing
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasDuration) {
                        setHasDuration(true);
                        if (!startsAt) {
                          setStartsAt(toDateTimeLocalValue(new Date().toISOString()));
                        }
                        applyDurationPreset(72);
                      } else {
                        setHasDuration(false);
                        setStartsAt("");
                        setExpiresAt("");
                      }
                    }}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                      hasDuration
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold"
                    }`}
                  >
                    {hasDuration ? (
                      <>
                        <X className="w-3.5 h-3.5" /> Remove Duration (Never Expires)
                      </>
                    ) : (
                      <>
                        <Timer className="w-3.5 h-3.5" /> Set Duration
                      </>
                    )}
                  </button>
                </div>

                {hasDuration ? (
                  <div className="space-y-3.5 pt-2 border-t border-white/5">
                    {/* Quick Duration Presets */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Quick Presets
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {[
                          { label: "24 Hours", hours: 24 },
                          { label: "3 Days", hours: 72 },
                          { label: "7 Days", hours: 168 },
                          { label: "14 Days", hours: 336 },
                          { label: "30 Days", hours: 720 },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyDurationPreset(p.hours)}
                            className="py-1 px-2 rounded-md bg-white/[0.03] hover:bg-[#A78BFA]/20 hover:text-[#B9A3FF] border border-white/5 text-[10px] font-medium text-slate-300 transition text-center cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Duration Section */}
                    <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/5 space-y-2">
                      <span className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wider block">
                        Custom Duration
                      </span>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={customDurationVal}
                          onChange={(e) => setCustomDurationVal(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-20 bg-[#131722] border border-white/10 rounded-md px-2.5 py-1 text-white focus:outline-none focus:border-[#A78BFA]/50 font-mono text-xs"
                        />
                        <select
                          value={customDurationUnit}
                          onChange={(e) => setCustomDurationUnit(e.target.value as any)}
                          className="bg-[#131722] border border-white/10 rounded-md px-2 py-1 text-white focus:outline-none focus:border-[#A78BFA]/50 text-xs cursor-pointer"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                        <button
                          type="button"
                          onClick={applyCustomDuration}
                          className="px-3 py-1 rounded-md bg-[#A78BFA]/15 hover:bg-[#A78BFA]/25 border border-[#A78BFA]/30 text-[#A78BFA] font-semibold text-[10px] uppercase tracking-wider transition shrink-0 cursor-pointer"
                        >
                          Apply Custom
                        </button>
                      </div>
                    </div>

                    {/* Datetime Pickers: FROM and TO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                            Start Date & Time
                          </label>
                          <button
                            type="button"
                            onClick={() => setStartsAt(toDateTimeLocalValue(new Date().toISOString()))}
                            className="text-[9px] text-cyan-400 hover:underline font-bold cursor-pointer"
                          >
                            Set to Now
                          </button>
                        </div>
                        <input
                          type="datetime-local"
                          value={startsAt}
                          onChange={(e) => setStartsAt(e.target.value)}
                          className="w-full bg-[#131722] border border-white/10 rounded-md px-3 py-1.5 text-white focus:outline-none focus:border-[#A78BFA]/50 font-mono text-xs [color-scheme:dark]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                            Expiry Date & Time
                          </label>
                          {expiresAt && (
                            <button
                              type="button"
                              onClick={() => setExpiresAt("")}
                              className="text-[9px] text-slate-400 hover:text-white font-bold cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full bg-[#131722] border border-white/10 rounded-md px-3 py-1.5 text-white focus:outline-none focus:border-[#A78BFA]/50 font-mono text-xs [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This coupon has no time constraint and will remain valid indefinitely until manually deactivated or until its usage limit is exhausted.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1 text-xs">
                <AdminCheckbox
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Coupon is actively redeemable by customers</span>
              </label>
            </div>

            {/* Compact Footer: h-12 */}
            <div className="h-12 px-6 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-medium text-slate-400 hover:text-white transition px-1 py-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (editingCoupon ? !isEditDirty : false)}
                className={`h-8 px-4 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${
                  editingCoupon && !isEditDirty
                    ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
                    : "bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold"
                }`}
                title={editingCoupon && !isEditDirty ? "No changes made to coupon details" : undefined}
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{saving ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}</span>
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Modal */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeletingCoupon(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-md rounded-md bg-[#0e121e] border border-rose-500/30 p-6 z-10 space-y-4 text-xs">
            <h3 className="text-base font-black text-white">Delete Coupon</h3>
            <p className="text-slate-300">
              Are you sure you want to deactivate and remove coupon <span className="font-mono font-bold text-[#A78BFA] bg-[#211B32] border border-[#A78BFA]/30 px-1.5 py-0.5 rounded">{deletingCoupon.code}</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                className="px-4 py-2 rounded-md text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCoupon}
                className="px-5 py-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredCoupons.length}
        itemName="coupon"
        isDeleting={isBulkDeleting}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onConfirmDelete={handleBulkDelete}
      />
    </div>
  );
}
