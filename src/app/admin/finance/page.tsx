"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar, 
  Filter, 
  PieChart, 
  Layers, 
  Truck, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  BarChart3,
  Percent,
  Coins
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { FinancialSummary, ProductProfitabilityItem, VendorAnalyticsItem } from "@/types";

export default function AdminFinancePage() {
  const [period, setPeriod] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [productEconomics, setProductEconomics] = useState<ProductProfitabilityItem[]>([]);
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalyticsItem[]>([]);
  const [activeTab, setActiveTab] = useState<"pnl" | "products" | "vendors">("pnl");

  // Drilldown Modal
  const [drilldownModal, setDrilldownModal] = useState(false);
  const [drilldownMetric, setDrilldownMetric] = useState<string>("sales");
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, [period, customFrom, customTo]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const params = {
        period: period !== "custom" ? period : "custom",
        date_from: period === "custom" ? customFrom : undefined,
        date_to: period === "custom" ? customTo : undefined,
      };

      const [sumRes, prodRes, venRes] = await Promise.all([
        adminApi.getFinanceSummary(params),
        adminApi.getProductProfitability(params),
        adminApi.getVendorAnalytics(params),
      ]);

      setSummary(sumRes);
      setProductEconomics(prodRes);
      setVendorAnalytics(venRes);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load financial metrics.");
    } finally {
      setLoading(false);
    }
  };

  const openDrilldown = async (metric: string) => {
    setDrilldownMetric(metric);
    setDrilldownModal(true);
    setDrilldownLoading(true);
    try {
      const res = await adminApi.getFinanceDrilldown({
        metric,
        period: period !== "custom" ? period : "custom",
        date_from: period === "custom" ? customFrom : undefined,
        date_to: period === "custom" ? customTo : undefined,
      });
      setDrilldownData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleExport = (type: "pnl" | "sales") => {
    const fromParam = period === "custom" && customFrom ? `&date_from=${customFrom}` : "";
    const toParam = period === "custom" && customTo ? `&date_to=${customTo}` : "";
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/admin/finance/export?type=${type}&period=${period}${fromParam}${toParam}`;
    window.open(url, "_blank");
  };

  const m = summary?.metrics;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-md text-sm font-semibold flex items-center gap-3 border shadow-lg animate-in fade-in slide-in-from-top-2 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header with Date Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#0d0f18] p-5 rounded-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Executive Profitability & P&L Engine</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              GAAP-compliant net revenue, FIFO COGS layer calculations, gross margins, and traceable operational net profit.
            </p>
          </div>
        </div>

        {/* Period Selector & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#151824] p-1 rounded-md border border-white/10 text-xs font-bold">
            {[
              { id: "today", label: "Today" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "this_quarter", label: "This Quarter" },
              { id: "this_year", label: "Year-to-Date" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md transition ${
                  period === p.id 
                    ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("pnl")}
              className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#A78BFA]" />
              Export P&L
            </button>
            <button
              onClick={() => handleExport("sales")}
              className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("pnl")}
          className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
            activeTab === "pnl"
              ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Executive Income Statement (P&L)
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
            activeTab === "products"
              ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" />
          Product Profitability & Margins
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
            activeTab === "vendors"
              ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Truck className="w-4 h-4" />
          Vendor Spend & Unit Costs
        </button>
      </div>

      {/* TAB 1: Executive Income Statement (P&L) */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          {/* Key Financial KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* 1. Net Sales Revenue */}
            <div 
              onClick={() => openDrilldown("sales")}
              className="bg-[#0d0f18] p-5 rounded-md border border-white/10 hover:border-emerald-500/40 cursor-pointer transition space-y-2 group shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Net Sales Revenue</span>
                <span className="text-[10px] text-emerald-400 group-hover:underline flex items-center gap-0.5">
                  Drill Down <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                ${m?.net_sales?.toFixed(2) || "0.00"}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span>Gross: ${m?.gross_sales?.toFixed(2) || "0.00"}</span>
                <span>Discounts: -${m?.discounts?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* 2. Cost of Goods Sold (FIFO) */}
            <div 
              onClick={() => openDrilldown("cogs")}
              className="bg-[#0d0f18] p-5 rounded-md border border-white/10 hover:border-[#A78BFA]/40 cursor-pointer transition space-y-2 group shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>FIFO Cost of Goods Sold</span>
                <span className="text-[10px] text-[#A78BFA] group-hover:underline flex items-center gap-0.5">
                  Drill Down <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-3xl font-black text-[#A78BFA] font-mono">
                ${m?.cogs?.toFixed(2) || "0.00"}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span>Gross Profit: ${m?.gross_profit?.toFixed(2) || "0.00"}</span>
                <span className="text-[#A78BFA] font-bold">{m?.gross_margin_percentage || 0}% Margin</span>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div 
              onClick={() => openDrilldown("expenses")}
              className="bg-[#0d0f18] p-5 rounded-md border border-white/10 hover:border-rose-500/40 cursor-pointer transition space-y-2 group shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Operating Overhead</span>
                <span className="text-[10px] text-rose-400 group-hover:underline flex items-center gap-0.5">
                  Drill Down <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                ${m?.operating_expenses?.toFixed(2) || "0.00"}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span>Orders: {m?.total_orders || 0}</span>
                <span>AOV: ${m?.avg_order_value?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* 4. Net Operating Profit */}
            <div className="bg-[#0d0f18] p-5 rounded-md border border-white/10 space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Net Operating Profit</span>
                <span className={`text-xs font-black font-mono ${
                  (m?.operating_profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {m?.net_margin_percentage || 0}% NET
                </span>
              </div>
              <div className={`text-3xl font-black font-mono ${
                (m?.operating_profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                ${m?.operating_profit?.toFixed(2) || "0.00"}
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                Gross Profit − Operating Expenses
              </div>
            </div>
          </div>

          {/* Income Statement Waterfall Table */}
          <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 bg-[#151824] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
                Traceable Income Statement Breakdown
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {summary?.period?.from.split(" ")[0]} to {summary?.period?.to.split(" ")[0]}
              </span>
            </div>

            <div className="divide-y divide-white/5 text-xs">
              {/* Gross Sales */}
              <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div>
                  <span className="font-bold text-white block">1. Gross Sales Revenue</span>
                  <span className="text-[10px] text-slate-400">Total list price volume across online and in-store checkouts</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">${m?.gross_sales?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Discounts */}
              <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div>
                  <span className="font-bold text-slate-300 block">Less: Discounts & Coupons Applied</span>
                  <span className="text-[10px] text-slate-400">Promotional vouchers and register line discounts</span>
                </div>
                <span className="text-sm font-bold font-mono text-rose-400">-${m?.discounts?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Refunds */}
              <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div>
                  <span className="font-bold text-slate-300 block">Less: Returns & Order Refunds</span>
                  <span className="text-[10px] text-slate-400">Customer refunds issued in period</span>
                </div>
                <span className="text-sm font-bold font-mono text-rose-400">-${m?.refunds?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Net Sales */}
              <div className="p-4 flex items-center justify-between bg-emerald-500/[0.03] font-bold">
                <div>
                  <span className="text-emerald-300 text-sm block">= Net Sales Revenue</span>
                  <span className="text-[10px] text-slate-400 font-normal">Realized revenue after discounts and refunds</span>
                </div>
                <span className="text-base font-black font-mono text-emerald-400">${m?.net_sales?.toFixed(2) || "0.00"}</span>
              </div>

              {/* COGS */}
              <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div>
                  <span className="font-bold text-slate-300 block">Less: Cost of Goods Sold (FIFO Acquisition Cost)</span>
                  <span className="text-[10px] text-slate-400">Exact procurement layer cost of sold units (excl. unsold inventory)</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#A78BFA]">-${m?.cogs?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Gross Profit */}
              <div className="p-4 flex items-center justify-between bg-[#211B32]/40 font-bold">
                <div>
                  <span className="text-[#A78BFA] text-sm block">= Gross Profit</span>
                  <span className="text-[10px] text-slate-400 font-normal">Gross Margin: {m?.gross_margin_percentage || 0}%</span>
                </div>
                <span className="text-base font-black font-mono text-[#A78BFA]">${m?.gross_profit?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Operating Expenses */}
              <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div>
                  <span className="font-bold text-slate-300 block">Less: Operating Expenses (OPEX)</span>
                  <span className="text-[10px] text-slate-400">Marketing, salaries, rent, utilities, server hosting</span>
                </div>
                <span className="text-sm font-bold font-mono text-rose-400">-${m?.operating_expenses?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Net Profit */}
              <div className="p-4 flex items-center justify-between bg-white/[0.04] font-black">
                <div>
                  <span className="text-white text-base block">= Operating / Net Profit</span>
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">Net Margin: {m?.net_margin_percentage || 0}%</span>
                </div>
                <span className={`text-lg font-black font-mono ${
                  (m?.operating_profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  ${m?.operating_profit?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Sales Channels & Expense Categories Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales Channel Economics */}
            <div className="bg-[#0d0f18] p-5 rounded-md border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#A78BFA]" />
                Channel Contribution
              </h4>

              <div className="space-y-3 text-xs">
                <div className="bg-[#151824] p-3.5 rounded-md border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Online eCommerce Storefront</span>
                    <span className="text-[10px] text-slate-400">{summary?.channels?.online?.orders_count || 0} orders</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    ${summary?.channels?.online?.sales?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="bg-[#151824] p-3.5 rounded-md border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">In-Store POS Retail Terminal</span>
                    <span className="text-[10px] text-slate-400">{summary?.channels?.pos?.orders_count || 0} checkout sales</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${summary?.channels?.pos?.sales?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expense Distribution */}
            <div className="bg-[#0d0f18] p-5 rounded-md border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-rose-400" />
                Expense Distribution by Category
              </h4>

              <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                {summary?.expense_categories?.map(ec => (
                  <div key={ec.category_id} className="bg-[#151824] p-2.5 rounded-md border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{ec.category_name}</span>
                      <span className="text-[10px] text-slate-400">{ec.count} expense vouchers</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      ${ec.total_spent.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Product Profitability & Margins */}
      {activeTab === "products" && (
        <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 bg-[#151824] border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A78BFA]" />
              Product-Level Gross Margins & Profit Contribution
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Units Sold</th>
                  <th className="py-3.5 px-4">Net Revenue</th>
                  <th className="py-3.5 px-4">FIFO COGS</th>
                  <th className="py-3.5 px-4">Gross Profit</th>
                  <th className="py-3.5 px-4">Gross Margin %</th>
                  <th className="py-3.5 px-4">Stock on Hand</th>
                  <th className="py-3.5 px-4">Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productEconomics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No product sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  productEconomics.map(p => (
                    <tr key={p.product_id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | {p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {p.units_sold} units
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ${p.net_revenue.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A78BFA]">
                        ${p.cogs.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        +${p.gross_profit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          p.gross_margin_percentage >= 40 
                            ? "text-emerald-400 bg-emerald-500/10" 
                            : p.gross_margin_percentage >= 20 
                            ? "text-[#A78BFA] bg-[#211B32]" 
                            : "text-rose-400 bg-rose-500/10"
                        }`}>
                          {p.gross_margin_percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {p.stock_on_hand}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        ${p.inventory_value.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Vendor Spend & Analytics */}
      {activeTab === "vendors" && (
        <div className="bg-[#0d0f18] rounded-md border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 bg-[#151824] border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#A78BFA]" />
              Vendor Procurement Volume & Unit Economics
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151824] text-slate-400 border-b border-white/10 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Supplier Organization</th>
                  <th className="py-3.5 px-4">Supplier Code</th>
                  <th className="py-3.5 px-4">Total Procurement Spend</th>
                  <th className="py-3.5 px-4">POs Count</th>
                  <th className="py-3.5 px-4">Units Sourced</th>
                  <th className="py-3.5 px-4">Average Unit Cost</th>
                  <th className="py-3.5 px-4">Contracted Catalog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vendorAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No procurement data recorded with vendors yet.
                    </td>
                  </tr>
                ) : (
                  vendorAnalytics.map(v => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {v.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A78BFA] font-bold">
                        {v.vendor_code}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                        ${v.total_spend.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {v.purchase_orders_count} POs
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {v.units_purchased} units
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        ${v.avg_unit_cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {v.products_supplied_count} items
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: 100% Traceable Metric Drilldown */}
      {drilldownModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-4xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <Eye className="w-5 h-5" />
                <h3 className="text-base font-bold text-white capitalize">
                  {drilldownMetric === "sales" ? "Sales Revenue Traceability" : drilldownMetric === "cogs" ? "FIFO Cost Layer Audit Traceability" : "Operating Expense Ledger Traceability"}
                </h3>
              </div>
              <button onClick={() => setDrilldownModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {drilldownLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Drilling down into individual ledger entries...
              </div>
            ) : !drilldownData || drilldownData.data?.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No individual records found for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {drilldownMetric === "expenses" ? (
                  <div className="bg-[#151824] rounded-md border border-white/10 divide-y divide-white/5">
                    {drilldownData.data.map((exp: any) => (
                      <div key={exp.id} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{exp.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {exp.expense_number} | {exp.category?.name} | {exp.expense_date}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          -${parseFloat(exp.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#151824] rounded-md border border-white/10 divide-y divide-white/5">
                    {drilldownData.data.map((ord: any) => (
                      <div key={ord.id} className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white font-mono">{ord.order_number}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              Source: <strong className="uppercase text-[#A78BFA]">{ord.order_source}</strong> | Customer: {ord.customer_name}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-emerald-400 block">${parseFloat(ord.total_amount).toFixed(2)}</span>
                            <span className="text-[10px] text-[#A78BFA]">COGS: ${parseFloat(ord.cogs_amount).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Order Item Cost Layers */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="bg-[#0b0d14] p-2.5 rounded-md border border-white/5 space-y-1">
                            {ord.items.map((it: any) => (
                              <div key={it.id} className="flex justify-between text-[11px] text-slate-300">
                                <span>{it.quantity}x {it.product_name}</span>
                                <span className="font-mono text-slate-400">
                                  Rev: ${parseFloat(it.total_price).toFixed(2)} | FIFO COGS: ${parseFloat(it.cogs_total).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
