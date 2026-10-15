"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Truck,
  Wallet,
  BookOpen,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AccountingOverviewResponse } from "@/types";
import {
  FinancialKpiCard,
  ReportPeriodSelector,
  RevenueExpenseChart,
  ExpenseBreakdownChart,
  RevenueBreakdownChart,
  CashFlowChart,
  PeriodPreset,
} from "@/components/admin/accounting";
import { AdminPageHeader } from "@/components/admin/ui";

export default function AccountingOverviewPage() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingOverviewResponse | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize dates on first load
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    setDateFrom(firstDay);
    setDateTo(today);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchOverview();
    }
  }, [dateFrom, dateTo]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingOverview({
        period: "custom",
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(res);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load accounting overview.");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (start: string, end: string, preset: PeriodPreset) => {
    setPeriodPreset(preset);
    setDateFrom(start);
    setDateTo(end);
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
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
      <AdminPageHeader
        title="Accounting & Financial Command Center"
        description="Audited general ledger, automated sales accruals, customer receivables, supplier payables, and formal statements."
        badge="Double-Entry GAAP"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/accounting/reports"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Statements</span>
            </Link>
            <Link
              href="/admin/accounting/ledger"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>General Ledger</span>
            </Link>
            <Link
              href="/admin/accounting/receivables"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Dues</span>
            </Link>
            <Link
              href="/admin/accounting/payables"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Supplier Bills</span>
            </Link>
            <a
              href={adminApi.getAccountingExportUrl("trial_balance")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Trial Balance CSV</span>
            </a>
          </div>
        }
      />

      {/* Date Filter & Control Bar */}
      <ReportPeriodSelector
        startDate={dateFrom}
        endDate={dateTo}
        onPeriodChange={handlePeriodChange}
        onRefresh={fetchOverview}
        isRefreshing={loading}
      />

      {/* 8 Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title="Net Sales Revenue"
          value={kpis?.net_revenue ?? 0}
          variant="cyan"
          icon={<DollarSign className="w-4 h-4" />}
          subtitle={`Gross: $${(kpis?.gross_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          secondaryMetric={{
            label: "Discounts",
            value: `-$${(kpis?.discounts ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          }}
          href="/admin/accounting/reports"
        />

        <FinancialKpiCard
          title="Gross Profit & Margin"
          value={kpis?.gross_profit ?? 0}
          variant="emerald"
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle={`${kpis?.gross_margin_percent ?? 0}% Gross Margin`}
          secondaryMetric={{
            label: "FIFO COGS",
            value: `$${(kpis?.cogs ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          }}
          href="/admin/accounting/reports"
        />

        <FinancialKpiCard
          title="Operating Expenses"
          value={kpis?.operating_expenses ?? 0}
          variant="rose"
          icon={<Receipt className="w-4 h-4" />}
          subtitle="Class 6000 General Overhead"
          secondaryMetric={{
            label: "Categories",
            value: `${data?.expense_breakdown?.length ?? 0} Active`,
          }}
          href="/admin/expenses"
        />

        <FinancialKpiCard
          title="Net Operating Profit"
          value={kpis?.net_profit ?? 0}
          variant={(kpis?.net_profit ?? 0) >= 0 ? "emerald" : "rose"}
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle={`${kpis?.net_margin_percent ?? 0}% Net Margin`}
          secondaryMetric={{
            label: "Status",
            value: (kpis?.net_profit ?? 0) >= 0 ? "Profitable" : "Operating Loss",
          }}
          href="/admin/accounting/reports"
        />

        <FinancialKpiCard
          title="Customer Dues (A/R)"
          value={kpis?.accounts_receivable ?? 0}
          variant="cyan"
          icon={<Users className="w-4 h-4" />}
          subtitle="Uncollected sales receivables"
          secondaryMetric={{
            label: "Action",
            value: "Collect",
          }}
          href="/admin/accounting/receivables"
        />

        <FinancialKpiCard
          title="Supplier Dues (A/P)"
          value={kpis?.accounts_payable ?? 0}
          variant="amber"
          icon={<Truck className="w-4 h-4" />}
          subtitle="Unpaid vendor procurement"
          secondaryMetric={{
            label: "Action",
            value: "Disburse",
          }}
          href="/admin/accounting/payables"
        />

        <FinancialKpiCard
          title="Liquid Cash & Bank"
          value={kpis?.liquid_cash_and_bank ?? 0}
          variant="purple"
          icon={<Wallet className="w-4 h-4" />}
          subtitle="Cash drawers + Bank + MFS"
          secondaryMetric={{
            label: "Accounts",
            value: `${data?.bank_accounts?.length ?? 0} Active`,
          }}
          href="/admin/accounting/banking"
        />

        <FinancialKpiCard
          title="Inventory Asset (FIFO)"
          value={kpis?.inventory_valuation ?? 0}
          variant="default"
          icon={<Layers className="w-4 h-4" />}
          subtitle="Warehouse inventory valuation"
          secondaryMetric={{
            label: "Ledger",
            value: "Account 1200",
          }}
          href="/admin/inventory-valuation"
        />
      </div>

      {/* Row 1: Macro Trajectory & Category Cost Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RevenueExpenseChart
            data={data?.daily_trends || []}
            isLoading={loading}
            height={320}
          />
        </div>
        <div className="lg:col-span-5">
          <ExpenseBreakdownChart
            data={data?.expense_breakdown || []}
            isLoading={loading}
            height={320}
          />
        </div>
      </div>

      {/* Row 2: Realized Cash Flow Dynamics & Multi-Channel Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <CashFlowChart
            data={{
              inflows: kpis?.collected_in_period ?? (kpis?.net_revenue ?? 0),
              outflows: (kpis?.disbursed_in_period ?? 0) + (kpis?.operating_expenses ?? 0),
              net:
                (kpis?.collected_in_period ?? (kpis?.net_revenue ?? 0)) -
                ((kpis?.disbursed_in_period ?? 0) + (kpis?.operating_expenses ?? 0)),
            }}
            isLoading={loading}
            height={300}
          />
        </div>
        <div className="lg:col-span-6">
          <RevenueBreakdownChart
            data={data?.revenue_breakdown}
            isLoading={loading}
            height={300}
          />
        </div>
      </div>

      {/* Bank & Cash Accounts Snapshot */}
      <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Cash & Bank Accounts Register</h2>
          </div>
          <Link
            href="/admin/accounting/banking"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
          >
            Manage Accounts & Transfers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(data?.bank_accounts || []).map((account) => (
            <div
              key={account.id}
              className="p-4 rounded-md bg-[#161a26] border border-white/[0.06] flex flex-col justify-between gap-3 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">{account.account_name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {account.bank_name ? `${account.bank_name} • ${account.account_number || ""}` : "Physical Cash Drawer"}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    account.account_type === "cash"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : account.account_type === "bank"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  }`}
                >
                  {account.account_type}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">Current Balance:</span>
                <span className="text-base font-bold text-purple-300 font-mono">
                  ${account.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent General Ledger Journal Entries */}
      <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Recent Audited Journal Entries
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct double-entry ledger postings with balanced debit & credit validations
            </p>
          </div>
          <Link
            href="/admin/accounting/ledger"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            View Full General Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-2.5 font-semibold">Entry #</th>
                <th className="pb-2.5 font-semibold">Date</th>
                <th className="pb-2.5 font-semibold">Type</th>
                <th className="pb-2.5 font-semibold">Reference</th>
                <th className="pb-2.5 font-semibold">Narration</th>
                <th className="pb-2.5 font-semibold text-right">Debit ($)</th>
                <th className="pb-2.5 font-semibold text-right">Credit ($)</th>
                <th className="pb-2.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.recent_entries || []).map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
                const totalCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);
                return (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono font-bold text-cyan-400">{entry.entry_number}</td>
                    <td className="py-2.5 font-mono text-slate-300">{entry.entry_date}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                        {entry.reference_type || "Manual"}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">{entry.reference_number || "—"}</td>
                    <td className="py-2.5 text-slate-300 max-w-xs truncate">{entry.narration}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-200">
                      ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-200">
                      ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
