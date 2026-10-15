"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { PromotionClaim, Promotion } from "@/types";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function ClaimableCouponsPage() {
  const [claims, setClaims] = useState<PromotionClaim[]>([]);
  const [claimablePromotions, setClaimablePromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsRes, promosRes] = await Promise.all([
        adminApi.getPromotionClaims({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          per_page: 20,
        }),
        adminApi.getPromotions({ type: "claimable_coupon", per_page: 10 }),
      ]);

      setClaims(claimsRes.data || []);
      setTotalPages(claimsRes.last_page || 1);
      setTotalCount(claimsRes.total || 0);
      setClaimablePromotions(promosRes.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Claimable Coupons & Customer Vouchers"
        description="Monitor user-claimed coupons, wallet claims, expiration timers (e.g. 7-day validity post-claim), and redemption conversion rates."
        badge="Wallet System"
        badgeVariant="purple"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Claimable Coupons" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchClaims()}
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
              New Claimable Coupon
            </Link>
          </div>
        }
      />

      {/* Active Claimable Campaigns Strip */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#A78BFA]" />
          Active Claimable Campaigns
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {claimablePromotions.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-md border border-[#A78BFA]/20 bg-[#0e1017] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#A78BFA]/20 text-[#A78BFA]">
                    {p.badge_text || `${p.discount_value}% OFF`}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {p.total_claimed_count} claimed
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{p.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-white/10 flex items-center justify-between">
                <span>
                  Validity: <strong className="text-[#A78BFA]">{p.claim_validity_days || 7} days</strong> post-claim
                </span>
                <Link
                  href={`/admin/promotions/${p.id}`}
                  className="text-xs text-[#A78BFA] hover:text-[#B9A3FF] hover:underline"
                >
                  Edit Rule →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claims Tracker Filters */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by code, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-slate-300 focus:border-[#A78BFA]/50 outline-none"
          >
            <option value="all">All Claim Statuses</option>
            <option value="claimed">Claimed (Active in Wallet)</option>
            <option value="redeemed">Redeemed (Used in Order)</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total Claims Tracked: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Claims Ledger Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4">Customer</th>
              <th className="p-4">Promotion Voucher</th>
              <th className="p-4">Assigned Code</th>
              <th className="p-4">Claimed At</th>
              <th className="p-4">Valid Until</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Redeemed Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading customer coupon claims...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <Gift className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No customer claims found.
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-bold">
                        {claim.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-white">{claim.user?.name || `User #${claim.user_id}`}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{claim.user?.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white">
                      {claim.promotion?.name || `Promotion #${claim.promotion_id}`}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-mono font-semibold text-[#A78BFA] text-xs bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded">
                      {claim.claimed_code}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {new Date(claim.claimed_at).toLocaleString()}
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {claim.expires_at ? (
                      (() => {
                        const isExpiringSoon = new Date(claim.expires_at).getTime() - Date.now() < 24 * 3600 * 1000;
                        return (
                          <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-amber-400" : "text-slate-300"}`}>
                            <Clock className="w-3 h-3" />
                            {new Date(claim.expires_at).toLocaleDateString()}
                          </span>
                        );
                      })()
                    ) : (
                      "No expiry"
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <AdminStatusBadge status={claim.status} />
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    {claim.order ? (
                      <Link
                        href={`/admin/orders/${claim.order.id}`}
                        className="text-xs text-cyan-400 hover:underline font-mono font-bold"
                      >
                        #{claim.order.order_number}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">Not yet redeemed</span>
                    )}
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
    </div>
  );
}
