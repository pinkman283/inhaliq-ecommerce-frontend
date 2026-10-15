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
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface PayablesAgingData {
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total: number;
}

interface PayablesSummaryData {
  total_billed: number;
  total_paid: number;
  total_due: number;
  disbursement_rate_percent: number;
  due_soon: number;
  overdue: number;
}

interface PayablesAgingChartProps {
  aging?: PayablesAgingData;
  summary?: PayablesSummaryData;
  isLoading?: boolean;
  height?: number;
  compact?: boolean;
}

export const PayablesAgingChart: React.FC<PayablesAgingChartProps> = ({
  aging,
  summary,
  isLoading = false,
  height = 280,
  compact = false,
}) => {
  const current = aging?.current || 0;
  const days31_60 = aging?.days_31_60 || 0;
  const days61_90 = aging?.days_61_90 || 0;
  const days90Plus = aging?.days_90_plus || 0;
  const total = aging?.total || (current + days31_60 + days61_90 + days90Plus);

  const chartData = [
    { name: "Current (0-30d)", amount: current, color: "#38bdf8", status: "Within Terms" },
    { name: "31-60 Days", amount: days31_60, color: "#fbbf24", status: "Due for Payment" },
    { name: "61-90 Days", amount: days61_90, color: "#f97316", status: "Overdue (Credit Risk)" },
    { name: "90+ Days", amount: days90Plus, color: "#ef4444", status: "Severely Overdue" },
  ];

  const totalOverdue = days31_60 + days61_90 + days90Plus;
  const overduePercent = total > 0 ? ((totalOverdue / total) * 100).toFixed(1) : "0";

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  // Compact Mode: High-density horizontal distribution bar for operational pages
  if (compact) {
    if (isLoading) {
      return <div className="p-4 rounded-md bg-slate-900/60 border border-white/10 animate-pulse h-24" />;
    }

    if (total <= 0) {
      return (
        <div className="p-3.5 rounded-md bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Zero Outstanding Supplier Bills</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">All vendor payables settled</span>
        </div>
      );
    }

    return (
      <div className="p-3.5 rounded-md bg-slate-900/80 border border-white/10 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              A/P Aging & Supplier Liability Horizon
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">Overdue:</span>
            <span className={`font-bold ${totalOverdue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {overduePercent}% (${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>

        {/* Proportional Segmented Progress Bar */}
        <div className="h-2 rounded-full overflow-hidden flex bg-white/5 gap-0.5">
          {chartData.map((item, idx) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={idx}
                style={{ width: `${pct}%`, backgroundColor: item.color }}
                className="h-full transition-all"
                title={`${item.name}: $${item.amount.toFixed(2)} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* 4 Compact Buckets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
          {chartData.map((item, idx) => {
            const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : "0";
            return (
              <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-md bg-black/20 border border-white/5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0 flex-1 flex items-baseline justify-between gap-1">
                  <span className="text-slate-400 text-[10.5px] truncate">{item.name}</span>
                  <span className="font-mono font-semibold text-white text-[10.5px] shrink-0">
                    ${item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title="Accounts Payable Aging & Supplier Liability Timeline"
      subtitle="Impending procurement outlays categorized by payment aging brackets"
      businessQuestion="What is our impending cash liability timeline to suppliers to prevent inventory delivery stops?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Overdue:</span>
            <span className="font-mono font-medium text-amber-400">{overduePercent}%</span>
          </div>
          {summary && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/5">
              <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Disbursed:</span>
              <span className="font-mono font-medium text-cyan-400">{summary.disbursement_rate_percent}%</span>
            </div>
          )}
        </div>
      }
    >
      {total <= 0 ? (
        <ChartEmptyState
          title="Zero Outstanding Supplier Bills"
          message="All vendor invoices and procurement receipts are fully settled."
          height={height}
        />
      ) : (
        <div className="flex flex-col h-full justify-between gap-3">
          <div style={{ height: height - 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
            {chartData.map((bracket, idx) => (
              <div key={idx} className="p-2 rounded-md bg-slate-900/40 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">{bracket.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {total > 0 ? ((bracket.amount / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold" style={{ color: bracket.color }}>
                  ${bracket.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">{bracket.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartContainer>
  );
};
