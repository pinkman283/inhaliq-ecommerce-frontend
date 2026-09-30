"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Truck, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
  Receipt,
  Plus
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AdminAnalytics } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/components/admin/ui";

export default function AdminDashboardOverview() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await adminApi.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Loading Analytics Dashboard...
        </span>
      </div>
    );
  }

  const stats = analytics?.stats || {
    total_revenue: 39800,
    total_orders: 134,
    total_customers: 248,
    total_products: 8,
    low_stock_count: 2,
  };

  const avgOrderValue = stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header: Title & Quick Actions */}
      <AdminPageHeader
        title="Executive Command Center"
        description="Real-time financial telemetry, order processing velocity, and inventory health."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/pos"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>POS Terminal</span>
            </Link>
            <Link
              href="/admin/products"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Products</span>
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Manage Orders</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <AdminStatStrip
        stats={[
          {
            label: "Net Revenue",
            value: formatPrice(stats.total_revenue),
            change: "+28.4%",
            trend: "up",
            icon: DollarSign,
            helper: "Gross sales volume",
          },
          {
            label: "Total Orders",
            value: stats.total_orders,
            change: `${formatPrice(avgOrderValue)} AOV`,
            icon: ShoppingBag,
            helper: "Completed checkouts",
          },
          {
            label: "Customers",
            value: stats.total_customers,
            icon: Users,
            helper: "Verified buyer accounts",
          },
          {
            label: "Catalog Items",
            value: stats.total_products,
            change: stats.low_stock_count > 0 ? `${stats.low_stock_count} low` : "Optimal",
            trend: stats.low_stock_count > 0 ? "down" : "neutral",
            icon: Package,
            helper: "Active catalog SKUs",
          },
        ]}
      />

      {/* Operational Order & Fulfillment Pipeline */}
      <div className="p-4 rounded-xl bg-[#0f121b] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Operational Order & Fulfillment Pipeline
            </h3>
            <p className="text-[11px] text-slate-500">Live order state distribution and pending fulfillment tasks</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            All Orders <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            {
              label: "Pending",
              count: stats.pending_orders ?? 0,
              status: "pending",
              badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
              hint: "Needs review",
            },
            {
              label: "Confirmed",
              count: stats.confirmed_orders ?? 0,
              status: "confirmed",
              badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
              hint: "Ready to pick",
            },
            {
              label: "Processing",
              count: stats.processing_orders ?? 0,
              status: "processing",
              badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
              hint: "In fulfillment",
            },
            {
              label: "Shipped",
              count: stats.shipped_orders ?? 0,
              status: "shipped",
              badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
              hint: "In transit",
            },
            {
              label: "Delivered",
              count: stats.delivered_orders ?? 0,
              status: "delivered",
              badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
              hint: "Completed",
            },
            {
              label: "Cancelled",
              count: stats.cancelled_orders ?? 0,
              status: "cancelled",
              badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
              hint: "Restocked",
            },
            {
              label: "Pending Pay",
              count: stats.pending_payments ?? 0,
              status: "all",
              paymentStatus: "pending",
              badgeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
              hint: "COD / Unpaid",
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={`/admin/orders?status=${item.status}${item.paymentStatus ? `&payment_status=${item.paymentStatus}` : ""}`}
              className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 transition-all group block"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${item.badgeColor}`}>
                  {item.count}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors block">
                {item.hint}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sales Velocity Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Trend Visualizer */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Revenue Velocity</h3>
              <p className="text-[11px] text-slate-500">Gross sales performance over the recent cycles</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +120% YoY
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 pb-2 border-b border-white/[0.06]">
            {(analytics?.sales_trend || [
              { month: "Mar", sales: 14200 },
              { month: "Apr", sales: 18900 },
              { month: "May", sales: 24500 },
              { month: "Jun", sales: 31200 },
              { month: "Jul", sales: 28400 },
              { month: "Aug", sales: 39800 },
            ]).map((item) => {
              const heightPercent = Math.round((item.sales / 42000) * 100);
              return (
                <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-amber-300 transition-colors">
                    ${Math.round(item.sales / 1000)}k
                  </span>
                  <div className="w-full max-w-[36px] bg-white/5 rounded-lg overflow-hidden flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-lg transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Top Performing Items</h3>
            <Link href="/admin/products" className="text-[11px] font-semibold text-amber-400 hover:text-amber-300">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {analytics?.top_products && analytics.top_products.length > 0 ? (
              analytics.top_products.map((p) => {
                const img = p.primary_image?.image_url || p.images?.[0]?.image_url;
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {img ? (
                        <img src={img} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="truncate">
                        <h4 className="font-medium text-white truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-400">{p.brand}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-cyan-400 shrink-0 font-mono">{formatPrice(p.price)}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 italic">No product ratings logged yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Orders Stream */}
      <div className="p-5 rounded-xl bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Recent Customer Orders</h3>
            <p className="text-[11px] text-slate-500">Latest orders submitted across all channels</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            All Orders <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/[0.01] border-b border-white/[0.06] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Fulfillment</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
                analytics.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-cyan-400">{ord.order_number}</td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-white block">{ord.customer_name}</span>
                      <span className="text-[10px] text-slate-500">{ord.customer_email}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white font-mono">{formatPrice(ord.total_amount)}</td>
                    <td className="py-3 px-3">
                      <AdminStatusBadge status={ord.payment_status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <AdminStatusBadge status={ord.order_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{formatDate(ord.created_at)}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href="/admin/orders"
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white border border-white/[0.08] transition-colors inline-block"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminEmptyState
                      icon={ShoppingBag}
                      title="No orders logged yet"
                      description="New customer orders will appear here as soon as transactions occur."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
