"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  RefreshCw, 
  Plus, 
  Receipt, 
  ShoppingBag, 
  Layers, 
  Ticket, 
  CheckCircle2, 
  ChevronDown,
  Clock,
  Sparkles
} from "lucide-react";
import { DatePeriod, DateRangeState, getPresetDateRange } from "./types";

interface DashboardHeaderProps {
  dateRange: DateRangeState;
  onDateRangeChange: (newState: DateRangeState) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const presets: { id: DatePeriod; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "this_month", label: "This Month" },
  ];

  const handleSelectPreset = (preset: DatePeriod) => {
    const range = getPresetDateRange(preset);
    onDateRangeChange({
      period: preset,
      startDate: range.startDate,
      endDate: range.endDate,
      label: range.label,
      comparisonLabel: range.comparisonLabel,
    });
    setShowCustomModal(false);
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    onDateRangeChange({
      period: "custom",
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} - ${customEnd}`,
      comparisonLabel: "vs prior window",
    });
    setShowCustomModal(false);
  };

  const formatLastUpdated = (d: Date | null) => {
    if (!d) return "Just now";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Contextual Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Executive Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#009B55] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#009B55] animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Real-time business performance, order processing velocity, and operational health.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-[#4B5563]" />
            <span>POS Register</span>
          </Link>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#4B5563]" />
            <span>Orders</span>
          </Link>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#4B5563]" />
            <span>Catalog</span>
          </Link>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#009B55] hover:bg-[#008247] text-xs font-semibold text-white transition-all shadow-xs hover:shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Date-Range Selector Strip & Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        {/* Preset Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-2 hidden md:inline-block">
            Range:
          </span>
          {presets.map((preset) => {
            const isActive = dateRange.period === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#009B55] text-white shadow-xs font-semibold"
                    : "text-[#4B5563] hover:text-[#111827] hover:bg-slate-100"
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          {/* Custom Date Range Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCustomModal(!showCustomModal)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                dateRange.period === "custom"
                  ? "bg-[#009B55] text-white shadow-xs font-semibold"
                  : "text-[#4B5563] hover:text-[#111827] hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{dateRange.period === "custom" ? dateRange.label : "Custom"}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Custom Range Popover */}
            {showCustomModal && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-72 p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-lg animate-in fade-in-50 slide-in-from-top-1">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <span className="text-xs font-semibold text-[#111827]">Custom Date Window</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomModal(false)}
                      className="text-xs text-[#9CA3AF] hover:text-[#111827]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-[#4B5563] block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#009B55]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#4B5563] block mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#009B55]"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomModal(false)}
                      className="px-2.5 py-1 text-xs text-[#4B5563] hover:text-[#111827]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustom}
                      disabled={!customStart || !customEnd}
                      className="px-3 py-1 text-xs font-semibold bg-[#009B55] hover:bg-[#008247] text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh & Last Updated Timestamp */}
        <div className="flex items-center justify-between sm:justify-end gap-3 px-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <Clock className="w-3 h-3 text-[#9CA3AF]" />
            <span>Updated:</span>
            <span className="font-mono text-[#111827] font-medium">{formatLastUpdated(lastUpdated)}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-[#111827] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3 h-3 text-[#4B5563] ${isRefreshing ? "animate-spin text-[#009B55]" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
