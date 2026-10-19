"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { 
  Ticket, 
  ChevronRight, 
  TrendingUp, 
  HelpCircle,
  MousePointerClick,
  Users,
  Percent
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { adminApi } from "@/lib/adminApi";
import { DetailedAcquisitionReportData } from "@/types";

interface CouponReportRow {
  code: string;
  discount_type?: string;
  redemptions: number;
  total_discounts_given: number;
  revenue_generated: number;
  discount_to_revenue_roi?: string;
}

interface MarketingAndAttributionCardProps {
  couponRows: CouponReportRow[];
  isLoading?: boolean;
}

export const MarketingAndAttributionCard: React.FC<MarketingAndAttributionCardProps> = ({
  couponRows = [],
  isLoading = false,
}) => {
  const [acquisitionData, setAcquisitionData] = useState<DetailedAcquisitionReportData | null>(null);
  const [loadingAcquisition, setLoadingAcquisition] = useState(true);

  useEffect(() => {
    let isMounted = true;
    adminApi.getDetailedAcquisitionReport()
      .then((res) => {
        if (isMounted) setAcquisitionData(res);
      })
      .catch((err) => {
        console.warn("Could not load preview acquisition telemetry:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingAcquisition(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Coupon & Promotional ROI (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Promotions & Coupon Velocity
                </h2>
                <div
                  className="group relative cursor-help"
                  title="Realized discounts granted and incremental checkout revenue generated through promotional codes."
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#929BAD]" />
                </div>
              </div>
              <p className="text-xs text-[#929BAD]">
                Discount surrender vs. captured order revenue ROI
              </p>
            </div>
            <Link
              href="/admin/promotions"
              className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
            >
              <span>Promotions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#929BAD]">
              <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading campaign performance...</span>
            </div>
          ) : couponRows.length === 0 ? (
            <div className="py-8 text-center text-[#929BAD] space-y-2">
              <Ticket className="w-6 h-6 text-[#6B7280] mx-auto" />
              <p className="text-xs font-medium text-white">No active coupon redemptions recorded</p>
              <p className="text-[11px] text-[#929BAD]">
                Create a marketing voucher or bundle discount to stimulate customer checkouts.
              </p>
              <div className="pt-1">
                <Link
                  href="/admin/promotions/new"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold shadow-sm shadow-[#A78BFA]/20 transition-all cursor-pointer"
                >
                  <span>Launch New Promo Code</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#272B35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Uses</th>
                    <th className="py-2.5 px-3">Discounts</th>
                    <th className="py-2.5 px-3">Revenue Gen.</th>
                    <th className="py-2.5 px-3 text-right">ROI Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                  {couponRows.slice(0, 4).map((c, i) => (
                    <tr key={i} className="hover:bg-[#171B26]/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        <span className="px-2 py-0.5 rounded bg-[#171B26] border border-[#272B35]">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#929BAD]">
                        {c.redemptions}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-400">
                        {formatPrice(c.total_discounts_given)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {formatPrice(c.revenue_generated)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {c.discount_to_revenue_roi || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs">
          <span className="text-[#929BAD]">Realized campaign conversion telemetry</span>
          <Link
            href="/admin/promotions"
            className="font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
          >
            <span>All Promotions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Traffic Attribution & Web Telemetry (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header without redundant top right link */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Traffic & Conversion Attribution
                </h2>
                <div
                  className="group relative cursor-help"
                  title="Multi-channel visitor acquisition, session volume, and checkout conversion rate telemetry."
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#929BAD]" />
                </div>
              </div>
              <p className="text-xs text-[#929BAD]">
                Frontend visitor velocity & conversion trends
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#171B26] text-[#A78BFA] border border-[#272B35]">
              7-Day Trend
            </span>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div className="p-2.5 rounded-lg bg-[#171B26] border border-[#272B35]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD] block">
                Visitors
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {acquisitionData?.summary_kpis?.unique_visitors?.toLocaleString() ?? "..."}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#171B26] border border-[#272B35]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD] block">
                Sessions
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {acquisitionData?.summary_kpis?.sessions_clicks?.toLocaleString() ?? "..."}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#171B26] border border-[#272B35]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD] block">
                Conv. Rate
              </span>
              <span className="text-sm font-mono font-bold text-[#38BDF8]">
                {acquisitionData ? `${acquisitionData.summary_kpis.conversion_rate.toFixed(2)}%` : "..."}
              </span>
            </div>
          </div>

          {/* Overall Acquisition Trend Chart */}
          <div className="p-3.5 rounded-xl bg-[#171B26] border border-[#272B35] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#929BAD] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                <span>Daily Visitor Sessions (Clicks)</span>
              </span>
              <span className="text-[#929BAD] font-mono text-[10px]">
                {acquisitionData?.daily_performance_trends?.length ?? 7} Days
              </span>
            </div>

            <div className="h-28 w-full">
              {loadingAcquisition && !acquisitionData ? (
                <div className="h-full flex items-center justify-center text-xs text-[#929BAD]">
                  <div className="w-4 h-4 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Loading trends...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={acquisitionData?.daily_performance_trends || []}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="widgetAcqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#272B35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#929BAD"
                      fontSize={9}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                      tickFormatter={(d: string) => d.split(" ")[0] || d}
                    />
                    <YAxis
                      stroke="#929BAD"
                      fontSize={9}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                    />
                    <Tooltip
                      formatter={(v: any) => [Number(v).toLocaleString(), "Clicks (Sessions)"]}
                      labelStyle={{ color: "#929BAD", fontSize: "11px" }}
                      contentStyle={{
                        backgroundColor: "#11141D",
                        borderColor: "#272B35",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#A78BFA"
                      strokeWidth={2}
                      fill="url(#widgetAcqGrad)"
                      activeDot={{ r: 4, fill: "#A78BFA" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick Channel Share Indicators */}
            <div className="flex items-center justify-between text-[10px] text-[#929BAD] pt-1 border-t border-[#272B35]/70">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Direct: 95.8%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Referral: 3.5%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Organic: 0.5%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer: ONLY the bottom corner link as requested */}
        <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#929BAD]">Channel attribution & web telemetry</span>
          <Link
            href="/admin/acquisition-report"
            className="font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>Detailed Acquisition Report</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
