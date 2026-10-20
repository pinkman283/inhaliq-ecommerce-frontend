"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import TrackLoading from "./loading";
import { formatPrice, formatDate } from "@/lib/utils";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("number") || "";

  const [query, setQuery] = useState(initialQuery || "ORD-2026-98421");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (searchNumber: string) => {
    if (!searchNumber.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await api.trackOrder(searchNumber);
      setOrder(data);
    } catch (err: any) {
      setError("No tracking record found for this identifier. Please verify your order number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    } else {
      fetchTracking("ORD-2026-98421");
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const getStepIndex = (shipmentStatus?: string, orderStatus?: string) => {
    const s = (shipmentStatus || orderStatus || "").toLowerCase();
    switch (s) {
      case "pending":
      case "draft":
        return 0;
      case "booked":
      case "pickup_pending":
      case "processing":
        return 1;
      case "picked_up":
      case "in_transit":
      case "shipped":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStepIndex(order.shipment_status, order.order_status) : 0;

  const trackingSteps = [
    { title: "Order Confirmed", desc: "Order registered in system" },
    { title: "Consignment Booked", desc: "Dispatch request received by courier" },
    { title: "In Transit", desc: "Parcel moving through logistics hubs" },
    { title: "Out for Delivery", desc: "Assigned to delivery rider" },
    { title: "Delivered", desc: "Handed over and verified" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
          Live Logistics Telemetry
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Enter your order reference code (e.g. ORD-2026-XXXXX) or courier tracking number.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. ORD-2026-98421"
              className="w-full bg-[#0e121e] border border-white/15 rounded-2xl pl-9.5 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Tracking...</span>
              </>
            ) : (
              "Track"
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-center gap-2 max-w-md mx-auto text-center">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Tracking Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0e121e] border border-white/10 shadow-2xl space-y-8">
            
            {/* Top Logistics Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Courier Partner & Routing
                </span>
                <span className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Truck className="w-4 h-4 text-cyan-400" /> {order.carrier || "Courier Assignment in Progress"}
                </span>
                {order.tracking_code && (
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    Consignment ID: <span className="text-cyan-300 font-bold">{order.tracking_code}</span>
                  </span>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline mt-1.5 transition-colors"
                  >
                    <span>Track on Courier Portal</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recipient Destination
                </span>
                <span className="text-xs font-bold text-white block mt-0.5">{order.customer_name}</span>
                <span className="text-[11px] text-slate-400">{order.shipping_destination?.city}, {order.shipping_destination?.country}</span>
                <div className="mt-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.shipment_status === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.shipment_status === 'delivery_failed'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {order.shipment_status ? order.shipment_status.replace(/_/g, ' ') : order.order_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Failure/Return alert banner if applicable */}
            {order.failure_reason && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notice: {order.failure_reason} (Attempt: {order.delivery_attempts || 1})</span>
              </div>
            )}

            {/* Step Visualizer Timeline */}
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {trackingSteps.map((s, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={s.title} className="flex md:flex-col items-start gap-3 md:gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isCurrent
                              ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 animate-pulse"
                              : isCompleted
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-white/5 border-white/10 text-slate-600"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold ${isCompleted ? "text-white" : "text-slate-500"}`}>
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line items in order */}
            {order.items && (
              <div className="pt-6 border-t border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Hardware in this Shipment
                </span>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900"
                          />
                        )}
                        <div>
                          <h5 className="font-bold text-white">{item.product_name}</h5>
                          {item.variant_name && <p className="text-[10px] text-slate-400">{item.variant_name}</p>}
                        </div>
                      </div>
                      <span className="font-bold text-white">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrackOrderClient() {
  return (
    <Suspense fallback={<TrackLoading />}>
      <TrackOrderContent />
    </Suspense>
  );
}
