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
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

interface BalanceSheetVisualizerProps {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assetLines?: { name: string; amount: number }[];
  liabilityLines?: { name: string; amount: number }[];
  equityLines?: { name: string; amount: number }[];
  isLoading?: boolean;
  height?: number;
}

export const BalanceSheetVisualizer: React.FC<BalanceSheetVisualizerProps> = ({
  totalAssets = 0,
  totalLiabilities = 0,
  totalEquity = 0,
  assetLines = [],
  liabilityLines = [],
  equityLines = [],
  isLoading = false,
  height = 280,
}) => {
  const sumLiabEquity = roundNumber(totalLiabilities + totalEquity);
  const assetsRounded = roundNumber(totalAssets);
  const discrepancy = Math.abs(assetsRounded - sumLiabEquity);
  const isBalanced = discrepancy < 0.05;

  function roundNumber(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const chartData = [
    { name: "Assets", amount: assetsRounded, color: "#38bdf8", note: "Cash + AR + Inventory" },
    { name: "Liabilities", amount: totalLiabilities, color: "#fbbf24", note: "AP + Debt" },
    { name: "Equity", amount: totalEquity, color: "#c084fc", note: "Capital + Retained Earnings" },
    { name: "Liab + Equity", amount: sumLiabEquity, color: "#34d399", note: "Balanced Total" },
  ];

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <ChartContainer
      title="Capital & Balance Structure"
      subtitle="Visual representation of the fundamental accounting identity (Assets = Liabilities + Equity)"
      businessQuestion="What is the structural solvency of the company and does our ledger maintain mathematical equilibrium?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Identity Balanced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              <span>Discrepancy: ${discrepancy.toFixed(2)}</span>
            </div>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full justify-between gap-3">
        <div style={{ height: height - 75 }}>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] text-slate-400 mb-0.5">Total Assets</div>
            <div className="font-mono text-sm font-semibold text-white">
              ${assetsRounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] text-slate-400 mb-0.5">Total Liabilities</div>
            <div className="font-mono text-sm font-semibold text-slate-200">
              ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] text-slate-400 mb-0.5">Owner's Equity</div>
            <div className="font-mono text-sm font-semibold text-slate-200">
              ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] text-slate-400 mb-0.5">Equation Match</div>
            <div className="flex items-center gap-1 font-mono text-xs font-medium text-emerald-400 mt-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>A = L + E</span>
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};
