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
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "shipped":
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
      case "processing":
      case "confirmed":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "cancelled":
      case "refunded":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-[#929BAD] bg-[#171B26] border-[#272B35]";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "failed":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "refunded":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-[#929BAD] bg-[#171B26] border-[#272B35]";
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
    <div className="p-5 rounded-xl bg-[#11141D] border border-[#272B35] space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Recent Operational Orders
          </h2>
          <p className="text-xs text-[#929BAD]">
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
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/40 font-semibold shadow-xs"
                  : "text-[#929BAD] hover:text-white hover:bg-[#171B26]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#272B35]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#171B26] border-b border-[#272B35] text-[#929BAD] font-semibold uppercase text-[10px] tracking-wider">
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
          <tbody className="divide-y divide-[#272B35] bg-[#11141D]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#929BAD]">
                  <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading recent transactions...</span>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#929BAD]">
                  <ShoppingBag className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
                  <p className="font-medium text-white">No orders found for this view</p>
                  <p className="text-[11px] text-[#929BAD] mt-0.5">
                    Orders will appear here automatically when customer checkouts occur.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#171B26]/60 transition-colors group">
                  {/* Order Number */}
                  <td className="py-3 px-3.5 font-mono font-semibold text-white">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(ord.order_number)}`}
                      className="hover:text-[#A78BFA] transition-colors inline-flex items-center gap-1"
                    >
                      <span>{ord.order_number}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280]" />
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3.5 max-w-[180px]">
                    <span className="font-semibold text-white block truncate">
                      {ord.customer_name || "Guest Checkout"}
                    </span>
                    <span className="text-[11px] text-[#929BAD] block truncate">
                      {ord.customer_email || ord.customer_phone || "—"}
                    </span>
                  </td>

                  {/* Channel */}
                  <td className="py-3 px-3.5">
                    {ord.order_source === "pos" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Store className="w-3 h-3" /> POS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
                        <Monitor className="w-3 h-3" /> Online
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3.5 font-bold font-mono text-white">
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
                  <td className="py-3 px-3.5 text-[#929BAD] text-[11px] whitespace-nowrap">
                    {formatDate(ord.created_at)}
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(ord.order_number)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171B26] border border-[#272B35] hover:bg-[#202534] text-[11px] font-semibold text-[#E5E7EB] hover:border-[#383E4C] transition-all"
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
        <span className="text-[#929BAD]">
          Showing {filteredOrders.length} of {orders.length} loaded records
        </span>
        <Link
          href="/admin/orders"
          className="font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 transition-colors"
        >
          <span>View All Orders Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
