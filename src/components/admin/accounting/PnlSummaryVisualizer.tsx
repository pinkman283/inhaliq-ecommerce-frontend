"use client";

import React from "react";

interface PnlSummaryVisualizerProps {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  netIncome: number;
  netMargin: number;
  isLoading?: boolean;
}

export const PnlSummaryVisualizer: React.FC<PnlSummaryVisualizerProps> = ({
  totalRevenue,
  totalCogs,
  grossProfit,
  grossMargin,
  operatingExpenses,
  netIncome,
  netMargin,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-md bg-white/[0.02] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    );
  }

  const cogsPercent = totalRevenue > 0 ? ((totalCogs / totalRevenue) * 100).toFixed(1) : "0";
  const isPositiveNet = netIncome >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Net Revenue */}
      <div className="p-4 rounded-md bg-[#0d1017] border border-white/[0.06] flex flex-col justify-between transition-all hover:border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Net Revenue</span>
          <span className="text-[11px] font-mono text-slate-500">100%</span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-white tracking-tight">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Total operating sales</p>
        </div>
      </div>

      {/* 2. Cost of Goods */}
      <div className="p-4 rounded-md bg-[#0d1017] border border-white/[0.06] flex flex-col justify-between transition-all hover:border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Cost of Goods (FIFO)</span>
          <span className="text-[11px] font-mono text-slate-500">{cogsPercent}%</span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-slate-200 tracking-tight">
            ${totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Product & inventory cost</p>
        </div>
      </div>

      {/* 3. Gross Profit */}
      <div className="p-4 rounded-md bg-[#0d1017] border border-white/[0.06] flex flex-col justify-between transition-all hover:border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Gross Profit</span>
          <span className="text-[11px] font-mono font-medium text-emerald-400/90">{grossMargin}% margin</span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-white tracking-tight">
            ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Revenue less product cost</p>
        </div>
      </div>

      {/* 4. Net Operating Income */}
      <div className="p-4 rounded-md bg-[#0d1017] border border-white/[0.06] flex flex-col justify-between transition-all hover:border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Net Profit</span>
          <span
            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isPositiveNet
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {netMargin}%
          </span>
        </div>
        <div className="mt-2">
          <div
            className={`text-xl font-bold font-mono tracking-tight ${
              isPositiveNet ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {operatingExpenses > 0 ? `After $${operatingExpenses.toFixed(2)} opex` : "Zero operating overhead"}
          </p>
        </div>
      </div>
    </div>
  );
};
