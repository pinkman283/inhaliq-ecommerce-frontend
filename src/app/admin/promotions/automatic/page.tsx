"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Search,
  Sparkles,
  RefreshCw,
  Power,
  Edit2,
  Trash2,
  Truck,
  Layers,
  X,
  Check,
  Tag,
  Percent,
  AlertTriangle,
  Info,
  Sliders,
  Calendar,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Promotion, Category, Brand } from "@/types";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AutomaticDiscountsPage() {
  const [rules, setRules] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Lookups for target scoping
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [priority, setPriority] = useState<number>(10);
  const [status, setStatus] = useState<"active" | "paused" | "draft">("active");

  const [discountType, setDiscountType] = useState<
    "free_shipping" | "percentage" | "fixed_amount" | "buy_x_get_y"
  >("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");

  const [bxgyBuyQty, setBxgyBuyQty] = useState<number>(2);
  const [bxgyGetQty, setBxgyGetQty] = useState<number>(1);
  const [bxgyRewardPercent, setBxgyRewardPercent] = useState<number>(100);
  const [bxgyMaxApps, setBxgyMaxApps] = useState<string>("");

  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<string>("");

  const [appliesTo, setAppliesTo] = useState<
    "entire_order" | "specific_categories" | "specific_brands" | "shipping"
  >("entire_order");
  const [targetCategoryIds, setTargetCategoryIds] = useState<number[]>([]);
  const [targetBrandIds, setTargetBrandIds] = useState<number[]>([]);

  const [isStackable, setIsStackable] = useState(false);
  const [canCombineWithFreeShipping, setCanCombineWithFreeShipping] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Fetch lookups once
  useEffect(() => {
    async function loadLookups() {
      try {
        const [catData, brandData] = await Promise.all([
          adminApi.getCategories().catch(() => []),
          adminApi.getBrands().catch(() => []),
        ]);
        setCategories(catData || []);
        setBrands(brandData || []);
      } catch {
        // Silently fail lookup load
      }
    }
    loadLookups();
  }, []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPromotions({
        type: "automatic_discount",
        search: search || undefined,
        page,
        per_page: 20,
      });

      setRules(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load automatic rules");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Open drawer for creating a new automatic rule
  const handleOpenCreate = () => {
    setEditingRule(null);
    setName("");
    setDescription("");
    setBadgeText("AUTO DISCOUNT");
    setPriority(10);
    setStatus("active");
    setDiscountType("percentage");
    setDiscountValue(10);
    setMaxDiscountAmount("");
    setBxgyBuyQty(2);
    setBxgyGetQty(1);
    setBxgyRewardPercent(100);
    setBxgyMaxApps("");
    setMinOrderAmount(0);
    setMinQuantity("");
    setAppliesTo("entire_order");
    setTargetCategoryIds([]);
    setTargetBrandIds([]);
    setIsStackable(false);
    setCanCombineWithFreeShipping(true);
    setStartsAt("");
    setExpiresAt("");
    setIsDrawerOpen(true);
  };

  // Open drawer for editing an existing rule
  const handleOpenEdit = (rule: Promotion) => {
    setEditingRule(rule);
    setName(rule.name || "");
    setDescription(rule.description || "");
    setBadgeText(rule.badge_text || "");
    setPriority(rule.priority ?? 10);
    setStatus(rule.status as any);

    // Map discount type
    if (rule.discount_type === "free_shipping") {
      setDiscountType("free_shipping");
    } else if (rule.discount_type === "buy_x_get_y") {
      setDiscountType("buy_x_get_y");
    } else if (rule.discount_type === "fixed_amount") {
      setDiscountType("fixed_amount");
    } else {
      setDiscountType("percentage");
    }

    setDiscountValue(rule.discount_value ?? 10);
    setMaxDiscountAmount(rule.max_discount_amount != null ? String(rule.max_discount_amount) : "");

    setBxgyBuyQty(rule.bxgy_buy_quantity || 2);
    setBxgyGetQty(rule.bxgy_get_quantity || 1);
    setBxgyRewardPercent(rule.bxgy_reward_discount_percent ?? 100);
    setBxgyMaxApps(rule.bxgy_max_applications != null ? String(rule.bxgy_max_applications) : "");

    setMinOrderAmount(rule.min_order_amount ?? 0);
    setMinQuantity(rule.min_quantity != null ? String(rule.min_quantity) : "");

    const appTo = (rule.applies_to as any) || "entire_order";
    setAppliesTo(
      appTo === "specific_categories" || appTo === "specific_brands" || appTo === "shipping"
        ? appTo
        : "entire_order"
    );

    const catTargets = rule.product_targets?.filter((t) => t.target_type === "category" && !t.is_exclusion).map((t) => t.target_id) || [];
    const brandTargets = rule.product_targets?.filter((t) => t.target_type === "brand" && !t.is_exclusion).map((t) => t.target_id) || [];
    setTargetCategoryIds(catTargets);
    setTargetBrandIds(brandTargets);

    setIsStackable(rule.is_stackable ?? false);
    setCanCombineWithFreeShipping(rule.can_combine_with_free_shipping ?? true);
    setStartsAt(rule.starts_at ? rule.starts_at.slice(0, 16) : "");
    setExpiresAt(rule.expires_at ? rule.expires_at.slice(0, 16) : "");

    setIsDrawerOpen(true);
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await adminApi.togglePromotionStatus(id);
      toast.success(res.message);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: res.status as any } : r))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this automatic promotion rule? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await adminApi.deletePromotion(id);
      toast.success("Automatic rule deleted successfully");
      if (editingRule?.id === id) {
        setIsDrawerOpen(false);
      }
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete automatic rule");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a rule name");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        badge_text: badgeText.trim() || null,
        promotion_type: "automatic_discount",
        discount_type: discountType,
        discount_value: discountType === "free_shipping" ? 0 : Number(discountValue),
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        bxgy_buy_quantity: discountType === "buy_x_get_y" ? Number(bxgyBuyQty) : null,
        bxgy_get_quantity: discountType === "buy_x_get_y" ? Number(bxgyGetQty) : null,
        bxgy_reward_discount_percent: discountType === "buy_x_get_y" ? Number(bxgyRewardPercent) : 100,
        bxgy_max_applications: discountType === "buy_x_get_y" && bxgyMaxApps ? Number(bxgyMaxApps) : null,
        applies_to: discountType === "free_shipping" ? "shipping" : appliesTo,
        status,
        priority: Number(priority),
        min_order_amount: Number(minOrderAmount) || 0,
        min_quantity: minQuantity ? Number(minQuantity) : null,
        customer_eligibility: "all",
        is_stackable: Boolean(isStackable),
        can_combine_with_free_shipping: Boolean(canCombineWithFreeShipping),
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        target_category_ids: appliesTo === "specific_categories" ? targetCategoryIds : [],
        target_brand_ids: appliesTo === "specific_brands" ? targetBrandIds : [],
      };

      if (editingRule) {
        await adminApi.updatePromotion(editingRule.id, payload);
        toast.success(`Updated rule "${name}" successfully`);
      } else {
        await adminApi.createPromotion(payload);
        toast.success(`Created rule "${name}" successfully`);
      }

      setIsDrawerOpen(false);
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save automatic promotion rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Automatic Discounts & BXGY Rules"
        description="Configure frictionless discounts that trigger automatically in customer carts without coupon codes (e.g. Free Shipping, Buy X Get Y, Tiered thresholds)."
        badge="Zero-Code Rules"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Automatic Rules" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRules()}
              disabled={loading}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Automatic Rule
            </button>
          </div>
        }
      />

      {/* Filter strip */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search automatic promotion rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Active Auto Rules: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Rules Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4">Rule Name</th>
              <th className="p-4">Type & Formula</th>
              <th className="p-4">Trigger Condition</th>
              <th className="p-4">Target Scope</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Total Redemptions</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading automatic rules...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No automatic discount rules found.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rule)}
                        className="font-bold text-white hover:text-[#A78BFA] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {rule.name}
                      </button>
                      {rule.description && (
                        <p className="text-[11px] text-slate-400 max-w-sm truncate">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-[#A78BFA] text-xs px-2.5 py-1 rounded bg-[#211B32] border border-[#A78BFA]/30">
                      {rule.discount_type === "free_shipping"
                        ? "FREE SHIPPING"
                        : rule.discount_type === "buy_x_get_y"
                        ? `BUY ${rule.bxgy_buy_quantity} GET ${rule.bxgy_get_quantity}`
                        : rule.discount_type === "fixed_amount"
                        ? `৳${rule.discount_value} OFF`
                        : `${rule.discount_value}% OFF`}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="text-[11px] text-slate-300">
                      {rule.min_order_amount > 0 ? (
                        <span>Min spend: ৳{rule.min_order_amount.toLocaleString()}</span>
                      ) : (
                        <span>No minimum spend</span>
                      )}
                      {rule.min_quantity && rule.min_quantity > 0 ? (
                        <span className="block text-slate-500">Min items: {rule.min_quantity}</span>
                      ) : null}
                    </div>
                  </td>

                  <td className="p-4 capitalize text-[11px] text-slate-400">
                    {rule.applies_to.replace(/_/g, " ")}
                  </td>

                  <td className="p-4 font-mono text-slate-300 text-xs">
                    {rule.priority ?? 10}
                  </td>

                  <td className="p-4 font-mono text-white text-xs">
                    {rule.total_used_count.toLocaleString()}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <AdminStatusBadge status={rule.status} />
                      <button
                        type="button"
                        onClick={() => handleToggle(rule.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="Toggle status"
                      >
                        <Power
                          className={`w-3.5 h-3.5 ${
                            rule.status === "active" ? "text-emerald-400" : "text-slate-500"
                          }`}
                        />
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rule)}
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit automatic rule in sidebar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Delete automatic rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTableCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER EDIT / CREATE SIDEBAR DRAWER                                     */}
      {/* ========================================================================= */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[620px] md:w-[680px] sm:!max-w-[680px] max-w-full bg-[#0b0e17] border-l border-white/[0.08] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden z-[100]"
        >
          <form onSubmit={handleSaveRule} className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0c0f18] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <SheetTitle className="text-xs font-bold text-white tracking-wide">
                    {editingRule ? "Edit Automatic Discount Rule" : "New Automatic Discount Rule"}
                  </SheetTitle>
                  <p className="text-[10px] text-slate-400">
                    Zero-code promotion evaluated automatically against qualifying cart contents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
              {/* Dynamic Formula Summary Banner */}
              <div className="p-3.5 rounded-md bg-gradient-to-r from-purple-500/10 via-[#A78BFA]/5 to-transparent border border-purple-500/20 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Live Formula Behavior:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                    {discountType === "free_shipping" && (
                      <>
                        Unlocks <strong>100% Free Shipping</strong>
                        {minOrderAmount > 0 && ` when order subtotal reaches ৳${minOrderAmount.toLocaleString()}`}.
                      </>
                    )}
                    {discountType === "percentage" && (
                      <>
                        Applies <strong>{discountValue}% OFF</strong>
                        {minOrderAmount > 0 && ` on subtotal ≥ ৳${minOrderAmount.toLocaleString()}`}
                        {maxDiscountAmount ? ` (Capped at ৳${maxDiscountAmount})` : ""}.
                      </>
                    )}
                    {discountType === "fixed_amount" && (
                      <>
                        Deducts <strong>৳{discountValue} flat discount</strong>
                        {minOrderAmount > 0 && ` on subtotal ≥ ৳${minOrderAmount.toLocaleString()}`}.
                      </>
                    )}
                    {discountType === "buy_x_get_y" && (
                      <>
                        Buy <strong>{bxgyBuyQty}</strong> items, get <strong>{bxgyGetQty}</strong> at{" "}
                        <strong>{bxgyRewardPercent}% OFF</strong>
                        {bxgyMaxApps ? ` (Max ${bxgyMaxApps} times per order)` : ""}.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Section 1: Rule Identity */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#A78BFA]" />
                  1. Rule Identity & Status
                </h4>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-300">
                    Rule Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Free Delivery Over ৳1500"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the qualification requirements and offer details..."
                    className="w-full rounded-md border border-white/10 bg-[#131722] p-2.5 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">Badge Text</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. FREE SHIPPING"
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-[#A78BFA] focus:border-[#A78BFA]/50 focus:outline-none font-mono uppercase transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">Priority</label>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none font-mono transition"
                      title="Higher priority runs earlier during evaluation"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-2 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Discount Type & Mechanics */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" />
                  2. Discount Type & Mechanics
                </h4>

                {/* Type selector cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "free_shipping", label: "Free Shipping", icon: Truck },
                    { id: "percentage", label: "% Percentage", icon: Percent },
                    { id: "fixed_amount", label: "৳ Fixed Off", icon: Tag },
                    { id: "buy_x_get_y", label: "BXGY Bundle", icon: Layers },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = discountType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDiscountType(t.id as any);
                          if (t.id === "free_shipping") {
                            setAppliesTo("shipping");
                          } else if (appliesTo === "shipping") {
                            setAppliesTo("entire_order");
                          }
                        }}
                        className={`p-3 rounded-md border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#211B32] border-[#A78BFA]/50 text-[#A78BFA] shadow-sm"
                            : "bg-[#131722] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Fields based on discount type */}
                {discountType === "percentage" && (
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-300">Discount Percent (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-300">Max Discount Amount (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={maxDiscountAmount}
                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                        placeholder="Optional cap e.g. 1000"
                        className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {discountType === "fixed_amount" && (
                  <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-300">Discount Amount (৳)</label>
                      <input
                        type="number"
                        min="1"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {discountType === "buy_x_get_y" && (
                  <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300">Buy Quantity (X)</label>
                        <input
                          type="number"
                          min="1"
                          value={bxgyBuyQty}
                          onChange={(e) => setBxgyBuyQty(Number(e.target.value))}
                          className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300">Get Quantity (Y)</label>
                        <input
                          type="number"
                          min="1"
                          value={bxgyGetQty}
                          onChange={(e) => setBxgyGetQty(Number(e.target.value))}
                          className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300">Discount on Y (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={bxgyRewardPercent}
                          onChange={(e) => setBxgyRewardPercent(Number(e.target.value))}
                          placeholder="100 for Free"
                          className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300">Max Applications / Order</label>
                        <input
                          type="number"
                          min="1"
                          value={bxgyMaxApps}
                          onChange={(e) => setBxgyMaxApps(e.target.value)}
                          placeholder="Optional limit e.g. 2"
                          className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Cart Trigger Conditions */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  3. Cart Trigger Qualifications
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">
                      Minimum Order Spend (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      placeholder="0 for none"
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">
                      Minimum Item Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(e.target.value)}
                      placeholder="e.g. 2 items"
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Target Scope */}
              {discountType !== "free_shipping" && (
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    4. Target Scope
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300">Applies To</label>
                    <select
                      value={appliesTo}
                      onChange={(e) => setAppliesTo(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none"
                    >
                      <option value="entire_order">Entire Order (All eligible items)</option>
                      <option value="specific_categories">Specific Categories</option>
                      <option value="specific_brands">Specific Brands</option>
                    </select>
                  </div>

                  {appliesTo === "specific_categories" && (
                    <div className="space-y-2 p-3 rounded-md bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300 block">
                          Select Qualifying Categories ({targetCategoryIds.length} selected):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTargetCategoryIds(categories.map((c) => c.id))}
                            className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          {targetCategoryIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setTargetCategoryIds([])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                        {categories.map((c) => {
                          const checked = targetCategoryIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/5 cursor-pointer text-slate-300"
                            >
                              <AdminCheckbox
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTargetCategoryIds([...targetCategoryIds, c.id]);
                                  } else {
                                    setTargetCategoryIds(targetCategoryIds.filter((id) => id !== c.id));
                                  }
                                }}
                              />
                              <span className="text-xs">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {appliesTo === "specific_brands" && (
                    <div className="space-y-2 p-3 rounded-md bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300 block">
                          Select Qualifying Brands ({targetBrandIds.length} selected):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTargetBrandIds(brands.map((b) => b.id))}
                            className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          {targetBrandIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setTargetBrandIds([])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                        {brands.map((b) => {
                          const checked = targetBrandIds.includes(b.id);
                          return (
                            <label
                              key={b.id}
                              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/5 cursor-pointer text-slate-300"
                            >
                              <AdminCheckbox
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTargetBrandIds([...targetBrandIds, b.id]);
                                  } else {
                                    setTargetBrandIds(targetBrandIds.filter((id) => id !== b.id));
                                  }
                                }}
                              />
                              <span className="text-xs">{b.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section 5: Combinability & Schedule */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  5. Combinability & Schedule
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-md bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                    <AdminCheckbox
                      checked={isStackable}
                      onChange={(e) => setIsStackable(e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Allow Stacking with Other Coupons
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        If checked, customer can apply a coupon code on top of this automatic discount
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-md bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                    <AdminCheckbox
                      checked={canCombineWithFreeShipping}
                      onChange={(e) => setCanCombineWithFreeShipping(e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Can Combine with Free Shipping
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Can be awarded alongside free delivery promotions
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-300">Starts At</label>
                      {startsAt && (
                        <button
                          type="button"
                          onClick={() => setStartsAt("")}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-300">Expires At</label>
                      {expiresAt && (
                        <button
                          type="button"
                          onClick={() => setExpiresAt("")}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#0c0f18] flex items-center justify-between shrink-0">
              <div>
                {editingRule && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingRule.id)}
                    disabled={deleting}
                    className="px-3 py-2 rounded-md text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Rule
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingRule ? "Update Rule" : "Save Automatic Rule"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
