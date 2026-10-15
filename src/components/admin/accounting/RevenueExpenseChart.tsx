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
import { ChartContainer } from "./ChartContainer";
import { FinancialTooltip } from "./FinancialTooltip";
import { ChartEmptyState } from "./ChartEmptyState";

interface DailyTrendItem {
  date: string;
  revenue: number;
  cogs: number;
  expense: number;
  total_cost?: number;
  gross_profit?: number;
  net_profit: number;
}

interface RevenueExpenseChartProps {
  data: DailyTrendItem[];
  isLoading?: boolean;
  height?: number;
}

export const RevenueExpenseChart: React.FC<RevenueExpenseChartProps> = ({
  data = [],
  isLoading = false,
  height = 300,
}) => {
  const [viewMode, setViewMode] = useState<"combined" | "split">("combined");

  const formattedData = data.map((d) => {
    const totalCost = typeof d.total_cost === "number" ? d.total_cost : (d.cogs || 0) + (d.expense || 0);
    return {
      ...d,
      total_cost: Math.max(0, totalCost),
      cogs: Math.max(0, d.cogs || 0),
      expense: Math.max(0, d.expense || 0),
      revenue: Math.max(0, d.revenue || 0),
    };
  });

  const hasData = formattedData.length > 0 && formattedData.some((d) => d.revenue > 0 || d.total_cost > 0);

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  const totalRev = formattedData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalCost = formattedData.reduce((acc, curr) => acc + curr.total_cost, 0);
  const burnRatio = totalRev > 0 ? ((totalCost / totalRev) * 100).toFixed(0) : "0";

  return (
    <ChartContainer
      title="Revenue vs. Operating Burden"
      subtitle="Trajectory of top-line collections relative to COGS and operating outlays"
      businessQuestion="Is the business burning more capital than it captures, and are spending trajectories expanding?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span>Cost-to-Rev:</span>
            <span className={`font-mono font-medium ${Number(burnRatio) > 100 ? "text-rose-400" : "text-emerald-400"}`}>
              {burnRatio}%
            </span>
          </div>
          <div className="flex items-center rounded-md bg-slate-800/80 p-0.5 border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("combined")}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === "combined" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Total Cost
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === "split" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              COGS / OPEX
            </button>
          </div>
        </div>
      }
    >
      {!hasData ? (
        <ChartEmptyState
          title="No Revenue or Expense Activity"
          message="No sales invoices or expense outlays have been posted in the selected window."
          height={height}
        />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorOpex" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<FinancialTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRev)"
            />
            {viewMode === "combined" ? (
              <Area
                type="monotone"
                dataKey="total_cost"
                name="Total Expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="cogs"
                  name="COGS"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCogs)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="OPEX"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOpex)"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};
