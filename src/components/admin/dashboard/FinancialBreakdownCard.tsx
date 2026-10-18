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
    <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#111827] tracking-tight">
              Accounting & Financial Visibility
            </h2>
            <div
              className="group relative cursor-help"
              title="Audited general ledger statement tracking sales deductions, inventory cost layers, and operating margins."
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#4B5563]" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">
            Deterministic profit & loss statement for the selected date window
          </p>
        </div>

        <Link
          href="/admin/accounting"
          className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>General Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Structured P&L Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[#6B7280]">
                  <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                        ? "bg-emerald-50/40 font-bold"
                        : row.type === "profit"
                        ? "bg-slate-50/70 font-semibold"
                        : row.type === "subtotal"
                        ? "bg-slate-50/40 font-semibold"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={isHighlight ? "text-[#111827]" : "text-[#4B5563]"}>
                          {row.label}
                        </span>
                        <div className="group/tip relative cursor-help" title={row.formula}>
                          <HelpCircle className="w-3 h-3 text-[#9CA3AF] hover:text-[#4B5563]" />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {row.badge && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          row.value >= 0
                            ? "bg-emerald-50 text-[#009B55] border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {row.badge}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={
                        row.type === "final"
                          ? row.value >= 0 ? "text-[#009B55] text-sm" : "text-rose-600 text-sm"
                          : row.type === "profit"
                          ? "text-[#111827]"
                          : row.type === "negative"
                          ? "text-rose-600"
                          : "text-[#111827]"
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
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-2">
            Top Operating Expense Categories:
          </span>
          <div className="flex flex-wrap gap-2">
            {summary.expense_categories.map((cat) => (
              <div
                key={cat.category_id}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
              >
                <span className="text-[#4B5563] font-medium">{cat.category_name}:</span>
                <span className="font-mono font-bold text-[#111827]">{formatPrice(cat.total_spent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer link to accounting */}
      <div className="pt-2 flex items-center justify-between text-xs text-[#6B7280]">
        <span>Standard FIFO Inventory & GAAP Accrual Model</span>
        <Link
          href="/admin/expenses"
          className="font-medium text-[#009B55] hover:text-[#008247] flex items-center gap-1"
        >
          <span>Record New Expense</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
