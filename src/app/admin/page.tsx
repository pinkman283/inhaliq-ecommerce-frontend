"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { 
  AdminAnalytics, 
  FinancialSummary, 
  AuditLog, 
  Integration, 
  Order, 
  Product 
} from "@/types";
import { 
  DashboardHeader,
  ExecutiveKpiStrip,
  OrderStatusPipeline,
  RevenuePerformanceChart,
  RecentOrdersWidget,
  ProductAndInventoryGrid,
  FinancialBreakdownCard,
  MarketingAndAttributionCard,
  SystemHealthAndActivity,
  DateRangeState,
  getPresetDateRange,
  calculateDelta,
  ComparisonDelta
} from "@/components/admin/dashboard";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminDashboardOverview() {
  // 1. Date Range State
  const defaultPreset = getPresetDateRange("this_month");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    period: "this_month",
    startDate: defaultPreset.startDate,
    endDate: defaultPreset.endDate,
    label: defaultPreset.label,
    comparisonLabel: defaultPreset.comparisonLabel,
  });

  // 2. Data State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinancialSummary | null>(null);
  const [prevFinanceSummary, setPrevFinanceSummary] = useState<FinancialSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [couponRows, setCouponRows] = useState<any[]>([]);

  // 3. UI Status State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Security: Guarantee private admin pages are not indexed
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
  }, []);

  // Fetch Dashboard Telemetry with Graceful Partial-Failure Handling
  const fetchDashboardData = useCallback(async (currentRange: DateRangeState, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);

    try {
      // 1. Fetch Primary Analytics & Telemetry (stats, recent orders, top products, sales trend)
      const analyticsPromise = adminApi.getAnalytics().catch((err) => {
        console.error("Failed to fetch admin analytics:", err);
        return null;
      });

      // 2. Fetch Current Period Financial Statement
      const finParams = currentRange.period === "custom"
        ? { date_from: currentRange.startDate, date_to: currentRange.endDate }
        : { period: getPresetDateRange(currentRange.period).backendPeriod || currentRange.period };

      const financePromise = adminApi.getFinanceSummary(finParams).catch((err) => {
        console.error("Failed to fetch current finance summary:", err);
        return null;
      });

      // 3. Fetch Previous Period Financial Statement for Accurate Comparison %
      const presetInfo = getPresetDateRange(currentRange.period);
      let prevFinParams: { period?: string; date_from?: string; date_to?: string } = { period: "last_month" };

      if (currentRange.period === "this_month") {
        prevFinParams = { period: "last_month" };
      } else if (currentRange.period === "today") {
        prevFinParams = { period: "yesterday" };
      } else if (presetInfo.prevStartDate && presetInfo.prevEndDate) {
        prevFinParams = { date_from: presetInfo.prevStartDate, date_to: presetInfo.prevEndDate };
      }

      const prevFinancePromise = adminApi.getFinanceSummary(prevFinParams).catch((err) => {
        console.error("Failed to fetch previous finance summary:", err);
        return null;
      });

      // 4. Fetch Audit Logs
      const auditLogsPromise = adminApi.getAuditLogs({ per_page: 6 }).catch((err) => {
        console.warn("Failed to fetch audit logs:", err);
        return null;
      });

      // 5. Fetch Integrations
      const integrationsPromise = adminApi.getIntegrations().catch((err) => {
        console.warn("Failed to fetch integrations:", err);
        return null;
      });

      // 6. Fetch Coupon Performance Report
      const couponsPromise = adminApi.getReport("coupons", {
        start_date: currentRange.startDate,
        end_date: currentRange.endDate,
      }).catch((err) => {
        console.warn("Coupon report not available:", err);
        return null;
      });

      // Await all concurrently
      const [
        analyticsRes,
        financeRes,
        prevFinanceRes,
        auditLogsRes,
        integrationsRes,
        couponsRes,
      ] = await Promise.all([
        analyticsPromise,
        financePromise,
        prevFinancePromise,
        auditLogsPromise,
        integrationsPromise,
        couponsPromise,
      ]);

      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
      if (financeRes) {
        setFinanceSummary(financeRes);
      }
      if (prevFinanceRes) {
        setPrevFinanceSummary(prevFinanceRes);
      }
      if (auditLogsRes?.logs?.data) {
        setAuditLogs(auditLogsRes.logs.data);
      }
      if (integrationsRes?.integrations) {
        setIntegrations(integrationsRes.integrations);
      }
      if (couponsRes?.rows) {
        setCouponRows(couponsRes.rows);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setFetchError("Could not refresh some dashboard telemetry. Check network connectivity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [fetchDashboardData, dateRange]);

  // Handle Date Range Updates
  const handleDateRangeChange = (newRange: DateRangeState) => {
    setDateRange(newRange);
  };

  // Handle Manual Refresh
  const handleRefresh = () => {
    fetchDashboardData(dateRange, true);
  };

  // Derived Metrics & Safe Comparison Calculations
  const finMetrics = financeSummary?.metrics;
  const prevFinMetrics = prevFinanceSummary?.metrics;

  const netSales = finMetrics?.net_sales ?? analytics?.stats.total_revenue ?? 0;
  const grossSales = finMetrics?.gross_sales;
  const discounts = finMetrics?.discounts ?? 0;
  const refunds = finMetrics?.refunds ?? 0;

  const totalOrders = finMetrics?.total_orders ?? analytics?.stats.total_orders ?? 0;
  const avgOrderValue = finMetrics?.avg_order_value ?? (totalOrders > 0 ? netSales / totalOrders : 0);

  const operatingProfit = finMetrics?.operating_profit ?? 0;
  const netMarginPercentage = finMetrics?.net_margin_percentage ?? 0;

  const onlineSales = financeSummary?.channels?.online?.sales ?? netSales;
  const posSales = financeSummary?.channels?.pos?.sales ?? 0;
  const onlineOrdersCount = financeSummary?.channels?.online?.orders_count ?? totalOrders;
  const posOrdersCount = financeSummary?.channels?.pos?.orders_count ?? 0;

  // Comparison Deltas (safely preventing misleading infinity)
  const salesDelta: ComparisonDelta | undefined = prevFinMetrics
    ? calculateDelta(netSales, prevFinMetrics.net_sales)
    : undefined;

  const ordersDelta: ComparisonDelta | undefined = prevFinMetrics
    ? calculateDelta(totalOrders, prevFinMetrics.total_orders)
    : undefined;

  const profitDelta: ComparisonDelta | undefined = prevFinMetrics
    ? calculateDelta(operatingProfit, prevFinMetrics.operating_profit)
    : undefined;

  // Stats from analytics or safe fallbacks
  const stats = analytics?.stats || {
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    total_products: 0,
    low_stock_count: 0,
    pending_orders: 0,
    confirmed_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    refunded_orders: 0,
    pending_payments: 0,
    paid_payments: 0,
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Global Controls */}
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        lastUpdated={lastUpdated}
      />

      {/* Partial Failure Warning Banner */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="font-bold underline hover:text-amber-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Executive KPI Strip (Phase 3 B) */}
      <ExecutiveKpiStrip
        netSales={netSales}
        grossSales={grossSales}
        discounts={discounts}
        refunds={refunds}
        totalOrders={totalOrders}
        avgOrderValue={avgOrderValue}
        onlineOrdersCount={onlineOrdersCount}
        posOrdersCount={posOrdersCount}
        operatingProfit={operatingProfit}
        netMarginPercentage={netMarginPercentage}
        pendingOrdersCount={stats.pending_orders ?? 0}
        pendingPaymentsCount={stats.pending_payments ?? 0}
        lowStockCount={stats.low_stock_count ?? 0}
        totalProducts={stats.total_products ?? 0}
        totalCustomers={stats.total_customers ?? 0}
        salesDelta={salesDelta}
        ordersDelta={ordersDelta}
        profitDelta={profitDelta}
        comparisonPeriodLabel={dateRange.comparisonLabel}
        isLoading={loading}
      />

      {/* 3. Operational Fulfillment Pipeline (Phase 3 D) */}
      <OrderStatusPipeline
        pendingCount={stats.pending_orders ?? 0}
        confirmedCount={stats.confirmed_orders ?? 0}
        processingCount={stats.processing_orders ?? 0}
        shippedCount={stats.shipped_orders ?? 0}
        deliveredCount={stats.delivered_orders ?? 0}
        cancelledCount={stats.cancelled_orders ?? 0}
        pendingPaymentCount={stats.pending_payments ?? 0}
      />

      {/* 4. Sales Velocity & Channel Performance (Phase 3 C) */}
      <RevenuePerformanceChart
        data={analytics?.sales_trend || []}
        onlineSales={onlineSales}
        posSales={posSales}
        onlineOrdersCount={onlineOrdersCount}
        posOrdersCount={posOrdersCount}
        isLoading={loading}
      />

      {/* 5. Order Operations Recent Stream (Phase 3 D) */}
      <RecentOrdersWidget
        orders={analytics?.recent_orders || []}
        isLoading={loading}
      />

      {/* 6. Product & Inventory Intelligence (Phase 3 E) */}
      <ProductAndInventoryGrid
        topProducts={analytics?.top_products || []}
        lowStockCount={stats.low_stock_count ?? 0}
        totalProducts={stats.total_products ?? 0}
        isLoading={loading}
      />

      {/* 7. Accounting & Financial Visibility (Phase 3 G) */}
      <FinancialBreakdownCard
        summary={financeSummary}
        isLoading={loading}
      />

      {/* 8. Customers, Promotions & Marketing Attribution (Phase 3 F) */}
      <MarketingAndAttributionCard
        couponRows={couponRows}
        isLoading={loading}
      />

      {/* 9. Activity, Alerts and System Health (Phase 3 H) */}
      <SystemHealthAndActivity
        auditLogs={auditLogs}
        integrations={integrations}
        isLoading={loading}
      />

    </div>
  );
}
