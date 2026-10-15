"use client";

import React, { ReactNode } from "react";
import { HelpCircle, Loader2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  businessQuestion?: string;
  action?: ReactNode;
  isLoading?: boolean;
  className?: string;
  height?: number | string;
  children: ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  businessQuestion,
  action,
  isLoading = false,
  className = "",
  height = 320,
  children,
}) => {
  return (
    <div
      className={`rounded-md border border-white/[0.06] bg-[#0d1017] p-5 shadow-sm transition-all duration-200 hover:border-white/10 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
            {businessQuestion && (
              <div
                className="group relative cursor-help"
                title={businessQuestion}
              >
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200 transition-colors" />
                <div className="absolute left-1/2 -top-10 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[#0d1017] px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-white/10 shadow-xl pointer-events-none">
                  {businessQuestion}
                </div>
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>

      <div style={{ minHeight: typeof height === "number" ? `${height}px` : height }} className="relative w-full">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-slate-950/40 backdrop-blur-sm z-10">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mb-2" />
            <span className="text-xs text-slate-400 font-medium">Loading analytics...</span>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};
