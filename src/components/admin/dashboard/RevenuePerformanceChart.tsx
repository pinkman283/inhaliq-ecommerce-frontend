"use client";

import React, { useState } from "react";
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
import { formatPrice } from "@/lib/utils";
import { HelpCircle, Layers, Store, Monitor } from "lucide-react";

interface SalesTrendItem {
  month: string;
  sales: number;
  orders: number;
  cogs?: number;
  expenses?: number;
  profit?: number;
}

interface RevenuePerformanceChartProps {
  data: SalesTrendItem[];
  onlineSales: number;
  posSales: number;
  onlineOrdersCount: number;
  posOrdersCount: number;
  isLoading?: boolean;
}

export const RevenuePerformanceChart: React.FC<RevenuePerformanceChartProps> = ({
  data = [],
  onlineSales,
  posSales,
  onlineOrdersCount,
  posOrdersCount,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<"sales" | "breakdown">("sales");

  const totalSales = onlineSales + posSales;
  const onlinePercent = totalSales > 0 ? ((onlineSales / totalSales) * 100).toFixed(0) : "100";
  const posPercent = totalSales > 0 ? ((posSales / totalSales) * 100).toFixed(0) : "0";

  // Format currency for Y-axis
  const formatYAxis = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const chartData = data.map((d) => {
    // If backend only returns sales & orders, estimate cogs/profit for breakdown mode safely
    const cogs = d.cogs ?? Math.round(d.sales * 0.55);
    const expenses = d.expenses ?? Math.round(d.sales * 0.15);
    const profit = d.profit ?? (d.sales - cogs - expenses);
    return {
      ...d,
      cogs,
      expenses,
      profit: Math.max(0, profit),
    };
  });

  return (
    <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#111827] tracking-tight">
              Revenue Velocity & Performance
            </h2>
            <div
              className="group relative cursor-help"
              title="Consolidated gross and net sales trajectory plotted across cycles."
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#4B5563]" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">
            Operational sales volume and channel mix
          </p>
        </div>

        {/* View Mode & Channel Split Quick Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel split badges */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#4B5563] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1">
              <Monitor className="w-3 h-3 text-emerald-600" />
              Online: <strong className="font-mono text-[#111827]">{onlinePercent}%</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3 text-blue-600" />
              POS: <strong className="font-mono text-[#111827]">{posPercent}%</strong>
            </span>
          </div>

          {/* Toggle buttons */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("sales")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                viewMode === "sales"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setViewMode("breakdown")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                viewMode === "breakdown"
                  ? "bg-white text-[#111827] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Margin Split
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-lg">
            <div className="w-6 h-6 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-[#6B7280]">Loading sales trajectory...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-lg text-[#6B7280] text-xs">
            No sales activity recorded for the active period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="brandRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009B55" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#009B55" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] shadow-md text-xs space-y-1.5 min-w-[160px]">
                      <div className="font-bold text-[#111827] pb-1 border-b border-slate-100 flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-mono text-[#6B7280] font-normal">{item.orders} orders</span>
                      </div>
                      <div className="flex items-center justify-between text-[#009B55]">
                        <span>Revenue:</span>
                        <span className="font-bold font-mono">{formatPrice(item.sales)}</span>
                      </div>
                      {viewMode === "breakdown" && (
                        <>
                          <div className="flex items-center justify-between text-amber-600">
                            <span>COGS:</span>
                            <span className="font-mono">{formatPrice(item.cogs)}</span>
                          </div>
                          <div className="flex items-center justify-between text-blue-600">
                            <span>Net Profit:</span>
                            <span className="font-bold font-mono">{formatPrice(item.profit)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Gross Revenue"
                stroke="#009B55"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#brandRevenueGrad)"
              />
              {viewMode === "breakdown" && (
                <>
                  <Area
                    type="monotone"
                    dataKey="cogs"
                    name="Est. Product Cost (COGS)"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#cogsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Operating Profit"
                    stroke="#2563EB"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Channel Breakdown Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-[#009B55]">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-[#111827] block">Online Storefront</span>
              <span className="text-[11px] text-[#6B7280]">{onlineOrdersCount} checkouts completed</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm text-[#111827]">{formatPrice(onlineSales)}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-[#111827] block">In-Store / POS Register</span>
              <span className="text-[11px] text-[#6B7280]">{posOrdersCount} register receipts</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm text-[#111827]">{formatPrice(posSales)}</span>
        </div>
      </div>
    </div>
  );
};
