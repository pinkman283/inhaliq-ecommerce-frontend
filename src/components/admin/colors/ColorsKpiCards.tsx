"use client";

import React from "react";
import { Palette, Check, AlertTriangle, Filter } from "lucide-react";
import { AdminStatStrip } from "@/components/admin/ui";

interface ColorsKpiCardsProps {
  totalSwatches: number;
  activeCount: number;
  inactiveCount: number;
  filteredCount: number;
}

export function ColorsKpiCards({
  totalSwatches,
  activeCount,
  inactiveCount,
  filteredCount,
}: ColorsKpiCardsProps) {
  return (
    <AdminStatStrip
      columns={4}
      stats={[
        {
          label: "Total Swatches",
          value: totalSwatches,
          icon: Palette,
          variant: "cyan",
          helper: "In global color catalog",
        },
        {
          label: "Active Swatches",
          value: activeCount,
          icon: Check,
          variant: "emerald",
          helper: "Available in variant picker",
        },
        {
          label: "Inactive Swatches",
          value: inactiveCount,
          icon: AlertTriangle,
          variant: "amber",
          helper: "Hidden from catalog presets",
        },
        {
          label: "Filtered Count",
          value: filteredCount,
          icon: Filter,
          variant: "default",
          helper: "Matching search/filter criteria",
        },
      ]}
    />
  );
}
