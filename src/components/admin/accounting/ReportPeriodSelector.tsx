"use client";

import React, { useState, useEffect } from "react";
import { Calendar, RefreshCw, Clock, ArrowRight } from "lucide-react";
import { FilterDrawer } from "@/components/admin/ui";

export type PeriodPreset = "today" | "week" | "month" | "quarter" | "year" | "custom";

interface ReportPeriodSelectorProps {
  startDate: string;
  endDate: string;
  onPeriodChange: (start: string, end: string, preset: PeriodPreset) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ReportPeriodSelector: React.FC<ReportPeriodSelectorProps> = ({
  startDate,
  endDate,
  onPeriodChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [activePreset, setActivePreset] = useState<PeriodPreset>("month");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  // Sync custom start and end dates with props when drawer opens or dates change
  useEffect(() => {
    if (startDate) setCustomStart(startDate);
    if (endDate) setCustomEnd(endDate);
  }, [startDate, endDate]);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const handleSelectPreset = (preset: PeriodPreset) => {
    setActivePreset(preset);
    const now = new Date();

    let start = "";
    let end = formatDate(now);

    switch (preset) {
      case "today": {
        start = formatDate(now);
        end = formatDate(now);
        setIsCustomOpen(false);
        break;
      }
      case "week": {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        d.setDate(diff);
        start = formatDate(d);
        setIsCustomOpen(false);
        break;
      }
      case "month": {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        start = formatDate(d);
        setIsCustomOpen(false);
        break;
      }
      case "quarter": {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const d = new Date(now.getFullYear(), currentQuarter * 3, 1);
        start = formatDate(d);
        setIsCustomOpen(false);
        break;
      }
      case "year": {
        const d = new Date(now.getFullYear(), 0, 1);
        start = formatDate(d);
        setIsCustomOpen(false);
        break;
      }
      case "custom": {
        setIsCustomOpen(true);
        return;
      }
    }

    onPeriodChange(start, end, preset);
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      setActivePreset("custom");
      onPeriodChange(customStart, customEnd, "custom");
      setIsCustomOpen(false);
    }
  };

  const setDrawerQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setCustomStart(formatDate(start));
    setCustomEnd(formatDate(end));
  };

  const setDrawerMonthRange = (monthsAgo: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
    setCustomStart(formatDate(start));
    setCustomEnd(formatDate(end));
  };

  // Calculate day difference for preview
  const dayDifference = (() => {
    if (!customStart || !customEnd) return 0;
    const s = new Date(customStart).getTime();
    const e = new Date(customEnd).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  })();

  const presets: { id: PeriodPreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "quarter", label: "This Quarter" },
    { id: "year", label: "This Year" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 p-1 rounded-md bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelectPreset(p.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activePreset === p.id
                ? "bg-white/10 text-white font-semibold border border-white/10 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-slate-300">{startDate}</span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-slate-300">{endDate}</span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-slate-200" : ""}`} />
          </button>
        )}
      </div>

      {/* Minimal Right Slide-Over Filter Drawer */}
      <FilterDrawer
        open={isCustomOpen}
        onOpenChange={setIsCustomOpen}
        title="Filter by Date"
        onApply={applyCustomRange}
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
                { label: "7 Days", fn: () => setDrawerQuickRange(7) },
                { label: "30 Days", fn: () => setDrawerQuickRange(30) },
                { label: "This Month", fn: () => setDrawerMonthRange(0) },
                { label: "Last Month", fn: () => setDrawerMonthRange(1) },
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
};


