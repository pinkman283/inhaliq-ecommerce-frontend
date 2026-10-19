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
    <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Revenue Velocity & Performance
            </h2>
            <div
              className="group relative cursor-help"
              title="Consolidated gross and net sales trajectory plotted across cycles."
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#929BAD]" />
            </div>
          </div>
          <p className="text-xs text-[#929BAD]">
            Operational sales volume and channel mix
          </p>
        </div>

        {/* View Mode & Channel Split Quick Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel split badges */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#929BAD] bg-[#171B26] px-2.5 py-1 rounded-lg border border-[#272B35]">
            <span className="flex items-center gap-1">
              <Monitor className="w-3 h-3 text-[#A78BFA]" />
              Online: <strong className="font-mono text-white">{onlinePercent}%</strong>
            </span>
            <span className="text-[#383E4C]">|</span>
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3 text-blue-400" />
              POS: <strong className="font-mono text-white">{posPercent}%</strong>
            </span>
          </div>

          {/* Toggle buttons */}
          <div className="inline-flex rounded-lg bg-[#090B10] p-0.5 border border-[#272B35] text-xs">
            <button
              type="button"
              onClick={() => setViewMode("sales")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                viewMode === "sales"
                  ? "bg-[#171B26] text-white shadow-xs font-semibold"
                  : "text-[#929BAD] hover:text-white"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setViewMode("breakdown")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                viewMode === "breakdown"
                  ? "bg-[#171B26] text-white shadow-xs font-semibold"
                  : "text-[#929BAD] hover:text-white"
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#171B26]/30 rounded-lg">
            <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-[#929BAD]">Loading sales trajectory...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#171B26]/30 rounded-lg text-[#929BAD] text-xs">
            No sales activity recorded for the active period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="brandRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#272B35" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] shadow-xl text-xs space-y-1.5 min-w-[160px]">
                      <div className="font-bold text-white pb-1 border-b border-[#272B35] flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-mono text-[#929BAD] font-normal">{item.orders} orders</span>
                      </div>
                      <div className="flex items-center justify-between text-[#A78BFA]">
                        <span>Revenue:</span>
                        <span className="font-bold font-mono">{formatPrice(item.sales)}</span>
                      </div>
                      {viewMode === "breakdown" && (
                        <>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>COGS:</span>
                            <span className="font-mono">{formatPrice(item.cogs)}</span>
                          </div>
                          <div className="flex items-center justify-between text-blue-400">
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
                stroke="#A78BFA"
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
                    stroke="#3B82F6"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#272B35] text-xs">
        <div className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-white block">Online Storefront</span>
              <span className="text-[11px] text-[#929BAD]">{onlineOrdersCount} checkouts completed</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm text-white">{formatPrice(onlineSales)}</span>
        </div>

        <div className="p-3 rounded-lg bg-[#171B26] border border-[#272B35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-white block">In-Store / POS Register</span>
              <span className="text-[11px] text-[#929BAD]">{posOrdersCount} register receipts</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm text-white">{formatPrice(posSales)}</span>
        </div>
      </div>
    </div>
  );
};
