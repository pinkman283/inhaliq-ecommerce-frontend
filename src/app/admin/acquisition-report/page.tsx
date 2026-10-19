"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  FileText, 
  ShoppingBag, 
  BadgeDollarSign, 
  Percent, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  ExternalLink, 
  Eye, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { adminApi } from "@/lib/adminApi";
import { DetailedAcquisitionReportData } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function AcquisitionReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailedAcquisitionReportData | null>(null);
  
  // Filter states
  const [orderStatus, setOrderStatus] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("7d");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Chart view mode: "funnel" vs "revenue"
  const [chartMode, setChartMode] = useState<"funnel" | "revenue">("funnel");

  // Fetch report data
  const fetchReport = useCallback(async (start = startDate, end = endDate, status = orderStatus) => {
    setLoading(true);
    try {
      const res = await adminApi.getDetailedAcquisitionReport({
        start_date: start,
        end_date: end,
        order_status: status,
      });
      setData(res);
    } catch (err: any) {
      console.error("Failed to load acquisition report:", err);
      toast.error(err?.response?.data?.message || "Failed to load acquisition report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, orderStatus]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Preset selection
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const end = new Date();
    const start = new Date();

    if (preset === "7d") {
      start.setDate(end.getDate() - 6);
    } else if (preset === "14d") {
      start.setDate(end.getDate() - 13);
    } else if (preset === "30d") {
      start.setDate(end.getDate() - 29);
    } else if (preset === "this_month") {
      start.setDate(1);
    }

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    setStartDate(startStr);
    setEndDate(endStr);
    fetchReport(startStr, endStr, orderStatus);
  };

  const handleApplyFilter = () => {
    fetchReport(startDate, endDate, orderStatus);
  };

  const handleResetFilter = () => {
    setOrderStatus("all");
    setDatePreset("7d");
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    setStartDate(startStr);
    setEndDate(endStr);
    fetchReport(startStr, endStr, "all");
    toast.success("Filters reset to default 7-day period");
  };

  // Channel badge colors helper
  const getBadgeClass = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "indigo":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "teal":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "rose":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "pink":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "orange":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "green":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "sky":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-[#1F2430] text-[#929BAD] border-[#272B35]";
    }
  };

  const getPageTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "bg-[#1E2330] text-slate-300 border-[#2D3446]";
      case "category":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "subcategory":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "child category":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-[#1E2330] text-[#929BAD] border-[#2D3446]";
    }
  };

  const exportChannelsUrl = useMemo(() => {
    return adminApi.getExportAcquisitionChannelsUrl({
      start_date: startDate,
      end_date: endDate,
      order_status: orderStatus,
    });
  }, [startDate, endDate, orderStatus]);

  const exportPageViewsUrl = useMemo(() => {
    return adminApi.getExportAcquisitionPageViewsUrl({
      start_date: startDate,
      end_date: endDate,
      order_status: orderStatus,
    });
  }, [startDate, endDate, orderStatus]);

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#929BAD] mb-1">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <ChevronRight className="w-3 h-3 text-[#626B7B]" />
            <Link href="/admin/reports" className="hover:text-white transition-colors">Reports</Link>
            <ChevronRight className="w-3 h-3 text-[#626B7B]" />
            <span className="text-white font-medium">Acquisition & Channels Report</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Acquisition & Channels Report</span>
          </h1>
        </div>

        {/* Action Buttons: Print & Export */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#11141D] hover:bg-[#1A1F2C] border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <a
            href={exportChannelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Channels</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Order Status */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
              Order Status (For Sales Metrics)
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#171B26] border border-[#272B35] text-xs text-white focus:outline-none focus:border-[#A78BFA] transition-colors"
            >
              <option value="all">Choose Status / All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date Range Selector & Inputs */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Date Range
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handlePresetChange("7d")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    datePreset === "7d"
                      ? "bg-[#A78BFA] text-[#090B10] font-bold"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange("14d")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    datePreset === "14d"
                      ? "bg-[#A78BFA] text-[#090B10] font-bold"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  14D
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange("30d")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    datePreset === "30d"
                      ? "bg-[#A78BFA] text-[#090B10] font-bold"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange("this_month")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    datePreset === "this_month"
                      ? "bg-[#A78BFA] text-[#090B10] font-bold"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-[#171B26] border border-[#272B35] text-xs text-white focus:outline-none focus:border-[#A78BFA]"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-[#171B26] border border-[#272B35] text-xs text-white focus:outline-none focus:border-[#A78BFA]"
              />
            </div>
          </div>

          {/* Action Buttons: Apply & Reset */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#272B35] hover:bg-[#323744] text-white text-xs font-bold border border-[#3A404F] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Filter className="w-3.5 h-3.5 text-[#A78BFA]" />
              )}
              <span>Apply / Search</span>
            </button>

            <button
              onClick={handleResetFilter}
              disabled={loading}
              title="Reset Filters"
              className="p-2 rounded-lg bg-[#171B26] hover:bg-[#202534] border border-[#272B35] text-[#929BAD] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Synthesizing Acquisition Telemetry...
          </span>
        </div>
      ) : data ? (
        <>
          {/* 6 Top Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Unique Visitors */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Unique Visitors
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {data.summary_kpis.unique_visitors.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6B7280]">Individual users</span>
            </div>

            {/* 2. Sessions (Clicks) */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Sessions (Clicks)
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {data.summary_kpis.sessions_clicks.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6B7280]">Total site visits</span>
            </div>

            {/* 3. Leads Created */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Leads Created
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {data.summary_kpis.leads_created.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6B7280]">From capture form</span>
            </div>

            {/* 4. Orders Placed */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Orders Placed
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {data.summary_kpis.orders_placed.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6B7280]">Sales count</span>
            </div>

            {/* 5. Total Revenue */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Total Revenue
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                Tk. {data.summary_kpis.total_revenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6B7280]">Total cart amount</span>
            </div>

            {/* 6. Conversion Rate */}
            <div className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAD]">
                Conversion Rate
              </span>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {data.summary_kpis.conversion_rate.toFixed(2)}%
              </div>
              <span className="text-[11px] text-[#6B7280]">Sessions to orders</span>
            </div>
          </div>

          {/* Referral Breakdown Section */}
          <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A78BFA]">
                <Layers className="w-3 h-3" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Referral Breakdown
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#272B35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5 w-12">#</th>
                    <th className="py-2.5 px-3.5">Source</th>
                    <th className="py-2.5 px-3.5">Total</th>
                    <th className="py-2.5 px-3.5">Quantity</th>
                    <th className="py-2.5 px-3.5 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                  {data.referral_breakdown.map((row) => (
                    <tr key={row.id} className="hover:bg-[#171B26]/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[#929BAD]">{row.id}</td>
                      <td className="py-2.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeClass(row.badge_color)}`}>
                          {row.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-white">{row.total}</td>
                      <td className="py-2.5 px-3.5 font-mono text-[#929BAD]">{row.quantity}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-white text-right">
                        ৳{row.total_value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Middle Grid: Traffic & Sales Channel breakdown (Left 8) + Device / Domain / Platform (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 8 cols: Traffic & Sales Channel breakdown */}
            <div className="lg:col-span-8 p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Traffic & Sales Channel breakdown
                </h2>
                <span className="text-[11px] text-[#929BAD]">12 Canonical Channels</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#272B35]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Acquisition Channel</th>
                      <th className="py-2.5 px-2.5 text-right">Unique Visitors</th>
                      <th className="py-2.5 px-2.5 text-right">Sessions (Clicks)</th>
                      <th className="py-2.5 px-2.5 text-right">Leads Created</th>
                      <th className="py-2.5 px-2.5 text-right">Orders Placed</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      <th className="py-2.5 px-2.5 text-right">Session-to-Order CR</th>
                      <th className="py-2.5 px-2.5 text-right">Lead-to-Order CR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                    {data.channel_breakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#171B26]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeClass(row.badge_color)}`}>
                            {row.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-white text-right">
                          {row.unique_visitors.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-white text-right">
                          {row.sessions.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-300 text-right">
                          {row.leads_created}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono font-medium text-white text-right">
                          {row.orders_placed}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white text-right">
                          {row.total_revenue > 0 ? `Tk. ${row.total_revenue.toLocaleString()}` : "Tk. 0"}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-[#38BDF8] text-right">
                          {row.session_to_order_cr.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-[#A78BFA] text-right">
                          {row.lead_to_order_cr.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Combined Row */}
                  <tfoot className="bg-[#171B26] border-t-2 border-[#272B35] font-bold text-white">
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">
                        {data.channel_total.channel}
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right">
                        {data.channel_total.unique_visitors.toLocaleString()}
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right">
                        {data.channel_total.sessions.toLocaleString()}
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right">
                        {data.channel_total.leads_created}
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right">
                        {data.channel_total.orders_placed}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-emerald-400">
                        Tk. {data.channel_total.total_revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right text-[#38BDF8]">
                        {data.channel_total.session_to_order_cr.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2.5 font-mono text-right text-[#A78BFA]">
                        {data.channel_total.lead_to_order_cr.toFixed(2)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Right 4 cols: Device Sessions, Storefront Domains, Platform Sales */}
            <div className="lg:col-span-4 space-y-5">
              {/* Card 1: Device Sessions */}
              <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A78BFA]">
                    <Monitor className="w-3 h-3" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Device Sessions
                  </h3>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#929BAD] text-[11px] uppercase tracking-wider">
                        Mobile
                      </span>
                      <span className="font-mono text-white text-xs">
                        {data.device_sessions.mobile.count.toLocaleString()} ({data.device_sessions.mobile.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#171B26] overflow-hidden border border-[#272B35]">
                      <div
                        className="h-full bg-[#A78BFA] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, data.device_sessions.mobile.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#929BAD] text-[11px] uppercase tracking-wider">
                        Desktop
                      </span>
                      <span className="font-mono text-white text-xs">
                        {data.device_sessions.desktop.count.toLocaleString()} ({data.device_sessions.desktop.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#171B26] overflow-hidden border border-[#272B35]">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, data.device_sessions.desktop.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tablet */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#929BAD] text-[11px] uppercase tracking-wider">
                        Tablet
                      </span>
                      <span className="font-mono text-white text-xs">
                        {data.device_sessions.tablet.count.toLocaleString()} ({data.device_sessions.tablet.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#171B26] overflow-hidden border border-[#272B35]">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, data.device_sessions.tablet.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Storefront Domains */}
              <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Globe className="w-3 h-3" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Storefront Domains
                  </h3>
                </div>

                <div className="space-y-2.5 pt-1">
                  {data.storefront_domains.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#171B26] border border-[#272B35]">
                      <span className="font-mono text-xs text-white">{d.domain}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                        d.badge === "success" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-[#272B35] text-[#929BAD] border-[#3A404F]"
                      }`}>
                        {d.count.toLocaleString()} ({d.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Platform Sales */}
              <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-3 h-3" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Platform Sales
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#272B35]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Platform</th>
                        <th className="py-2 px-3 text-center">Orders</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                      {data.platform_sales.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#171B26]/50">
                          <td className="py-2.5 px-3 font-medium text-white">{p.platform}</td>
                          <td className="py-2.5 px-3 font-mono text-center text-white">{p.orders}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-white text-right">
                            Tk. {p.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Performance Trends Section with Chart */}
          <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Daily Performance Trends
                </h2>
              </div>

              {/* Funnel vs Revenue Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-[#171B26] border border-[#272B35]">
                <button
                  type="button"
                  onClick={() => setChartMode("funnel")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    chartMode === "funnel"
                      ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  Funnel (Clicks, Leads, Orders)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("revenue")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    chartMode === "revenue"
                      ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                      : "text-[#929BAD] hover:text-white"
                  }`}
                >
                  Revenue (Tk)
                </button>
              </div>
            </div>

            {/* Custom Chart Legend */}
            {chartMode === "funnel" ? (
              <div className="flex items-center justify-center gap-6 text-xs text-[#929BAD] pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3B82F6] bg-transparent" />
                  <span>Clicks (Sessions)</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#F59E0B] bg-transparent" />
                  <span>Leads</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#EF4444] bg-transparent" />
                  <span>Orders</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 text-xs text-[#929BAD] pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-transparent" />
                  <span>Gross Sales Volume (Tk)</span>
                </span>
              </div>
            )}

            {/* Recharts Canvas */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "funnel" ? (
                  <LineChart data={data.daily_performance_trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#272B35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#929BAD"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                    />
                    <YAxis
                      stroke="#929BAD"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171B26",
                        borderColor: "#272B35",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#3B82F6" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#F59E0B" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#EF4444" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={data.daily_performance_trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#272B35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#929BAD"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                    />
                    <YAxis
                      stroke="#929BAD"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#272B35" }}
                      tickFormatter={(v) => `৳${v}`}
                    />
                    <Tooltip
                      formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#171B26",
                        borderColor: "#272B35",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day-by-Day Performance Details Section */}
          <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Calendar className="w-3 h-3" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Day-by-Day Performance Details
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#272B35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Date / Period</th>
                    <th className="py-2.5 px-3.5">Channel / Medium</th>
                    <th className="py-2.5 px-3 text-right">Unique Visitors</th>
                    <th className="py-2.5 px-3 text-right">Sessions (Clicks)</th>
                    <th className="py-2.5 px-3 text-right">Leads Created</th>
                    <th className="py-2.5 px-3 text-right">Orders Placed</th>
                    <th className="py-2.5 px-3.5 text-right">Total Revenue</th>
                    <th className="py-2.5 px-3.5 text-right">Session-to-Order CR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                  {data.day_by_day_details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#171B26]/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-white">{row.date}</td>
                      <td className="py-2.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeClass(row.badge_color)}`}>
                          {row.channel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white text-right">
                        {row.unique_visitors.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white text-right">
                        {row.sessions.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#929BAD] text-right">
                        {row.leads_created}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white text-right">
                        {row.orders_placed}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-white text-right">
                        {row.total_revenue > 0 ? `Tk. ${row.total_revenue.toLocaleString()}` : "Tk. 0"}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#38BDF8] text-right">
                        {row.session_to_order_cr.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page Views Performance Section */}
          <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Eye className="w-3 h-3" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Page Views Performance
                </h2>
              </div>

              <a
                href={exportPageViewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#11141D] hover:bg-[#1A1F2C] border border-[#3B82F6]/40 text-[#38BDF8] text-xs font-semibold shadow-sm transition-all cursor-pointer print:hidden"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Page Views</span>
              </a>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#272B35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Page Title / Name</th>
                    <th className="py-2.5 px-3.5">URL Path</th>
                    <th className="py-2.5 px-3">Page Type</th>
                    <th className="py-2.5 px-3 text-right">Unique Visitors</th>
                    <th className="py-2.5 px-3.5 text-right">Total Page Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
                  {data.page_views_performance.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#171B26]/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-white">{p.page_title}</td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#A78BFA] hover:underline">
                        <Link href={p.url_path} target="_blank">
                          {p.url_path}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPageTypeBadgeClass(p.page_type)}`}>
                          {p.page_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white text-right">
                        {p.unique_visitors.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-white text-right">
                        {p.total_page_views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
