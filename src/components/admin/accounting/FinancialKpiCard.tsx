"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from "lucide-react";

interface FinancialKpiCardProps {
  title: string;
  value: number | string;
  isCurrency?: boolean;
  subtitle?: string;
  secondaryMetric?: {
    label: string;
    value: string | number;
  };
  trend?: {
    value: number | string;
    isPositive?: boolean;
    neutral?: boolean;
    label?: string;
  };
  icon?: ReactNode;
  variant?: "default" | "cyan" | "emerald" | "amber" | "rose" | "purple";
  href?: string;
  className?: string;
}

const variantStyles = {
  default: {
    border: "border-white/10 hover:border-white/20",
    glow: "hover:shadow-slate-900/40",
    text: "text-white",
    badge: "bg-slate-800/80 text-slate-300 border-white/5",
    iconBg: "bg-slate-800/60 text-slate-300 border-white/10",
  },
  cyan: {
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    glow: "hover:shadow-cyan-950/30",
    text: "text-cyan-400",
    badge: "bg-cyan-950/50 text-cyan-300 border-cyan-500/20",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  emerald: {
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "hover:shadow-emerald-950/30",
    text: "text-emerald-400",
    badge: "bg-emerald-950/50 text-emerald-300 border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  amber: {
    border: "border-amber-500/20 hover:border-amber-500/40",
    glow: "hover:shadow-amber-950/30",
    text: "text-amber-400",
    badge: "bg-amber-950/50 text-amber-300 border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  rose: {
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "hover:shadow-rose-950/30",
    text: "text-rose-400",
    badge: "bg-rose-950/50 text-rose-300 border-rose-500/20",
    iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  purple: {
    border: "border-purple-500/20 hover:border-purple-500/40",
    glow: "hover:shadow-purple-950/30",
    text: "text-purple-400",
    badge: "bg-purple-950/50 text-purple-300 border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
};

export const FinancialKpiCard: React.FC<FinancialKpiCardProps> = ({
  title,
  value,
  isCurrency = true,
  subtitle,
  secondaryMetric,
  trend,
  icon,
  variant = "default",
  href,
  className = "",
}) => {
  const styles = variantStyles[variant];

  const formattedValue = typeof value === "number"
    ? isCurrency
      ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : value.toLocaleString()
    : value;

  const content = (
    <div
      className={`relative flex flex-col justify-between rounded-md border bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${styles.border} ${styles.glow} ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
          {icon && (
            <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${styles.iconBg}`}>
              {icon}
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight font-mono ${styles.text}`}>
            {formattedValue}
          </span>
        </div>

        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        {secondaryMetric ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{secondaryMetric.label}:</span>
            <span className="font-mono font-medium text-slate-200">{secondaryMetric.value}</span>
          </div>
        ) : trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium border ${
                trend.neutral
                  ? "bg-slate-800 text-slate-300 border-white/10"
                  : trend.isPositive
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-950/60 text-rose-400 border-rose-500/20"
              }`}
            >
              {trend.neutral ? (
                <Minus className="h-3 w-3" />
              ) : trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
            {trend.label && <span className="text-[11px] text-slate-400">{trend.label}</span>}
          </div>
        ) : (
          <span />
        )}

        {href && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors group">
            Details
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
};
