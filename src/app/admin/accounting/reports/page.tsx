"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  DollarSign,
  Layers,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AccountingReportsResponse } from "@/types";
import {
  ReportPeriodSelector,
  PeriodPreset,
  BalanceSheetVisualizer,
  CashFlowChart,
  PnlSummaryVisualizer,
} from "@/components/admin/accounting";
import { AdminPageHeader } from "@/components/admin/ui";

export default function FinancialReportsPage() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingReportsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"pnl" | "balance_sheet" | "cash_flow" | "trial_balance">("pnl");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    setDateFrom(firstDay);
    setDateTo(today);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReports();
    }
  }, [dateFrom, dateTo]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingReports({
        period: "custom",
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(res);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load financial statements.");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (start: string, end: string, preset: PeriodPreset) => {
    setPeriodPreset(preset);
    setDateFrom(start);
    setDateTo(end);
  };

  const handlePrint = () => {
    window.print();
  };

  const pnl = data?.income_statement;
  const bs = data?.balance_sheet;
  const cf = data?.cash_flow;
  const tb = data?.trial_balance;

  return (
    <div className="space-y-6 pb-16 print:p-0 print:bg-white print:text-black">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Admin Page Header */}
      <div className="print:hidden">
        <AdminPageHeader
          title="Financial Reports"
          description="Standard Income Statement (P&L), Balance Sheet, Direct Cash Flow, and Certified Trial Balance."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print</span>
              </button>
              <a
                href={adminApi.getAccountingExportUrl("trial_balance")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-medium transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </a>
            </div>
          }
        />
      </div>

      {/* Date Filter & Control Bar */}
      <div className="print:hidden">
        <ReportPeriodSelector
          startDate={dateFrom}
          endDate={dateTo}
          onPeriodChange={handlePeriodChange}
          onRefresh={fetchReports}
          isRefreshing={loading}
        />
      </div>

      {/* Statement Navigation Tabs - Minimal Pill Bar */}
      <div className="flex items-center print:hidden">
        <div className="inline-flex p-1 rounded-md bg-white/[0.03] border border-white/[0.08] gap-1 overflow-x-auto">
          {[
            { id: "pnl", label: "Income Statement", icon: TrendingUp },
            { id: "balance_sheet", label: "Balance Sheet", icon: Scale },
            { id: "cash_flow", label: "Cash Flow", icon: DollarSign },
            { id: "trial_balance", label: "Trial Balance", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white/10 text-white font-semibold border border-white/10 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. PROFIT & LOSS STATEMENT (INCOME STATEMENT)             */}
      {/* ========================================================= */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <div className="print:hidden">
            <PnlSummaryVisualizer
              totalRevenue={pnl?.total_revenue ?? 0}
              totalCogs={pnl?.total_cogs ?? 0}
              grossProfit={pnl?.gross_profit ?? 0}
              grossMargin={pnl?.gross_margin_percent ?? 0}
              operatingExpenses={pnl?.total_expenses ?? 0}
              netIncome={pnl?.net_income ?? 0}
              netMargin={pnl?.net_margin_percent ?? 0}
              isLoading={loading}
            />
          </div>

          <div className="p-6 rounded-md bg-[#0d1017] border border-white/[0.06] space-y-6 shadow-sm print:border-none print:p-0 print:bg-white">
            {/* Statement Header */}
            <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight print:text-black">
                  Statement of Profit & Loss
                </h2>
                <p className="text-xs text-slate-400 print:text-black/70 mt-0.5">
                  Period: {data?.period.from} to {data?.period.to} • Accrual Basis
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Net Operating Income:</span>
                <span
                  className={`text-lg font-bold font-mono px-2.5 py-1 rounded-md ${
                    (pnl?.net_income ?? 0) >= 0
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  ${(pnl?.net_income ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Financial Ledger Sections */}
            <div className="space-y-6 text-xs">
              {/* 1. Operating Revenue */}
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                  <span>Operating Revenue (Class 4000)</span>
                  <div className="flex items-center gap-8">
                    <span className="w-16 text-right">% Rev</span>
                    <span className="w-24 text-right">Amount ($)</span>
                  </div>
                </div>
                {(pnl?.revenue_lines || []).map((row) => {
                  const pct = (pnl?.total_revenue ?? 0) > 0 ? ((row.amount / (pnl?.total_revenue ?? 1)) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={row.code} className="flex items-center justify-between py-2 text-slate-300 hover:bg-white/[0.02] px-2 rounded-md transition-colors">
                      <span className="font-mono flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                        <span className="text-slate-200">{row.name}</span>
                      </span>
                      <div className="flex items-center gap-8 font-mono">
                        <span className="w-16 text-right text-slate-500">{pct}%</span>
                        <span className="w-24 text-right font-semibold text-slate-100">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between py-2.5 border-t border-white/[0.08] font-semibold text-white bg-white/[0.02] px-3 rounded-md">
                  <span>Total Operating Revenue</span>
                  <div className="flex items-center gap-8 font-mono">
                    <span className="w-16 text-right text-slate-400">100%</span>
                    <span className="w-24 text-right font-bold text-white text-sm">
                      ${(pnl?.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Cost of Goods Sold */}
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                  <span>Cost of Goods Sold (Class 5000)</span>
                  <div className="flex items-center gap-8">
                    <span className="w-16 text-right">% Rev</span>
                    <span className="w-24 text-right">Amount ($)</span>
                  </div>
                </div>
                {(pnl?.cogs_lines || []).map((row) => {
                  const pct = (pnl?.total_revenue ?? 0) > 0 ? ((row.amount / (pnl?.total_revenue ?? 1)) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={row.code} className="flex items-center justify-between py-2 text-slate-300 hover:bg-white/[0.02] px-2 rounded-md transition-colors">
                      <span className="font-mono flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                        <span className="text-slate-200">{row.name}</span>
                      </span>
                      <div className="flex items-center gap-8 font-mono">
                        <span className="w-16 text-right text-slate-500">{pct}%</span>
                        <span className="w-24 text-right font-semibold text-slate-100">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between py-2.5 border-t border-white/[0.08] font-semibold text-white bg-white/[0.02] px-3 rounded-md">
                  <span>Total Cost of Goods Sold (FIFO)</span>
                  <div className="flex items-center gap-8 font-mono">
                    <span className="w-16 text-right text-slate-400">
                      {pnl?.total_revenue ? (((pnl?.total_cogs ?? 0) / pnl.total_revenue) * 100).toFixed(1) : "0.0"}%
                    </span>
                    <span className="w-24 text-right font-bold text-slate-200 text-sm">
                      ${(pnl?.total_cogs ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gross Profit Milestone */}
              <div className="p-3.5 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Gross Operating Profit</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                    {pnl?.gross_margin_percent ?? 0}% Margin
                  </span>
                </div>
                <span className="text-base font-bold text-white font-mono">
                  ${(pnl?.gross_profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* 3. Operating Expenses */}
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                  <span>Operating Expenses (Class 6000)</span>
                  <div className="flex items-center gap-8">
                    <span className="w-16 text-right">% Rev</span>
                    <span className="w-24 text-right">Amount ($)</span>
                  </div>
                </div>
                {(pnl?.expense_lines && pnl.expense_lines.length > 0) ? (
                  pnl.expense_lines.map((row) => {
                    const pct = (pnl?.total_revenue ?? 0) > 0 ? ((row.amount / (pnl?.total_revenue ?? 1)) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={row.code} className="flex items-center justify-between py-2 text-slate-300 hover:bg-white/[0.02] px-2 rounded-md transition-colors">
                        <span className="font-mono flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                          <span className="text-slate-200">{row.name}</span>
                        </span>
                        <div className="flex items-center gap-8 font-mono">
                          <span className="w-16 text-right text-slate-500">{pct}%</span>
                          <span className="w-24 text-right font-semibold text-slate-100">
                            ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                    No operating expenses recorded for this period.
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5 border-t border-white/[0.08] font-semibold text-white bg-white/[0.02] px-3 rounded-md">
                  <span>Total Operating Expenses</span>
                  <div className="flex items-center gap-8 font-mono">
                    <span className="w-16 text-right text-slate-400">0.0%</span>
                    <span className="w-24 text-right font-bold text-slate-200 text-sm">
                      ${(pnl?.total_expenses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Operating Income Summary Block */}
              <div className="p-4 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white">
                    Net Operating Income
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Gross profit less operating expenditures
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold font-mono ${
                      (pnl?.net_income ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    ${(pnl?.net_income ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {pnl?.net_margin_percent ?? 0}% Net Return
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}




      {/* ========================================================= */}
      {/* 2. BALANCE SHEET                                          */}
      {/* ========================================================= */}
      {activeTab === "balance_sheet" && (
        <div className="space-y-6">
          {/* Visual Balance Sheet Allocation */}
          <div className="print:hidden">
            <BalanceSheetVisualizer
              totalAssets={bs?.total_assets ?? 0}
              totalLiabilities={bs?.total_liabilities ?? 0}
              totalEquity={bs?.total_equity ?? 0}
              isLoading={loading}
              height={260}
            />
          </div>

          <div className="p-6 rounded-md bg-[#0d1017] border border-white/[0.06] space-y-6 shadow-sm print:border-none print:p-0 print:bg-white">
            <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight print:text-black">
                  Statement of Financial Position
                </h2>
                <p className="text-xs text-slate-400 print:text-black/70 mt-0.5">
                  As of {bs?.as_of_date} • Accrual Basis
                </p>
              </div>
              <div>
                {bs?.is_balanced ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Assets = Liabilities + Equity (Balanced)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Imbalance Detected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ASSETS COLUMN */}
              <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span>Assets (Class 1000)</span>
                  <span className="font-mono text-white text-sm font-bold">
                    ${(bs?.total_assets ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-1">
                  {(bs?.assets || []).map((row) => (
                    <div key={row.code} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                      <span className="font-mono text-slate-300 flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                        <span className="text-slate-200">{row.name}</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-100">
                        ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div className="space-y-4">
                {/* Liabilities */}
                <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span>Liabilities (Class 2000)</span>
                    <span className="font-mono text-slate-200 text-sm font-bold">
                      ${(bs?.total_liabilities ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(bs?.liabilities || []).map((row) => (
                      <div key={row.code} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                        <span className="font-mono text-slate-300 flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                          <span className="text-slate-200">{row.name}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-100">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equity */}
                <div className="p-5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span>Equity (Class 3000)</span>
                    <span className="font-mono text-slate-200 text-sm font-bold">
                      ${(bs?.total_equity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(bs?.equity || []).map((row) => (
                      <div key={row.code} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                        <span className="font-mono text-slate-300 flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">[{row.code}]</span>
                          <span className="text-slate-200">{row.name}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-100">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Liabilities & Equity Check */}
                <div className="p-3.5 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs font-semibold text-white">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono text-sm font-bold text-white">
                    ${(bs?.total_liabilities_and_equity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CASH FLOW STATEMENT                                    */}
      {/* ========================================================= */}
      {activeTab === "cash_flow" && (
        <div className="space-y-6">
          {/* Visual Cash Flow Dynamics */}
          <div className="print:hidden">
            <CashFlowChart
              data={{
                inflows: cf?.cash_from_customers ?? 0,
                outflows: (cf?.cash_paid_suppliers ?? 0) + (cf?.cash_paid_expenses ?? 0),
                net: cf?.net_operating_cash_flow ?? 0,
              }}
              isLoading={loading}
              height={260}
            />
          </div>

          <div className="p-6 rounded-md bg-[#0d1017] border border-white/[0.06] space-y-6 shadow-sm print:border-none print:p-0 print:bg-white">
            <div className="border-b border-white/[0.06] pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight print:text-black">
                Statement of Cash Flows
              </h2>
              <p className="text-xs text-slate-400 print:text-black/70 mt-0.5">
                Direct Method • Period: {data?.period.from} to {data?.period.to}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 text-xs text-slate-300 border-b border-white/[0.06]">
                <span className="text-slate-400">Opening Liquid Reserves</span>
                <span className="font-mono font-semibold text-white">
                  ${(cf?.opening_cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider pt-2">
                Operating Activities
              </div>
              <div className="space-y-1.5 pl-2">
                <div className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                  <span className="text-slate-300">Customer Receipts (Sales & Collections)</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    +${(cf?.cash_from_customers ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                  <span className="text-slate-300">Supplier Disbursements (Procurement & Payables)</span>
                  <span className="font-mono font-semibold text-rose-400">
                    -${(cf?.cash_paid_suppliers ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-white/[0.02] rounded-md transition-colors">
                  <span className="text-slate-300">Operating Expenses Paid (OPEX & Services)</span>
                  <span className="font-mono font-semibold text-rose-400">
                    -${(cf?.cash_paid_expenses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/[0.08] text-xs font-semibold text-white bg-white/[0.02] px-3 rounded-md">
                <span>Net Operating Cash Flow</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    (cf?.net_operating_cash_flow ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  ${(cf?.net_operating_cash_flow ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-4 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-between mt-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Closing Cash & Bank Balance
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                    Opening reserves plus net operating cash flow
                  </span>
                </div>
                <span className="text-xl font-bold text-white font-mono">
                  ${(cf?.closing_cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CERTIFIED TRIAL BALANCE                                */}
      {/* ========================================================= */}
      {activeTab === "trial_balance" && (
        <div className="p-6 rounded-md bg-[#0d1017] border border-white/[0.06] space-y-6 shadow-sm print:border-none print:p-0 print:bg-white">
          <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight print:text-black">
                Certified General Ledger Trial Balance
              </h2>
              <p className="text-xs text-slate-400 print:text-black/70 mt-0.5">
                Chart of Accounts debit and credit reconciliation
              </p>
            </div>
            <div>
              {tb?.is_balanced ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Debits = Credits (Balanced)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Variance Detected</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Account Name</th>
                  <th className="pb-3 font-medium">Classification</th>
                  <th className="pb-3 font-medium text-right">Ending Debit ($)</th>
                  <th className="pb-3 font-medium text-right">Ending Credit ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(tb?.accounts || []).map((acc) => (
                  <tr key={acc.code} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono text-slate-400">{acc.code}</td>
                    <td className="py-2.5 font-medium text-slate-200">{acc.name}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-white/[0.03] border border-white/[0.06] text-slate-400">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-slate-200">
                      {acc.ending_debit > 0
                        ? `$${acc.ending_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-slate-200">
                      {acc.ending_credit > 0
                        ? `$${acc.ending_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.1] font-mono text-xs font-bold text-white bg-white/[0.02]">
                  <td colSpan={3} className="py-3 px-2 text-slate-300 uppercase tracking-wider">
                    Grand Total Trial Balance:
                  </td>
                  <td className="py-3 text-right text-white font-bold text-sm">
                    ${(tb?.total_debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-white font-bold text-sm">
                    ${(tb?.total_credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

