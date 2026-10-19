"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, Truck, Package, XCircle, AlertCircle, CreditCard } from "lucide-react";

interface OrderStatusPipelineProps {
  pendingCount: number;
  confirmedCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  pendingPaymentCount: number;
}

export const OrderStatusPipeline: React.FC<OrderStatusPipelineProps> = ({
  pendingCount = 0,
  confirmedCount = 0,
  processingCount = 0,
  shippedCount = 0,
  deliveredCount = 0,
  cancelledCount = 0,
  pendingPaymentCount = 0,
}) => {
  const steps = [
    {
      label: "Pending",
      count: pendingCount,
      status: "pending",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      hint: "Needs review",
      icon: Clock,
      urgency: pendingCount > 0,
    },
    {
      label: "Confirmed",
      count: confirmedCount,
      status: "confirmed",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      hint: "Ready to pick",
      icon: CheckCircle2,
      urgency: false,
    },
    {
      label: "Processing",
      count: processingCount,
      status: "processing",
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      hint: "Packing parcel",
      icon: Package,
      urgency: false,
    },
    {
      label: "Shipped",
      count: shippedCount,
      status: "shipped",
      badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      hint: "In transit",
      icon: Truck,
      urgency: false,
    },
    {
      label: "Delivered",
      count: deliveredCount,
      status: "delivered",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      hint: "Completed",
      icon: CheckCircle2,
      urgency: false,
    },
    {
      label: "Cancelled",
      count: cancelledCount,
      status: "cancelled",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      hint: "Void / Restocked",
      icon: XCircle,
      urgency: false,
    },
    {
      label: "Pending Pay",
      count: pendingPaymentCount,
      status: "all",
      paymentStatus: "pending",
      badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      hint: "COD / Pending",
      icon: CreditCard,
      urgency: pendingPaymentCount > 0,
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Operational Fulfillment Pipeline
          </h2>
          <p className="text-xs text-[#929BAD]">
            Live order processing distribution and delivery bottlenecks
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 group transition-colors"
        >
          <span>All Orders</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={`/admin/orders?status=${item.status}${item.paymentStatus ? `&payment_status=${item.paymentStatus}` : ""}`}
              className={`p-3 rounded-lg border transition-all duration-150 group block ${
                item.urgency
                  ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                  : "bg-[#171B26] border-[#272B35] hover:bg-[#202534] hover:border-[#383E4C]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] uppercase font-bold text-[#929BAD] tracking-wider truncate group-hover:text-white transition-colors">
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 ${item.badgeColor}`}>
                  {item.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280] group-hover:text-[#E5E7EB] transition-colors truncate">
                  {item.hint}
                </span>
                <Icon className="w-3 h-3 text-[#6B7280] group-hover:text-[#929BAD] transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
