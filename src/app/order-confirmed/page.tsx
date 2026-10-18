"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  ArrowRight, 
  Copy,
  Clock,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { trackPurchase } from "@/lib/metaPixel";
import { toast } from "sonner";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getOrder(orderNumber);
        setOrder(data);

        // Track Meta Pixel Purchase event with verified order details
        if (data) {
          trackPurchase({
            orderNumber: data.order_number || orderNumber,
            totalValue: Number(data.total_amount || 0),
            currency: "USD",
            items: (data.items || []).map((i: any) => ({
              id: i.product_id || i.id,
              name: i.product_name,
              price: Number(i.unit_price || 0),
              quantity: Number(i.quantity || 1),
            })),
            eventId: (data as any).event_id,
          });
        }
      } catch (err) {
        console.warn("Order fetch warning:", err);
        // Fallback to locally verified order session from checkout (preserves guest privacy without public order IDOR)
        if (typeof window !== "undefined") {
          try {
            const cached = sessionStorage.getItem(`order_confirmed_${orderNumber}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setOrder(parsed);
              if (parsed) {
                trackPurchase({
                  orderNumber: parsed.order_number || orderNumber,
                  totalValue: Number(parsed.total_amount || 0),
                  currency: "USD",
                  items: (parsed.items || []).map((i: any) => ({
                    id: i.product_id || i.id,
                    name: i.product_name,
                    price: Number(i.unit_price || 0),
                    quantity: Number(i.quantity || 1),
                  })),
                  eventId: (parsed as any).event_id,
                });
              }
            }
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Order number copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    }
    if (s === "shipped" || s === "in_transit") {
      return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20";
    }
    if (s === "processing" || s === "confirmed") {
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    }
    if (s === "cancelled" || s === "refunded") {
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
    }
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-28 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading your order confirmation...</p>
      </div>
    );
  }

  const customerName = order?.customer_name || order?.user?.name || "Customer";
  const customerEmail = order?.customer_email || order?.user?.email || "";
  const displayOrderNumber = order?.order_number || orderNumber || "Pending";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
      
      {/* 1. Header & Confirmation Status */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-semibold text-slate-900 dark:text-white">{customerName}</span>! We&apos;ve received your order and are preparing it for delivery.
            {customerEmail && (
              <> A confirmation email has been sent to <span className="font-semibold text-slate-900 dark:text-white">{customerEmail}</span>.</>
            )}
          </p>
        </div>
      </div>

      {/* 2. Order Summary Card */}
      <div className="bg-white dark:bg-[#0f131f] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
        
        {/* Order Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/5">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Order Number
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                #{displayOrderNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(displayOrderNumber)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Copy order number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {order?.created_at && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Placed on {formatDate(order.created_at)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Order Status
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(order?.order_status || "pending")}`}>
                {order?.order_status || "Pending"}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Estimated Delivery
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                2-3 Business Days
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Details Banner (if active) */}
        {order?.tracking_code && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {order.carrier || "Courier Service"}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Tracking: {order.tracking_code}
                </span>
              </div>
            </div>

            <Link
              href={`/track?number=${order.tracking_code}`}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center transition-colors self-start sm:self-auto"
            >
              Track Package →
            </Link>
          </div>
        )}

        {order ? (
          <>
            {/* Ordered Items List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Items in Your Order
              </h2>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.product_name}
                          </h3>
                          {item.variant_name && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.variant_name}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Qty: {item.quantity} • {formatPrice(item.unit_price)}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {formatPrice(item.total_price)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                    Items are confirmed and registered in our order system.
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="pt-4 border-t border-dashed border-gray-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatPrice(order.subtotal || 0)}
                </span>
              </div>

              {order.discount_amount && order.discount_amount > 0 ? (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount || 0)}
                </span>
              </div>

              {order.tax_amount && order.tax_amount > 0 ? (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatPrice(order.tax_amount)}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-white/10">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {order.payment_status === "paid" ? "Total Paid" : "Amount Due on Delivery"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {order.payment_method === "cash_on_delivery"
                      ? (order.payment_status === "paid" ? "Cash on Delivery • Paid" : "Cash on Delivery • Due upon receipt")
                      : (order.payment_status === "paid" ? "Online Payment • Paid" : "Payment Pending")}
                  </span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatPrice(order.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Delivery Destination */}
            {order.shipping_address && (
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 text-xs space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery Destination:
                </span>
                <div className="pl-5 text-slate-600 dark:text-slate-300 space-y-0.5">
                  {order.shipping_address.full_name && (
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {order.shipping_address.full_name}
                    </p>
                  )}
                  {order.shipping_address.address_line1 && (
                    <p>{order.shipping_address.address_line1}</p>
                  )}
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code, order.shipping_address.country].filter(Boolean).join(", ")}
                  </p>
                  {order.customer_phone && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-0.5">
                      Phone: {order.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3 text-xs">
            <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">Privacy & Account Security</p>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                  Itemized pricing, product lines, and address details are securely hidden because this session is unauthenticated or the checkout session has expired.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Your order is registered in our system and a complete confirmation receipt was dispatched to your email.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
              <Link
                href={`/track?number=${displayOrderNumber}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
              >
                <Truck className="w-3.5 h-3.5" /> Track Fulfillment Status →
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors"
              >
                Sign In to Customer Account
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* 3. Bottom Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors shadow-sm"
        >
          View in Dashboard
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold text-center transition-colors shadow-sm flex items-center justify-center gap-1.5"
        >
          Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Order Confirmation...</div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
