"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

interface ChartEmptyStateProps {
  title?: string;
  message?: string;
  height?: number | string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title = "No Data Available",
  message = "No financial activity recorded for the selected period or filters.",
  height = 240,
}) => {
  return (
    <div
      style={{ height }}
      className="w-full flex flex-col items-center justify-center rounded-md border border-white/5 bg-slate-900/30 p-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-800/80 text-slate-400 border border-white/5 mb-3 shadow-inner">
        <BarChart3 className="h-6 w-6 opacity-60" />
      </div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-400">{message}</p>
    </div>
  );
};
