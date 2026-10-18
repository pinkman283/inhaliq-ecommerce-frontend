export type DatePeriod = "today" | "yesterday" | "7d" | "30d" | "this_month" | "custom";

export interface DateRangeState {
  period: DatePeriod;
  startDate?: string;
  endDate?: string;
  label: string;
  comparisonLabel: string;
}

export interface ComparisonDelta {
  formatted: string;
  trend: "up" | "down" | "neutral";
  rawPercent: number;
}

/**
 * Safely calculate percentage change between current and previous values
 * Handles cases where previous is zero to avoid misleading +Infinity%
 */
export function calculateDelta(current: number, previous: number): ComparisonDelta {
  if (previous === 0) {
    if (current > 0) {
      return {
        formatted: "+100%",
        trend: "up",
        rawPercent: 100,
      };
    }
    return {
      formatted: "0.0%",
      trend: "neutral",
      rawPercent: 0,
    };
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = delta > 0.05;
  const isDown = delta < -0.05;

  return {
    formatted: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
    trend: isUp ? "up" : isDown ? "down" : "neutral",
    rawPercent: delta,
  };
}

/**
 * Returns formatted ISO dates for standard presets
 */
export function getPresetDateRange(preset: DatePeriod): {
  startDate?: string;
  endDate?: string;
  prevStartDate?: string;
  prevEndDate?: string;
  label: string;
  comparisonLabel: string;
  backendPeriod?: string;
} {
  const now = new Date();
  const formatIso = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      const today = formatIso(now);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yDate = formatIso(yesterday);
      return {
        startDate: today,
        endDate: today,
        prevStartDate: yDate,
        prevEndDate: yDate,
        label: "Today",
        comparisonLabel: "vs yesterday",
        backendPeriod: "today",
      };
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yDate = formatIso(yesterday);

      const dayBefore = new Date(now);
      dayBefore.setDate(now.getDate() - 2);
      const dbDate = formatIso(dayBefore);

      return {
        startDate: yDate,
        endDate: yDate,
        prevStartDate: dbDate,
        prevEndDate: dbDate,
        label: "Yesterday",
        comparisonLabel: "vs prior day",
        backendPeriod: "yesterday",
      };
    }
    case "7d": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 7);

      const prevEnd = new Date(start);
      const prevStart = new Date(start);
      prevStart.setDate(start.getDate() - 7);

      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
        label: "Last 7 Days",
        comparisonLabel: "vs prior 7 days",
        backendPeriod: "custom",
      };
    }
    case "30d": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 30);

      const prevEnd = new Date(start);
      const prevStart = new Date(start);
      prevStart.setDate(start.getDate() - 30);

      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
        label: "Last 30 Days",
        comparisonLabel: "vs prior 30 days",
        backendPeriod: "custom",
      };
    }
    case "this_month":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
        label: "This Month",
        comparisonLabel: "vs last month",
        backendPeriod: "this_month",
      };
    }
  }
}
