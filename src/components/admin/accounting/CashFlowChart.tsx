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
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { FinancialTooltip } from "./FinancialTooltip";
import { ChartEmptyState } from "./ChartEmptyState";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

interface CashFlowSummary {
  inflows: number;
  outflows: number;
  net: number;
  inflow_details?: { name: string; amount: number }[];
  outflow_details?: { name: string; amount: number }[];
}

interface CashFlowChartProps {
  data?: CashFlowSummary;
  isLoading?: boolean;
  height?: number;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  isLoading = false,
  height = 280,
}) => {
  const inflows = data?.inflows || 0;
  const outflows = data?.outflows || 0;
  const net = data?.net ?? (inflows - outflows);

  const chartData = [
    { name: "Cash Inflows", amount: inflows, color: "#10b981", type: "inflow" },
    { name: "Cash Outflows", amount: outflows, color: "#f43f5e", type: "outflow" },
    {
      name: "Net Cash Flow",
      amount: net,
      color: net >= 0 ? "#10b981" : "#f43f5e",
      type: "net",
    },
  ];

  const hasData = inflows > 0 || outflows > 0 || net !== 0;

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <ChartContainer
      title="Cash Flow Dynamics"
      subtitle="Total realized cash receipts versus actual cash disbursements"
      businessQuestion="Did operating cash receipts cover cash disbursements for procurement and OPEX during this period?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Net Flow:</span>
          <span
            className={`font-mono font-medium px-2 py-0.5 rounded-md border ${
              net >= 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {net >= 0 ? "+" : ""}${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      }
    >
      {!hasData ? (
        <ChartEmptyState
          title="No Cash Flow Activity"
          message="No liquid bank or cash transactions found for the selected reporting range."
          height={height}
        />
      ) : (
        <div className="flex flex-col h-full justify-between gap-3">
          <div style={{ height: height - 75 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <ReferenceLine y={0} stroke="#ffffff20" />
                <XAxis
                  dataKey="name"
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

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Inflows</p>
                <p className="font-mono font-medium text-emerald-400 text-xs">
                  ${inflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Outflows</p>
                <p className="font-mono font-medium text-rose-400 text-xs">
                  ${outflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-slate-300">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Net Flow</p>
                <p className={`font-mono font-medium text-xs ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartContainer>
  );
};
