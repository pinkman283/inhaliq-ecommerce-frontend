"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  Percent,
  History,
  CreditCard,
  RefreshCw,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { adminApi } from "@/lib/adminApi";
import { PromotionAnalyticsData } from "@/types";
import { AdminPageHeader, AdminStatStrip } from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function PromotionAnalyticsPage() {
  const [data, setData] = useState<PromotionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let days = 30;
      if (timeRange === "7d") days = 7;
      if (timeRange === "90d") days = 90;

      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const endDate = now.toISOString().slice(0, 10);

      const res = await adminApi.getPromotionAnalytics({
        date_from: startDate,
        date_to: endDate,
      });

      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load promotion analytics");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = data?.kpis;

  const statItems = [
    {
      label: "Total Redemptions",
      value: kpis ? Number(kpis.total_redemptions).toLocaleString() : "0",
      icon: History,
      variant: "default" as const,
    },
    {
      label: "Discounts Granted",
      value: kpis ? `৳${Number(kpis.total_discount_volume).toLocaleString()}` : "৳0",
      icon: Percent,
      variant: "amber" as const,
    },
    {
      label: "Revenue Influenced",
      value: kpis ? `৳${Number(kpis.total_revenue_with_promos).toLocaleString()}` : "৳0",
      icon: TrendingUp,
      variant: "emerald" as const,
    },
    {
      label: "Claim Conversion Rate",
      value: kpis ? `${Number(kpis.claim_conversion_rate).toFixed(1)}%` : "0%",
      icon: Gift,
      variant: "purple" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Promotions & Loyalty Analytics"
        description="Track discount ROI, coupon conversion rates, customer wallet liability, and top-performing marketing campaigns."
        badge="Executive Metrics"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Analytics" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md bg-white/5 border border-white/10 p-1 text-xs">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    timeRange === r
                      ? "bg-[#A78BFA] text-[#090B10] shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <AdminStatStrip stats={statItems} columns={4} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Col 2) */}
        <div className="lg:col-span-2 p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
              Promotion Activity & Discount Volume
            </h3>
            <span className="text-xs text-slate-400 font-mono">Daily aggregated</span>
          </div>

          <div className="h-[300px] w-full pt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Loading trend data...
              </div>
            ) : !data?.recent_trend || data.recent_trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No trend data recorded for this date window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.recent_trend}>
                  <defs>
                    <linearGradient id="discountGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090b10",
                      borderColor: "#ffffff20",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue_sum"
                    name="Revenue Influenced (৳)"
                    stroke="#10b981"
                    fill="url(#revGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="discount_sum"
                    name="Discounts Granted (৳)"
                    stroke="#A78BFA"
                    fill="url(#discountGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Store Credit & Wallet Liability Card (Col 1) */}
        <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Store Credit Liability
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium">
                  Active Customer Wallet Balance (Liability)
                </span>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  ৳{kpis ? Number(kpis.active_store_credit_balance).toLocaleString() : "0"}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  GL Account: 2020 - Customer Advances
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Total Issued</span>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    ৳{kpis ? Number(kpis.store_credit_issued).toLocaleString() : "0"}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Total Debited</span>
                  <div className="text-sm font-bold font-mono text-[#A78BFA]">
                    ৳{kpis ? Number(kpis.store_credit_redeemed).toLocaleString() : "0"}
                  </div>
                </div>
              </div>

              {/* Claims Funnel summary */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-xs font-bold text-slate-300">Voucher Claim Funnel</span>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Vouchers Claimed:</span>
                    <span className="font-mono text-white">{kpis?.total_claims || 0}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Redeemed in Checkout:</span>
                    <span className="font-mono font-bold">{kpis?.redeemed_claims || 0}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Expired Unused:</span>
                    <span className="font-mono">{kpis?.expired_claims || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/admin/promotions/store-credit"
            className="w-full text-center py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Manage Store Credit Ledger →
          </Link>
        </div>
      </div>

      {/* Top Campaigns Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
          Top Performing Promotional Campaigns
        </h3>

        <ScrollableTableCard>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Promotion</th>
                <th className="p-4">Type</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Total Applications</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {!data?.top_promotions || data.top_promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No top promotions recorded yet.
                  </td>
                </tr>
              ) : (
                data.top_promotions.map((tp) => (
                  <tr key={tp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white">
                      {tp.name}
                    </td>

                    <td className="p-4 capitalize font-mono text-[11px] text-slate-400">
                      {tp.promotion_type.replace(/_/g, " ")}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#A78BFA] text-xs bg-[#211B32] border border-[#A78BFA]/30 px-2.5 py-1 rounded">
                        {tp.discount_type === "percentage" ? `${tp.discount_value}% OFF` : `৳${tp.discount_value} OFF`}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-white text-xs">
                      {tp.total_used_count.toLocaleString()}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/promotions/${tp.id}`}
                        className="text-xs text-[#A78BFA] hover:text-[#B9A3FF] hover:underline font-medium"
                      >
                        Inspect Campaign →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTableCard>
      </div>
    </div>
  );
}
