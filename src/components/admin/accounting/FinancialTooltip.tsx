"use client";

import React from "react";

interface PayloadItem {
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
  stroke?: string;
  dataKey?: string;
  payload?: any;
}

interface FinancialTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formatter?: (val: number, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export const FinancialTooltip: React.FC<FinancialTooltipProps> = ({
  active,
  payload,
  label,
  valuePrefix = "$",
  valueSuffix = "",
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || !payload.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label || "") : label;

  return (
    <div className="z-50 min-w-[170px] rounded-md border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs">
      {displayLabel && (
        <div className="mb-2 border-b border-white/10 pb-1.5 font-medium text-slate-300">
          {displayLabel}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const color = item.color || item.fill || item.stroke || "#38bdf8";
          const rawVal = typeof item.value === "number" ? item.value : parseFloat(String(item.value)) || 0;
          const formattedVal = formatter
            ? formatter(rawVal, item.name)
            : `${valuePrefix}${rawVal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}${valueSuffix}`;

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-400 capitalize">{item.name.replace(/_/g, " ")}</span>
              </div>
              <span className="font-mono font-medium text-slate-100">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
