"use client";

import React from "react";
import Link from "next/link";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ComparisonDelta } from "./types";

interface KpiCardData {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  delta?: ComparisonDelta;
  comparisonLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  tooltip?: string;
  href: string;
  warning?: boolean;
}

interface ExecutiveKpiStripProps {
  netSales: number;
  grossSales?: number;
  discounts?: number;
  refunds?: number;
  totalOrders: number;
  avgOrderValue: number;
  onlineOrdersCount?: number;
  posOrdersCount?: number;
  operatingProfit: number;
  netMarginPercentage: number;
  pendingOrdersCount: number;
  pendingPaymentsCount: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
  salesDelta?: ComparisonDelta;
  ordersDelta?: ComparisonDelta;
  profitDelta?: ComparisonDelta;
  comparisonPeriodLabel?: string;
  isLoading?: boolean;
}

export const ExecutiveKpiStrip: React.FC<ExecutiveKpiStripProps> = ({
  netSales,
  grossSales,
  discounts = 0,
  refunds = 0,
  totalOrders,
  avgOrderValue,
  onlineOrdersCount = 0,
  posOrdersCount = 0,
  operatingProfit,
  netMarginPercentage,
  pendingOrdersCount,
  pendingPaymentsCount,
  lowStockCount,
  totalProducts,
  totalCustomers,
  salesDelta,
  ordersDelta,
  profitDelta,
  comparisonPeriodLabel = "vs prior period",
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#1F2430] rounded" />
              <div className="w-8 h-8 rounded-lg bg-[#171B26]" />
            </div>
            <div className="h-7 w-28 bg-[#1F2430] rounded" />
            <div className="h-3 w-36 bg-[#171B26] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const attentionRequiredCount = pendingOrdersCount + pendingPaymentsCount;

  const kpis: KpiCardData[] = [
    {
      id: "net_sales",
      label: "Net Sales",
      value: formatPrice(netSales),
      subValue: grossSales ? `Gross: ${formatPrice(grossSales)}` : undefined,
      delta: salesDelta,
      comparisonLabel: comparisonPeriodLabel,
      icon: DollarSign,
      iconColor: "text-[#A78BFA]",
      iconBg: "bg-[#211B32] border border-[#A78BFA]/30",
      tooltip: `Net Sales = Gross Sales (${formatPrice(grossSales || netSales)}) less Discounts (${formatPrice(discounts)}) and Refunds (${formatPrice(refunds)}).`,
      href: "/admin/accounting/reports",
    },
    {
      id: "total_orders",
      label: "Orders & AOV",
      value: totalOrders.toLocaleString(),
      subValue: `AOV: ${formatPrice(avgOrderValue)}`,
      delta: ordersDelta,
      comparisonLabel: comparisonPeriodLabel,
      icon: ShoppingBag,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      tooltip: `Total orders processed. Split: ${onlineOrdersCount} Online Store, ${posOrdersCount} POS Terminal.`,
      href: "/admin/orders",
    },
    {
      id: "operating_profit",
      label: "Operating Profit",
      value: formatPrice(operatingProfit),
      subValue: `${netMarginPercentage.toFixed(1)}% Net Margin`,
      delta: profitDelta,
      comparisonLabel: comparisonPeriodLabel,
      icon: TrendingUp,
      iconColor: operatingProfit >= 0 ? "text-emerald-400" : "text-rose-400",
      iconBg: operatingProfit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      tooltip: "Operating Profit = Gross Profit (Net Sales - COGS) - Operating Expenses. Represents true business yield.",
      href: "/admin/accounting",
    },
    {
      id: "attention_orders",
      label: "Attention Needed",
      value: attentionRequiredCount.toLocaleString(),
      subValue: `${pendingOrdersCount} review • ${pendingPaymentsCount} unpaid`,
      icon: AlertTriangle,
      iconColor: attentionRequiredCount > 0 ? "text-amber-400" : "text-[#929BAD]",
      iconBg: attentionRequiredCount > 0 ? "bg-amber-500/10" : "bg-white/5",
      warning: attentionRequiredCount > 0,
      tooltip: "Orders requiring administrative verification, fulfillment processing, or payment collection.",
      href: "/admin/orders?status=pending",
    },
    {
      id: "inventory_health",
      label: "Inventory Health",
      value: lowStockCount > 0 ? `${lowStockCount} Low` : "Optimal",
      subValue: `${totalProducts} Catalog SKUs`,
      icon: Package,
      iconColor: lowStockCount > 0 ? "text-amber-400" : "text-emerald-400",
      iconBg: lowStockCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
      warning: lowStockCount > 0,
      tooltip: "Low stock threshold is 10 units. Products below this require immediate supplier purchase orders.",
      href: "/admin/products?stock_status=low_stock",
    },
    {
      id: "customer_base",
      label: "Verified Customers",
      value: totalCustomers.toLocaleString(),
      subValue: "Registered accounts",
      icon: Users,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/10",
      tooltip: "Total registered customer buyer profiles within the store database.",
      href: "/admin/customers",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link
            key={kpi.id}
            href={kpi.href}
            className={`group relative p-4 rounded-xl border transition-all duration-200 block ${
              kpi.warning
                ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                : "bg-[#11141D] border-[#272B35] hover:border-[#383E4C]"
            }`}
          >
            {/* Top row: Label + Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold text-[#929BAD] uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                {kpi.tooltip && (
                  <div className="group/tip relative cursor-help inline-flex items-center" title={kpi.tooltip}>
                    <HelpCircle className="w-3 h-3 text-[#6B7280] hover:text-[#929BAD] transition-colors" />
                  </div>
                )}
              </div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
            </div>

            {/* Middle: Primary Value */}
            <div className="mb-1.5 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white truncate">
                {kpi.value}
              </span>
            </div>

            {/* Bottom: Sub-value and Delta indicator */}
            <div className="flex items-center justify-between gap-1 text-[11px] pt-1.5 border-t border-[#272B35]">
              <span className="text-[#929BAD] font-medium truncate">
                {kpi.subValue}
              </span>

              {kpi.delta ? (
                <div
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono shrink-0 border ${
                    kpi.delta.trend === "up"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : kpi.delta.trend === "down"
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      : "text-[#929BAD] bg-[#171B26] border-[#272B35]"
                  }`}
                  title={`${kpi.delta.formatted} ${kpi.comparisonLabel}`}
                >
                  {kpi.delta.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                  {kpi.delta.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                  {kpi.delta.trend === "neutral" && <Minus className="w-2.5 h-2.5" />}
                  <span>{kpi.delta.formatted}</span>
                </div>
              ) : (
                <ArrowUpRight className="w-3 h-3 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};
