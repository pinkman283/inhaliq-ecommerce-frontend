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
import { ShieldAlert, CheckCircle2, Clock } from "lucide-react";

interface ReceivablesAgingData {
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total: number;
}

interface ReceivablesSummaryData {
  total_invoiced: number;
  total_collected: number;
  total_due: number;
  collection_rate_percent: number;
  due_soon: number;
  overdue: number;
}

interface ReceivablesAgingChartProps {
  aging?: ReceivablesAgingData;
  summary?: ReceivablesSummaryData;
  isLoading?: boolean;
  height?: number;
  compact?: boolean;
}

export const ReceivablesAgingChart: React.FC<ReceivablesAgingChartProps> = ({
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
    { name: "Current (0-30d)", amount: current, color: "#10b981", risk: "Low Risk" },
    { name: "31-60 Days", amount: days31_60, color: "#f59e0b", risk: "Moderate" },
    { name: "61-90 Days", amount: days61_90, color: "#f97316", risk: "High Risk" },
    { name: "90+ Days", amount: days90Plus, color: "#ef4444", risk: "Critical / Default Risk" },
  ];

  const totalOverdue = days31_60 + days61_90 + days90Plus;
  const overduePercent = total > 0 ? ((totalOverdue / total) * 100).toFixed(1) : "0";
  const collectionRate = summary?.collection_rate_percent ?? (summary && summary.total_invoiced > 0 ? ((summary.total_collected / summary.total_invoiced) * 100).toFixed(1) : 0);

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
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">Zero Outstanding Receivables</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">All customer accounts settled</span>
        </div>
      );
    }

    return (
      <div className="p-3.5 rounded-md bg-slate-900/80 border border-white/10 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              A/R Aging & Overdue Exposure
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">Overdue:</span>
            <span className={`font-bold ${totalOverdue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
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
      title="Accounts Receivable Aging & Risk Bracket"
      subtitle="Customer invoice settlement status across delinquency windows"
      businessQuestion="How much uncollected revenue is at risk of bad debt, and what is our collection velocity?"
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
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Recovery Rate:</span>
              <span className="font-mono font-medium text-emerald-400">{collectionRate}%</span>
            </div>
          )}
        </div>
      }
    >
      {total <= 0 ? (
        <ChartEmptyState
          title="Zero Outstanding Receivables"
          message="All customer orders and accounts are settled. No unpaid invoices on ledger."
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
                <div className="mt-1 text-[10px] text-slate-500">{bracket.risk}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartContainer>
  );
};
