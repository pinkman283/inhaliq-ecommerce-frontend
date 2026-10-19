"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Percent,
  Plus,
  Search,
  Filter,
  Tag,
  Ticket,
  Gift,
  Zap,
  Award,
  CreditCard,
  History,
  BarChart3,
  Edit2,
  Trash2,
  MoreVertical,
  ExternalLink,
  Copy,
  Check,
  Power,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Promotion } from "@/types";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminStatusBadge,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storefrontFilter, setStorefrontFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPromotions({
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        show_on_storefront:
          storefrontFilter === "storefront"
            ? true
            : storefrontFilter === "hidden"
            ? false
            : undefined,
        storefront_placement: [
          "hero_carousel",
          "top_strip",
          "voucher_carousel",
          "flash_sale",
          "product_grid_banner",
        ].includes(storefrontFilter)
          ? storefrontFilter
          : undefined,
        page,
        per_page: 15,
      });

      setPromotions(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || 0);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, storefrontFilter, page]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleToggleStatus = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await adminApi.togglePromotionStatus(id);
      toast.success(res.message);
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: res.status as any }
            : p
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    setActionLoadingId(id);
    try {
      await adminApi.deletePromotion(id);
      toast.success("Promotion deleted successfully");
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchPromotions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete promotion");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected promotions?`)) return;
    try {
      for (const id of selectedIds) {
        await adminApi.deletePromotion(id);
      }
      toast.success(`Deleted ${selectedIds.length} promotions`);
      setSelectedIds([]);
      fetchPromotions();
    } catch (err: any) {
      toast.error("Failed to delete some promotions");
      fetchPromotions();
    }
  };

  const getDiscountBadge = (p: Promotion) => {
    switch (p.discount_type) {
      case "percentage":
        return `${p.discount_value}% OFF`;
      case "fixed_amount":
        return `৳${Number(p.discount_value).toLocaleString()} OFF`;
      case "free_shipping":
        return "FREE SHIPPING";
      case "buy_x_get_y":
        return `BUY ${p.bxgy_buy_quantity} GET ${p.bxgy_get_quantity}`;
      default:
        return `${p.discount_value}%`;
    }
  };

  const statItems = [
    {
      label: "Total Promotions",
      value: stats?.total ?? totalCount,
      icon: Percent,
      variant: "default" as const,
    },
    {
      label: "Active Campaigns",
      value: stats?.active ?? promotions.filter((p) => p.status === "active").length,
      icon: Sparkles,
      variant: "emerald" as const,
    },
    {
      label: "Total Redemptions",
      value: stats?.total_redemptions ? Number(stats.total_redemptions).toLocaleString() : "0",
      icon: History,
      variant: "purple" as const,
    },
    {
      label: "Discounts Volume",
      value: stats?.total_discount_volume ? `৳${Number(stats.total_discount_volume).toLocaleString()}` : "৳0",
      icon: CreditCard,
      variant: "amber" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Promotions & Discounts"
        description="Architect, launch, and monitor promotional campaigns, claimable coupons, automatic rules, customer rewards, and store credits."
        badge="Enterprise Engine"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPromotions()}
              disabled={loading}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/admin/promotions/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Promotion
            </Link>
          </div>
        }
      />

      {/* Stats Strip */}
      <AdminStatStrip stats={statItems} columns={4} />

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] overflow-x-auto no-scrollbar pb-1 text-xs">
        {[
          { label: "All Promotions", href: "/admin/promotions", icon: Percent, active: true },
          { label: "Bundles & Deals", href: "/admin/promotions/bundles", icon: Sparkles },
          { label: "Discount Codes", href: "/admin/promotions/codes", icon: Ticket },
          { label: "Claimable Coupons", href: "/admin/promotions/claimable", icon: Gift },
          { label: "Automatic Rules", href: "/admin/promotions/automatic", icon: Zap },
          { label: "Customer Rewards", href: "/admin/promotions/rewards", icon: Award },
          { label: "Store Credit", href: "/admin/promotions/store-credit", icon: CreditCard },
          { label: "Redemptions", href: "/admin/promotions/redemptions", icon: History },
          { label: "Analytics", href: "/admin/promotions/analytics", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
                tab.active
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by promotion name, code, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-slate-300 focus:border-[#A78BFA]/50 outline-none"
          >
            <option value="all">All Types</option>
            <option value="discount_code">Discount Code</option>
            <option value="claimable_coupon">Claimable Coupon</option>
            <option value="automatic_discount">Automatic Discount</option>
            <option value="customer_reward">Customer Reward</option>
            <option value="next_order_discount">Next Order Discount</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-slate-300 focus:border-[#A78BFA]/50 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </select>

          {/* Storefront Filter */}
          <select
            value={storefrontFilter}
            onChange={(e) => setStorefrontFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-slate-300 focus:border-[#A78BFA]/50 outline-none"
          >
            <option value="all">All Storefront Status</option>
            <option value="storefront">Storefront Visible</option>
            <option value="hidden">Backend Only</option>
            <option value="hero_carousel">Hero Carousel</option>
            <option value="top_strip">Top Header Strip</option>
            <option value="voucher_carousel">Voucher Carousel</option>
            <option value="flash_sale">Flash Sale Section</option>
            <option value="product_grid_banner">Product Grid Banner</option>
          </select>
        </div>

        {(search || typeFilter !== "all" || statusFilter !== "all" || storefrontFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
              setStorefrontFilter("all");
              setPage(1);
            }}
            className="text-xs text-slate-400 hover:text-[#A78BFA] underline transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Promotions Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4 w-10">
                <AdminCheckbox
                  checked={promotions.length > 0 && selectedIds.length === promotions.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < promotions.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(promotions.map((p) => p.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  title="Select all promotions"
                />
              </th>
              <th className="p-4">Promotion</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Trigger / Code</th>
              <th className="p-4">Eligibility & Limits</th>
              <th className="p-4">Usage</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading promotions...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No promotions found matching your criteria.
                </td>
              </tr>
            ) : (
              promotions.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const primaryCode = p.codes?.[0]?.code;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isSelected ? "bg-[#211B32]" : ""
                    }`}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, p.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== p.id));
                          }
                        }}
                        title={`Select promotion ${p.name}`}
                      />
                    </td>

                    {/* Promotion Name & Type */}
                    <td className="p-4">
                      <div className="space-y-1 max-w-xs">
                        <Link
                          href={`/admin/promotions/${p.id}`}
                          className="font-bold text-white hover:text-[#A78BFA] transition-colors flex items-center gap-1.5"
                        >
                          {p.name}
                        </Link>
                        {p.description && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {p.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                            {p.promotion_type.replace(/_/g, " ")}
                          </span>
                          {p.is_stackable && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Stackable
                            </span>
                          )}
                          {Boolean(p.show_on_storefront) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                              {p.storefront_placement ? p.storefront_placement.replace(/_/g, " ") : "Storefront"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Discount value */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono font-semibold text-[#A78BFA] text-xs px-2.5 py-1 rounded bg-[#211B32] border border-[#A78BFA]/30">
                          {getDiscountBadge(p)}
                        </span>
                        {p.max_discount_amount && (
                          <div className="text-[10px] text-slate-400 pt-1">
                            Cap: ৳{Number(p.max_discount_amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Trigger / Code */}
                    <td className="p-4">
                      {primaryCode ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#A78BFA] bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded w-fit">
                          <Tag className="w-3 h-3 text-[#A78BFA]" />
                          <span>{primaryCode}</span>
                        </div>
                      ) : p.promotion_type === "automatic_discount" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <Zap className="w-3 h-3" /> Auto applied
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">No code</span>
                      )}
                    </td>

                    {/* Eligibility & Limits */}
                    <td className="p-4 text-[11px] text-slate-300 space-y-0.5">
                      <div>
                        Min spend: <span className="font-mono text-white">৳{p.min_order_amount}</span>
                      </div>
                      <div className="text-slate-400 capitalize">
                        Target: {p.customer_eligibility.replace(/_/g, " ")}
                      </div>
                    </td>

                    {/* Usage / Claims */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="font-mono text-white">
                          {p.total_used_count} {p.total_usage_limit ? `/ ${p.total_usage_limit}` : "used"}
                        </div>
                        {p.promotion_type === "claimable_coupon" && (
                          <div className="text-purple-300">
                            {p.total_claimed_count} claimed
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge status={p.status} />
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p.id)}
                          disabled={actionLoadingId === p.id}
                          title={p.status === "active" ? "Pause promotion" : "Activate promotion"}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <Power className={`w-3.5 h-3.5 ${p.status === "active" ? "text-emerald-400" : "text-slate-500"}`} />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.slug && p.status === "active" && (
                          <Link
                            href={`/promotions/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#A78BFA] transition-colors"
                            title="View Public Campaign Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/promotions/${p.id}`}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Edit Promotion"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoadingId === p.id}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onConfirmDelete={handleBulkDelete}
        itemName="promotions"
      />
    </div>
  );
}
