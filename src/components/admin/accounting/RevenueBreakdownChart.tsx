"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { FinancialTooltip } from "./FinancialTooltip";
import { ChartEmptyState } from "./ChartEmptyState";
import { Globe, Store, Truck, Tag, RotateCcw } from "lucide-react";

interface RevenueBreakdownData {
  online_sales: number;
  pos_sales: number;
  shipping_income: number;
  discounts: number;
  returns: number;
}

interface RevenueBreakdownChartProps {
  data?: RevenueBreakdownData;
  isLoading?: boolean;
  height?: number;
}

export const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({
  data,
  isLoading = false,
  height = 300,
}) => {
  const online = data?.online_sales || 0;
  const pos = data?.pos_sales || 0;
  const shipping = data?.shipping_income || 0;
  const discounts = data?.discounts || 0;
  const returns = data?.returns || 0;

  const grossInflows = online + pos + shipping;
  const netRevenue = Math.max(0, grossInflows - discounts - returns);

  const chartData = [
    { name: "Online Sales", amount: online, color: "#06b6d4", icon: Globe },
    { name: "POS Sales", amount: pos, color: "#3b82f6", icon: Store },
    { name: "Shipping Income", amount: shipping, color: "#10b981", icon: Truck },
    { name: "Discounts Given", amount: discounts, color: "#f59e0b", icon: Tag },
    { name: "Returns / Refunds", amount: returns, color: "#f43f5e", icon: RotateCcw },
  ].filter((item) => item.amount > 0);

  const hasData = chartData.length > 0;

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <ChartContainer
      title="Revenue Stream Anatomy"
      subtitle="Channel contribution and gross margin erosion via promotions and refunds"
      businessQuestion="Which channels drive gross cash inflow, and what percentage of revenue is surrendered to discounts?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Net Rev:</span>
            <span className="font-mono font-medium text-cyan-300">
              ${netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {discounts > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400/90 font-mono">
              <span>Promo Erosion:</span>
              <span>{grossInflows > 0 ? ((discounts / grossInflows) * 100).toFixed(1) : 0}%</span>
            </div>
          )}
        </div>
      }
    >
      {!hasData ? (
        <ChartEmptyState
          title="No Revenue Stream Data"
          message="No revenue journals registered in this window."
          height={height}
        />
      ) : (
        <div className="flex flex-col h-full justify-between gap-4">
          <div style={{ height: height - 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val.includes(" ") ? val.split(" ")[0] : val)}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={
                    <FinancialTooltip
                      formatter={(val) =>
                        `$${Number(val).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      }
                    />
                  }
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-white/5 text-xs">
            {chartData.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 p-1.5 rounded-md bg-slate-900/40 border border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                    <p className="font-mono font-medium text-slate-200 text-xs">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartContainer>
  );
};
