"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { FinancialTooltip } from "./FinancialTooltip";
import { ChartEmptyState } from "./ChartEmptyState";

interface ExpenseCategoryItem {
  account_code: string;
  account_name: string;
  total_amount: number;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseCategoryItem[];
  isLoading?: boolean;
  height?: number;
}

const PALETTE = [
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#64748b", // slate
];

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  data = [],
  isLoading = false,
  height = 300,
}) => {
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  const validData = data
    .filter((item) => Number(item.total_amount) > 0)
    .map((item) => ({
      name: item.account_name || `Account ${item.account_code}`,
      code: item.account_code,
      amount: Number(item.total_amount),
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpense = validData.reduce((acc, curr) => acc + curr.amount, 0);

  const dataWithShare = validData.map((item, idx) => ({
    ...item,
    share: totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : "0",
    color: PALETTE[idx % PALETTE.length],
  }));

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <ChartContainer
      title="Expense Distribution by Category"
      subtitle="Ranked operational outlays across chart of accounts"
      businessQuestion="Where is operational cash flowing most heavily, and which department or overhead line drives costs?"
      isLoading={isLoading}
      height={height}
      action={
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Total: ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center rounded-md bg-slate-800/80 p-0.5 border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`px-2 py-1 rounded-md transition-all ${
                chartType === "bar" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Ranked
            </button>
            <button
              type="button"
              onClick={() => setChartType("donut")}
              className={`px-2 py-1 rounded-md transition-all ${
                chartType === "donut" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Donut
            </button>
          </div>
        </div>
      }
    >
      {!validData.length ? (
        <ChartEmptyState
          title="No Operating Expenses"
          message="No operational expense lines have been logged in the selected accounting period."
          height={height}
        />
      ) : chartType === "bar" ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={dataWithShare}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110}
              tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 13)}…` : val)}
            />
            <Tooltip
              content={
                <FinancialTooltip
                  formatter={(val, name) =>
                    `$${Number(val).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  }
                />
              }
            />
            <Bar dataKey="amount" name="Expense Amount" radius={[0, 6, 6, 0]}>
              {dataWithShare.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-full py-2">
          <div className="h-[240px] w-[240px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithShare}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {dataWithShare.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 max-h-[240px] overflow-y-auto pr-2 w-full text-xs">
            {dataWithShare.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-1.5 rounded-md bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate text-slate-300">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-slate-400">{cat.share}%</span>
                  <span className="font-medium text-white">${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartContainer>
  );
};
