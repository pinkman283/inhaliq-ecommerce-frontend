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
      badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
      hint: "Needs review",
      icon: Clock,
      urgency: pendingCount > 0,
    },
    {
      label: "Confirmed",
      count: confirmedCount,
      status: "confirmed",
      badgeColor: "text-blue-700 bg-blue-50 border-blue-200",
      hint: "Ready to pick",
      icon: CheckCircle2,
      urgency: false,
    },
    {
      label: "Processing",
      count: processingCount,
      status: "processing",
      badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
      hint: "Packing parcel",
      icon: Package,
      urgency: false,
    },
    {
      label: "Shipped",
      count: shippedCount,
      status: "shipped",
      badgeColor: "text-sky-700 bg-sky-50 border-sky-200",
      hint: "In transit",
      icon: Truck,
      urgency: false,
    },
    {
      label: "Delivered",
      count: deliveredCount,
      status: "delivered",
      badgeColor: "text-[#009B55] bg-emerald-50 border-emerald-200",
      hint: "Completed",
      icon: CheckCircle2,
      urgency: false,
    },
    {
      label: "Cancelled",
      count: cancelledCount,
      status: "cancelled",
      badgeColor: "text-rose-700 bg-rose-50 border-rose-200",
      hint: "Void / Restocked",
      icon: XCircle,
      urgency: false,
    },
    {
      label: "Pending Pay",
      count: pendingPaymentCount,
      status: "all",
      paymentStatus: "pending",
      badgeColor: "text-orange-700 bg-orange-50 border-orange-200",
      hint: "COD / Pending",
      icon: CreditCard,
      urgency: pendingPaymentCount > 0,
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#111827] tracking-tight">
            Operational Fulfillment Pipeline
          </h2>
          <p className="text-xs text-[#6B7280]">
            Live order processing distribution and delivery bottlenecks
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 group transition-colors"
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
                  ? "bg-amber-50/20 border-amber-200/80 hover:border-amber-300"
                  : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] uppercase font-bold text-[#4B5563] tracking-wider truncate">
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 ${item.badgeColor}`}>
                  {item.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280] group-hover:text-[#111827] transition-colors truncate">
                  {item.hint}
                </span>
                <Icon className="w-3 h-3 text-[#9CA3AF] group-hover:text-[#4B5563] transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
