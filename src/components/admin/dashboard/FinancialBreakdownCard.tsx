"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { FinancialSummary } from "@/types";
import { 
  Calculator, 
  HelpCircle, 
  ChevronRight, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2,
  TrendingUp,
  Receipt
} from "lucide-react";

interface FinancialBreakdownCardProps {
  summary: FinancialSummary | null;
  isLoading?: boolean;
}

export const FinancialBreakdownCard: React.FC<FinancialBreakdownCardProps> = ({
  summary,
  isLoading = false,
}) => {
  const metrics = summary?.metrics || {
    gross_sales: 0,
    discounts: 0,
    refunds: 0,
    net_sales: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_percentage: 0,
    operating_expenses: 0,
    operating_profit: 0,
    net_margin_percentage: 0,
    total_orders: 0,
    avg_order_value: 0,
  };

  const rows = [
    {
      label: "Gross Sales Revenue",
      value: metrics.gross_sales,
      type: "positive",
      formula: "Total customer order receipts before promotional discounts or product returns.",
    },
    {
      label: "Less: Promotional Discounts",
      value: -metrics.discounts,
      type: "negative",
      formula: "Deductions applied via promo codes, store credits, and coupon redemptions.",
    },
    {
      label: "Less: Customer Refunds",
      value: -metrics.refunds,
      type: "negative",
      formula: "Total processed returns and refunded payments returned to buyers.",
    },
    {
      label: "Net Sales",
      value: metrics.net_sales,
      type: "subtotal",
      formula: "Net Sales = Gross Sales - Discounts - Refunds. The true top-line turnover.",
    },
    {
      label: "Less: Cost of Goods Sold (COGS)",
      value: -metrics.cogs,
      type: "negative",
      formula: "FIFO inventory acquisition costs directly expended to fulfill sold merchandise.",
    },
    {
      label: "Realized Gross Profit",
      value: metrics.gross_profit,
      type: "profit",
      badge: `${metrics.gross_margin_percentage.toFixed(1)}% Gross Margin`,
      formula: "Gross Profit = Net Sales - COGS. Margin = (Gross Profit / Net Sales) * 100.",
    },
    {
      label: "Less: Operating Outlays & Expenses",
      value: -metrics.operating_expenses,
      type: "negative",
      formula: "Operating expenses including shipping courier surcharges, staff salaries, server infrastructure, and office costs.",
    },
    {
      label: "Net Operating Profit (EBITDA)",
      value: metrics.operating_profit,
      type: "final",
      badge: `${metrics.net_margin_percentage.toFixed(1)}% Net Margin`,
      formula: "Operating Profit = Gross Profit - Operating Expenses. True net yield of the commercial operation.",
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#272B35]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Accounting & Financial Visibility
            </h2>
            <div
              className="group relative cursor-help"
              title="Audited general ledger statement tracking sales deductions, inventory cost layers, and operating margins."
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#929BAD]" />
            </div>
          </div>
          <p className="text-xs text-[#929BAD]">
            Deterministic profit & loss statement for the selected date window
          </p>
        </div>

        <Link
          href="/admin/accounting"
          className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>General Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Structured P&L Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-[#272B35]">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[#929BAD]">
                  <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Computing financial statements...</span>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isHighlight = row.type === "profit" || row.type === "final" || row.type === "subtotal";
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.type === "final"
                        ? "bg-[#211B32] border-l-2 border-[#A78BFA] font-bold"
                        : row.type === "profit"
                        ? "bg-[#171B26] font-semibold"
                        : row.type === "subtotal"
                        ? "bg-[#171B26]/60 font-semibold"
                        : "hover:bg-[#171B26]/40"
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={isHighlight ? "text-white" : "text-[#929BAD]"}>
                          {row.label}
                        </span>
                        <div className="group/tip relative cursor-help" title={row.formula}>
                          <HelpCircle className="w-3 h-3 text-[#6B7280] hover:text-[#929BAD]" />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {row.badge && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          row.value >= 0
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {row.badge}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={
                        row.type === "final"
                          ? row.value >= 0 ? "text-emerald-400 text-sm" : "text-rose-400 text-sm"
                          : row.type === "profit"
                          ? "text-white"
                          : row.type === "negative"
                          ? "text-rose-400"
                          : "text-white"
                      }>
                        {formatPrice(row.value)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expense Categories Breakdown if present */}
      {summary?.expense_categories && summary.expense_categories.length > 0 && (
        <div className="pt-3 border-t border-[#272B35]">
          <span className="text-[11px] font-semibold text-[#929BAD] uppercase tracking-wider block mb-2">
            Top Operating Expense Categories:
          </span>
          <div className="flex flex-wrap gap-2">
            {summary.expense_categories.map((cat) => (
              <div
                key={cat.category_id}
                className="px-2.5 py-1 rounded-lg bg-[#171B26] border border-[#272B35] text-xs flex items-center gap-1.5"
              >
                <span className="text-[#929BAD] font-medium">{cat.category_name}:</span>
                <span className="font-mono font-bold text-white">{formatPrice(cat.total_spent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer link to accounting */}
      <div className="pt-2 flex items-center justify-between text-xs text-[#929BAD]">
        <span>Standard FIFO Inventory & GAAP Accrual Model</span>
        <Link
          href="/admin/expenses"
          className="font-medium text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
        >
          <span>Record New Expense</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
