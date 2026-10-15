"use client";

import React from "react";

export interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  label,
  size = "sm",
  showDot = true,
  className = "",
}) => {
  const norm = (status || "").toLowerCase().trim().replace(/[-_]/g, " ");

  const getConfig = () => {
    switch (norm) {
      // Success / Paid / Active / Completed / Connected
      case "paid":
      case "active":
      case "completed":
      case "in stock":
      case "instock":
      case "approved":
      case "delivered":
      case "settled":
      case "verified":
      case "confirmed":
      case "connected":
        return {
          bg: "bg-[#34D399]/10",
          text: "text-[#34D399]",
          border: "border-[#34D399]/25",
          dot: "bg-[#34D399]",
        };

      // Warning / Pending / Processing / Due Soon / Partial / Sandbox
      case "pending":
      case "processing":
      case "low stock":
      case "lowstock":
      case "shipped":
      case "recorded":
      case "due soon":
      case "unpaid":
      case "partially paid":
      case "partially refunded":
      case "sandbox":
      case "sandbox mode":
        return {
          bg: "bg-[#FBBF24]/10",
          text: "text-[#FBBF24]",
          border: "border-[#FBBF24]/25",
          dot: "bg-[#FBBF24]",
        };

      // Danger / Cancelled / Refunded / Out of Stock / Returned / Failed
      case "cancelled":
      case "canceled":
      case "refunded":
      case "failed":
      case "out of stock":
      case "outofstock":
      case "blocked":
      case "overdue":
      case "returned":
      case "partially cancelled":
        return {
          bg: "bg-[#F87171]/10",
          text: "text-[#F87171]",
          border: "border-[#F87171]/25",
          dot: "bg-[#F87171]",
        };

      // Informational / Lavender / Return Logistics / Draft
      case "draft":
      case "pos":
      case "online":
      case "featured":
      case "rto in transit":
      case "return requested":
      case "qc completed":
      case "received":
        return {
          bg: "bg-[#A78BFA]/10",
          text: "text-[#A78BFA]",
          border: "border-[#A78BFA]/25",
          dot: "bg-[#A78BFA]",
        };

      // Default Neutral
      default:
        return {
          bg: "bg-[#171B26]",
          text: "text-[#929BAD]",
          border: "border-[#272B35]",
          dot: "bg-[#626B7B]",
        };
    }
  };

  const config = getConfig();
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10.5px]"
      : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold uppercase tracking-wider ${sizeClasses} ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />}
      <span className="truncate">{label || status}</span>
    </span>
  );
};
