"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { 
  ChevronRight, 
  ShoppingBag, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Receipt,
  Store,
  Monitor
} from "lucide-react";

interface RecentOrdersWidgetProps {
  orders: Order[];
  isLoading?: boolean;
}

export const RecentOrdersWidget: React.FC<RecentOrdersWidgetProps> = ({
  orders = [],
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return o.order_status === "pending";
    if (filter === "processing") return o.order_status === "processing" || o.order_status === "confirmed";
    if (filter === "shipped") return o.order_status === "shipped";
    if (filter === "delivered") return o.order_status === "delivered";
    if (filter === "cancelled") return o.order_status === "cancelled" || o.order_status === "refunded";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-[#009B55] bg-emerald-50 border-emerald-200";
      case "shipped":
        return "text-sky-700 bg-sky-50 border-sky-200";
      case "processing":
      case "confirmed":
        return "text-indigo-700 bg-indigo-50 border-indigo-200";
      case "pending":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "cancelled":
      case "refunded":
        return "text-rose-700 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "text-[#009B55] bg-emerald-50 border-emerald-200";
      case "pending":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "failed":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "refunded":
        return "text-purple-700 bg-purple-50 border-purple-200";
      default:
        return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const filterTabs = [
    { id: "all", label: "All Activity" },
    { id: "pending", label: "Pending" },
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "In Transit" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#111827] tracking-tight">
            Recent Operational Orders
          </h2>
          <p className="text-xs text-[#6B7280]">
            Latest customer checkout activity across digital and physical registers
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? "bg-[#111827] text-white font-semibold shadow-xs"
                  : "text-[#4B5563] hover:text-[#111827] hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#4B5563] font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Order</th>
              <th className="py-2.5 px-3.5">Customer</th>
              <th className="py-2.5 px-3.5">Channel</th>
              <th className="py-2.5 px-3.5">Amount</th>
              <th className="py-2.5 px-3.5">Payment</th>
              <th className="py-2.5 px-3.5">Fulfillment</th>
              <th className="py-2.5 px-3.5">Date</th>
              <th className="py-2.5 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                  <div className="w-5 h-5 border-2 border-[#009B55] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading recent transactions...</span>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                  <ShoppingBag className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="font-medium text-[#111827]">No orders found for this view</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Orders will appear here automatically when customer checkouts occur.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  {/* Order Number */}
                  <td className="py-3 px-3.5 font-mono font-semibold text-[#111827]">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(ord.order_number)}`}
                      className="hover:text-[#009B55] transition-colors inline-flex items-center gap-1"
                    >
                      <span>{ord.order_number}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA3AF]" />
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3.5 max-w-[180px]">
                    <span className="font-semibold text-[#111827] block truncate">
                      {ord.customer_name || "Guest Checkout"}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block truncate">
                      {ord.customer_email || ord.customer_phone || "—"}
                    </span>
                  </td>

                  {/* Channel */}
                  <td className="py-3 px-3.5">
                    {ord.order_source === "pos" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Store className="w-3 h-3" /> POS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-[#009B55] border border-emerald-200">
                        <Monitor className="w-3 h-3" /> Online
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3.5 font-bold font-mono text-[#111827]">
                    {formatPrice(ord.total_amount)}
                  </td>

                  {/* Payment */}
                  <td className="py-3 px-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${getPaymentBadge(ord.payment_status)}`}>
                      {ord.payment_status}
                    </span>
                  </td>

                  {/* Fulfillment */}
                  <td className="py-3 px-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${getStatusBadge(ord.order_status)}`}>
                      {ord.order_status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3.5 text-[#6B7280] text-[11px] whitespace-nowrap">
                    {formatDate(ord.created_at)}
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(ord.order_number)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-semibold text-[#111827] hover:border-slate-300 transition-all shadow-xs"
                    >
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer link to full orders page */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[#6B7280]">
          Showing {filteredOrders.length} of {orders.length} loaded records
        </span>
        <Link
          href="/admin/orders"
          className="font-semibold text-[#009B55] hover:text-[#008247] flex items-center gap-1 transition-colors"
        >
          <span>View All Orders Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
