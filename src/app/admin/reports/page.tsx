"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Layers, 
  Users, 
  Truck, 
  Coins, 
  Tag, 
  CreditCard, 
  MapPin, 
  PackageX, 
  Boxes, 
  Loader2,
  FileSpreadsheet,
  ArrowUpDown
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { ReportData } from "@/types";
import { AdminPageHeader, AdminStatStrip, AdminEmptyState, FilterDrawer } from "@/components/admin/ui";
import { toast } from "sonner";


const REPORT_MODULES = [
  { id: "orders", label: "1. Order Performance", icon: ShoppingBag, desc: "Order statuses, completion rates, gross sales and AOV" },
  { id: "acquisition", label: "2. Acquisition & Channels", icon: TrendingUp, desc: "Online Storefront vs POS Terminal sales volume" },
  { id: "leads", label: "3. Lead Conversion", icon: Users, desc: "Cart abandonment recovery funnel and lead pipeline" },
  { id: "products", label: "4. Best Selling Products", icon: Boxes, desc: "Top SKUs by units, gross revenue, and gross margin" },
  { id: "categories", label: "5. Category Performance", icon: Layers, desc: "Sales contribution and revenue share per category" },
  { id: "geography", label: "6. Area / District Report", icon: MapPin, desc: "Geographic sales breakdown across divisions and cities" },
  { id: "couriers", label: "7. Courier Performance", icon: Truck, desc: "Steadfast vs Pathao vs RedX delivery & return rates" },
  { id: "returns", label: "8. Returns & Refunds", icon: PackageX, desc: "Return reasons, customer refusals, and loss impact" },
  { id: "customers", label: "9. Customer Cohorts & LTV", icon: Users, desc: "Customer retention, repeat rates, and top spenders" },
  { id: "inventory", label: "10. Stock / Inventory Audit", icon: Boxes, desc: "Catalog valuation at cost vs retail, and low stock risks" },
  { id: "delivery", label: "11. Daily Dispatch Schedule", icon: Truck, desc: "Daily dispatch velocity and in-transit delivery volume" },
  { id: "profit", label: "12. Realized Profit & Loss", icon: Coins, desc: "Gross profit, FIFO COGS, operating expenses, and net profit" },
  { id: "coupons", label: "13. Coupon Usage & ROI", icon: Tag, desc: "Promo vouchers redemption and discount surrendered ROI" },
  { id: "payments", label: "14. Payment Method Distribution", icon: CreditCard, desc: "bKash, Nagad, SSLCommerz, Card, and COD breakdown" },
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState("orders");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Date Range State
  const [datePreset, setDatePreset] = useState("30d");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Slide-over Filter Drawer State
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const fetchReport = async (type: string, start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getReport(type, {
        start_date: start || startDate,
        end_date: end || endDate,
      });
      setReportData(data);
    } catch (err) {
      toast.error(`Failed to load ${type} report data.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReport, startDate, endDate);
  }, [selectedReport]);

  const handleDatePresetChange = (preset: string) => {
    setActivePresetDate(preset);
  };

  const setActivePresetDate = (preset: string) => {
    if (preset === "custom") {
      setCustomStart(startDate);
      setCustomEnd(endDate);
      setIsCustomDrawerOpen(true);
      return;
    }

    setDatePreset(preset);
    const end = new Date().toISOString().split("T")[0];
    let start = new Date();

    if (preset === "today") {
      start = new Date();
    } else if (preset === "7d") {
      start.setDate(start.getDate() - 7);
    } else if (preset === "30d") {
      start.setDate(start.getDate() - 30);
    } else if (preset === "month") {
      start.setDate(1); // 1st of this month
    } else if (preset === "year") {
      start = new Date(new Date().getFullYear(), 0, 1);
    }

    const startStr = start.toISOString().split("T")[0];
    setStartDate(startStr);
    setEndDate(end);
    fetchReport(selectedReport, startStr, end);
  };

  const applyCustomDrawer = () => {
    if (customStart && customEnd) {
      setDatePreset("custom");
      setStartDate(customStart);
      setEndDate(customEnd);
      fetchReport(selectedReport, customStart, customEnd);
      setIsCustomDrawerOpen(false);
    }
  };


  const handleExportCsv = () => {
    const url = adminApi.getExportReportUrl(selectedReport, {
      start_date: startDate,
      end_date: endDate,
    });
    window.open(url, "_blank");
    toast.success("Streaming CSV export initiated.");
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!reportData?.rows) return [];
    if (!search.trim()) return reportData.rows;

    const q = search.toLowerCase();
    return reportData.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [reportData?.rows, search]);

  const currentModule = REPORT_MODULES.find((m) => m.id === selectedReport) || REPORT_MODULES[0];
  const CurrentIcon = currentModule.icon;

  const statItems = (reportData?.summary || []).map((item) => ({
    label: item.label,
    value: item.value,
    icon: CurrentIcon,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="14-Report Analytics & Intelligence Center"
        subtitle="Auditable business intelligence reporting engine with multi-dimension analytics, margins, and CSV export."
        badge="Enterprise BI"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports", href: "/admin/reports" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-[#A78BFA]/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Report Module Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08] no-scrollbar">
        {REPORT_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = selectedReport === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setSelectedReport(mod.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#A78BFA]" : "text-slate-500"}`} />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar & Search */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Preset Date Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "month", label: "This Month" },
            { id: "year", label: "YTD" },
            { id: "custom", label: "Custom" },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleDatePresetChange(preset.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                datePreset === preset.id
                  ? "bg-[#A78BFA] text-[#090B10] font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Display Indicator & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCustomStart(startDate);
              setCustomEnd(endDate);
              setIsCustomDrawerOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-[#161a26] border border-white/10 hover:border-[#A78BFA]/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title="Click to customize date interval"
          >
            <Calendar className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span className="font-mono text-[11px]">{startDate}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono text-[11px]">{endDate}</span>
          </button>


          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#161a26] border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 w-44"
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards Strip */}
      {statItems.length > 0 && (
        <AdminStatStrip stats={statItems} />
      )}

      {/* Report Table Card */}
      <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CurrentIcon className="w-4 h-4 text-[#A78BFA]" />
              {reportData?.title || currentModule.label}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentModule.desc} • Showing data from <span className="font-mono text-[#A78BFA]">{startDate}</span> to <span className="font-mono text-[#A78BFA]">{endDate}</span>
            </p>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {filteredRows.length} Rows
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[#161a26] rounded-md animate-pulse" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <AdminEmptyState
            title="No Records Found for Selected Period"
            description="Try extending your date range filter or modifying the search query."
            icon={CurrentIcon}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {reportData?.columns.map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-slate-300">
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                    {reportData?.columns.map((col) => {
                      const val = row[col];
                      const isMoney = /amount|revenue|spend|cost|loss|rate|price|value/i.test(col) && typeof val === "number";
                      const isStatus = col === "status" || col === "payment_status";

                      return (
                        <td key={col} className="py-3 px-4 whitespace-nowrap">
                          {isMoney ? (
                            <span className="font-mono font-semibold text-white">
                              ৳ {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : isStatus ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#A78BFA] border border-[#A78BFA]/30">
                              {String(val)}
                            </span>
                          ) : (
                            <span>{val !== null && val !== undefined ? String(val) : "—"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Custom Date Filter Drawer */}
      <FilterDrawer
        open={isCustomDrawerOpen}
        onOpenChange={setIsCustomDrawerOpen}
        title="Filter by Date"
        onApply={applyCustomDrawer}
        onReset={() => {
          setCustomStart(startDate);
          setCustomEnd(endDate);
        }}
        applyLabel="Done"
        resetLabel="Reset"
        accentColor="amber"
      >
        <div className="space-y-5">
          {/* Compact Presets */}
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-2">
              Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: "7 Days",
                  fn: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    setCustomStart(start.toISOString().split("T")[0]);
                    setCustomEnd(end.toISOString().split("T")[0]);
                  },
                },
                {
                  label: "30 Days",
                  fn: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    setCustomStart(start.toISOString().split("T")[0]);
                    setCustomEnd(end.toISOString().split("T")[0]);
                  },
                },
                {
                  label: "90 Days",
                  fn: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 90);
                    setCustomStart(start.toISOString().split("T")[0]);
                    setCustomEnd(end.toISOString().split("T")[0]);
                  },
                },
                {
                  label: "YTD",
                  fn: () => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), 0, 1);
                    setCustomStart(start.toISOString().split("T")[0]);
                    setCustomEnd(now.toISOString().split("T")[0]);
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.fn}
                  className="px-2.5 py-1 rounded-md text-xs text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Date Inputs */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </FilterDrawer>
    </div>
  );
}

