"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Search,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Tag,
  DollarSign,
  User as UserIcon,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { PromotionRedemption } from "@/types";
import {
  AdminPageHeader,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function RedemptionsHistoryPage() {
  const [redemptions, setRedemptions] = useState<PromotionRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRedemptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPromotionRedemptions({
        search: search || undefined,
        page,
        per_page: 25,
      });

      setRedemptions(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load redemptions");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Promotion Redemptions History"
        description="Immutable audit log of all coupon applications, automatic rule activations, and discounts redeemed during checkout."
        badge="Audit Ledger"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Redemptions" },
        ]}
        action={
          <button
            onClick={() => fetchRedemptions()}
            disabled={loading}
            className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {/* Filter strip */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by order #, customer email, or promo code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total Redemptions: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Table */}
      <ScrollableTableCard>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Promotion Applied</th>
              <th className="p-4">Voucher Code</th>
              <th className="p-4">Discount Amount</th>
              <th className="p-4 text-right">Order Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading redemption records...
                </td>
              </tr>
            ) : redemptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No redemptions found.
                </td>
              </tr>
            ) : (
              redemptions.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${r.order_id}`}
                      className="font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      #{r.order?.order_number || r.order_id}
                    </Link>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="text-white font-medium">{r.user?.name || "Guest Customer"}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{r.customer_email}</div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white">
                      {r.promotion?.name || `Promotion #${r.promotion_id}`}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {r.promotion_type} • {r.discount_type}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    {r.code_used ? (
                      <span className="font-mono font-semibold text-[#A78BFA] text-xs bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded">
                        {r.code_used}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">Automatic</span>
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap font-mono font-bold text-emerald-400">
                    -৳{Number(r.discount_amount).toLocaleString()}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap font-mono font-bold text-white">
                    ৳{Number(r.order_total).toLocaleString()}
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
