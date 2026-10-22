"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  RefreshCw,
  ExternalLink,
  Printer,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  MapPin,
  Phone,
  DollarSign,
  Scale,
  PackageCheck,
  Check,
  Copy,
} from "lucide-react";
import { Order } from "@/types";
import { adminApi } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface BulkCourierDispatchModalProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onSuccess: () => void;
  onPrintLabels?: (orderIds: number[]) => void;
}

interface OrderRowConfig {
  id: number;
  cod_amount: number;
  weight: number;
  recipient_city_id?: number | null;
  recipient_zone_id?: number | null;
  recipient_area_id?: number | null;
  recipient_address?: string;
  recipient_phone?: string;
  notes?: string;
}

export function BulkCourierDispatchModal({
  isOpen,
  orders,
  onClose,
  onSuccess,
  onPrintLabels,
}: BulkCourierDispatchModalProps) {
  const [provider, setProvider] = useState<"pathao" | "steadfast">("pathao");
  const [stage, setStage] = useState<"configure" | "dispatching" | "results">("configure");

  // Stores & Locations
  const [stores, setStores] = useState<Array<{ store_id: number; store_name: string; store_address: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [pathaoCities, setPathaoCities] = useState<Array<{ city_id: number; city_name: string }>>([]);
  const [cityZonesMap, setCityZonesMap] = useState<Record<number, Array<{ zone_id: number; zone_name: string }>>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Per-order configuration
  const [orderConfigs, setOrderConfigs] = useState<Record<number, OrderRowConfig>>({});

  // Dispatch Execution State
  const [isDispatching, setIsDispatching] = useState(false);
  const [results, setResults] = useState<Array<{
    order_id: number;
    order_number: string;
    success: boolean;
    consignment_id?: string;
    tracking_code?: string;
    tracking_url?: string;
    provider?: string;
    status?: string;
    cod_amount?: number;
    message?: string;
  }>>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [copiedConsignment, setCopiedConsignment] = useState<string | null>(null);

  // Initialize configurations from passed orders
  useEffect(() => {
    if (!isOpen || orders.length === 0) return;

    const initialMap: Record<number, OrderRowConfig> = {};
    orders.forEach((o) => {
      const isPaid = o.payment_status === "paid";
      const shipAddr = o.shipping_address;
      const addrStr = shipAddr
        ? [shipAddr.address_line1, shipAddr.city, shipAddr.state].filter(Boolean).join(", ")
        : "";

      initialMap[o.id] = {
        id: o.id,
        cod_amount: isPaid ? 0 : Number(o.total_amount) || 0,
        weight: 0.5,
        recipient_city_id: (o as any).shipping_city_id || null,
        recipient_zone_id: (o as any).shipping_zone_id || null,
        recipient_area_id: (o as any).shipping_area_id || null,
        recipient_address: addrStr,
        recipient_phone: o.customer_phone || shipAddr?.phone || "",
        notes: `Bulk dispatch - Order #${o.order_number}`,
      };
    });

    setOrderConfigs(initialMap);
    setStage("configure");
    setResults([]);
    setSuccessCount(0);
    setFailedCount(0);
  }, [isOpen, orders]);

  // Load Pathao Stores & Cities once modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        // Fetch Pathao cities
        const cityRes = await adminApi.getPathaoCities();
        if (isMounted && cityRes?.cities) {
          setPathaoCities(cityRes.cities);
        }

        // Fetch stores from first order courier options or available providers
        if (orders.length > 0) {
          const optsRes = await adminApi.getCourierOptions(orders[0].id);
          if (isMounted && optsRes?.providers) {
            const pathaoProv = optsRes.providers.find((p: any) => p.provider === "pathao");
            if (pathaoProv && Array.isArray(pathaoProv.stores) && pathaoProv.stores.length > 0) {
              setStores(pathaoProv.stores);
              setSelectedStoreId(String(pathaoProv.stores[0].store_id));
            }
          }
        }
      } catch (err) {
        console.warn("Could not load courier metadata:", err);
      } finally {
        if (isMounted) setLoadingMetadata(false);
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [isOpen, orders]);

  // Load zones dynamically on demand when a city is chosen
  const loadZonesForCity = async (cityId: number) => {
    if (cityZonesMap[cityId]) return cityZonesMap[cityId];
    try {
      const res = await adminApi.getPathaoZones(cityId);
      const zones = res?.zones || [];
      setCityZonesMap((prev) => ({ ...prev, [cityId]: zones }));
      return zones;
    } catch (err) {
      console.error(`Failed to load zones for city ${cityId}:`, err);
      return [];
    }
  };

  const handleUpdateConfig = (orderId: number, field: keyof OrderRowConfig, value: any) => {
    setOrderConfigs((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const handleCityChange = async (orderId: number, cityId: number) => {
    handleUpdateConfig(orderId, "recipient_city_id", cityId);
    handleUpdateConfig(orderId, "recipient_zone_id", null);
    if (cityId) {
      await loadZonesForCity(cityId);
    }
  };

  // Quick auto-match for Dhaka
  const handleQuickAssignDhaka = async (orderId: number) => {
    const dhakaCity = pathaoCities.find((c) => c.city_name.toLowerCase().includes("dhaka"));
    if (dhakaCity) {
      await handleCityChange(orderId, dhakaCity.city_id);
    }
  };

  // Computed summary metrics
  const summary = useMemo(() => {
    let totalCod = 0;
    let totalWeight = 0;
    let readyCount = 0;
    let missingInfoCount = 0;

    orders.forEach((o) => {
      const cfg = orderConfigs[o.id];
      if (!cfg) return;

      totalCod += Number(cfg.cod_amount) || 0;
      totalWeight += Number(cfg.weight) || 0.5;

      if (provider === "pathao") {
        if (cfg.recipient_city_id && cfg.recipient_zone_id) {
          readyCount++;
        } else {
          missingInfoCount++;
        }
      } else {
        readyCount++;
      }
    });

    return {
      totalOrders: orders.length,
      totalCod,
      totalWeight: Number(totalWeight.toFixed(2)),
      readyCount,
      missingInfoCount,
      canDispatch: provider === "steadfast" || missingInfoCount === 0,
    };
  }, [orders, orderConfigs, provider]);

  // Execute Bulk Dispatch
  const handleExecuteBulkDispatch = async () => {
    if (orders.length === 0) return;
    if (provider === "pathao" && summary.missingInfoCount > 0) {
      toast.error(`Please select City and Zone for all ${summary.missingInfoCount} pending order(s) before dispatching to Pathao.`);
      return;
    }

    setIsDispatching(true);
    setStage("dispatching");

    try {
      const preparedOrders = orders.map((o) => {
        const cfg = orderConfigs[o.id] || {
          id: o.id,
          cod_amount: o.payment_status === "paid" ? 0 : Number(o.total_amount),
          weight: 0.5,
        };

        return {
          id: o.id,
          cod_amount: cfg.cod_amount,
          weight: cfg.weight,
          recipient_city_id: cfg.recipient_city_id,
          recipient_zone_id: cfg.recipient_zone_id,
          recipient_area_id: cfg.recipient_area_id,
          recipient_address: cfg.recipient_address,
          recipient_phone: cfg.recipient_phone,
          notes: cfg.notes,
        };
      });

      const res = await adminApi.bulkBookCourier({
        provider,
        pickup_store_id: provider === "pathao" && selectedStoreId ? selectedStoreId : undefined,
        orders: preparedOrders,
      });

      setResults(res.results || []);
      setSuccessCount(res.success_count || 0);
      setFailedCount(res.failed_count || 0);
      setStage("results");

      if (res.success_count > 0) {
        toast.success(`Successfully booked ${res.success_count} consignment(s) with ${provider.toUpperCase()}!`);
      }
      if (res.failed_count > 0) {
        toast.error(`${res.failed_count} order(s) could not be booked. Check report.`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Bulk courier dispatch failed.";
      toast.error(msg);
      setStage("configure");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyConsignment = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedConsignment(code);
    toast.success("Consignment ID copied to clipboard");
    setTimeout(() => setCopiedConsignment(null), 2000);
  };

  const handleFinishAndRefresh = () => {
    onSuccess();
    onClose();
  };

  const handlePrintSuccessfulLabels = () => {
    const successfulIds = results.filter((r) => r.success).map((r) => r.order_id);
    if (successfulIds.length > 0 && onPrintLabels) {
      onPrintLabels(successfulIds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl max-h-[92vh] bg-[#0c0e14] border border-white/[0.08] rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-courier-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0f121b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="bulk-courier-title" className="text-base font-bold text-white tracking-tight">
                  Bulk Courier Direct Dispatch
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch batch shipments directly to Pathao or Steadfast courier API with automatic tracking assignment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDispatching}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition disabled:opacity-40 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STAGE 1: CONFIGURE & REVIEW */}
          {stage === "configure" && (
            <div className="space-y-6">
              {/* Provider Selector & Store Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Courier Provider Toggle */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#A78BFA]" />
                    Select Courier Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setProvider("pathao")}
                      className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        provider === "pathao"
                          ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                          : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Pathao Courier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider("steadfast")}
                      className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        provider === "steadfast"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Steadfast Courier</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {provider === "pathao"
                      ? "Direct dispatch via Pathao Aladdin API. Requires City & Zone selection for each consignment."
                      : "Direct dispatch via Steadfast Courier API. Instant consignment creation across all 64 districts."}
                  </p>
                </div>

                {/* Pickup Hub / Store for Pathao */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      Pickup Hub (Merchant Store)
                    </span>
                    {loadingMetadata && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Loading hubs...
                      </span>
                    )}
                  </label>

                  {provider === "pathao" ? (
                    stores.length > 0 ? (
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full bg-[#121622] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#A78BFA] transition"
                      >
                        {stores.map((s) => (
                          <option key={s.store_id} value={s.store_id}>
                            {s.store_name} ({s.store_address})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>No pickup hubs found. Default registered store will be used.</span>
                      </div>
                    )
                  ) : (
                    <div className="py-2.5 text-xs text-slate-400">
                      Steadfast uses your default primary pickup address registered with your merchant account.
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Courier status will automatically switch orders to <strong>Shipped</strong>.</span>
                  </div>
                </div>
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-[#A78BFA]" /> Total Parcels
                  </span>
                  <p className="text-xl font-black text-white mt-1">{summary.totalOrders}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Total COD to Collect
                  </span>
                  <p className="text-xl font-black text-emerald-400 mt-1">{formatPrice(summary.totalCod)}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-sky-400" /> Est. Total Weight
                  </span>
                  <p className="text-xl font-black text-sky-400 mt-1">{summary.totalWeight} kg</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  provider === "pathao" && summary.missingInfoCount > 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    {provider === "pathao" && summary.missingInfoCount > 0 ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Readiness
                  </span>
                  <p className="text-xl font-black mt-1">
                    {provider === "pathao" && summary.missingInfoCount > 0
                      ? `${summary.missingInfoCount} Need Zone`
                      : "Ready to Dispatch"}
                  </p>
                </div>
              </div>

              {/* Order Consignment Table */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d101a]">
                <div className="px-4 py-3 bg-[#111420] border-b border-white/[0.06] flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Consignment Review ({orders.length} Parcels)
                  </h4>
                  {provider === "pathao" && pathaoCities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const dhaka = pathaoCities.find((c) => c.city_name.toLowerCase().includes("dhaka"));
                        if (dhaka) {
                          orders.forEach((o) => {
                            if (!orderConfigs[o.id]?.recipient_city_id) {
                              handleQuickAssignDhaka(o.id);
                            }
                          });
                        }
                      }}
                      className="text-[11px] font-bold text-[#A78BFA] hover:text-purple-300 underline underline-offset-2 cursor-pointer transition"
                    >
                      Quick-Set Dhaka for unassigned
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto max-h-[360px] divide-y divide-white/[0.04]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090b10] text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer & Phone</th>
                        <th className="py-2.5 px-3">Delivery Address</th>
                        {provider === "pathao" && (
                          <th className="py-2.5 px-3 min-w-[220px]">Pathao City & Zone</th>
                        )}
                        <th className="py-2.5 px-3 w-28 text-right">COD (৳)</th>
                        <th className="py-2.5 px-3 w-24 text-right">Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {orders.map((o) => {
                        const cfg = orderConfigs[o.id] || {
                          id: o.id,
                          cod_amount: 0,
                          weight: 0.5,
                        };
                        const hasCityZone = cfg.recipient_city_id && cfg.recipient_zone_id;
                        const availableZones = cfg.recipient_city_id
                          ? cityZonesMap[cfg.recipient_city_id] || []
                          : [];

                        return (
                          <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Order # */}
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              #{o.order_number}
                              <div className="text-[10px] font-normal text-slate-400">
                                {o.payment_status === "paid" ? (
                                  <span className="text-emerald-400">Paid (Online)</span>
                                ) : (
                                  <span className="text-amber-400">COD (Unpaid)</span>
                                )}
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-200">{o.customer_name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {cfg.recipient_phone || o.customer_phone || "N/A"}
                              </div>
                            </td>

                            {/* Address */}
                            <td className="py-3 px-3 max-w-xs">
                              <div className="text-slate-300 truncate" title={cfg.recipient_address}>
                                {cfg.recipient_address || "Customer Address"}
                              </div>
                            </td>

                            {/* Pathao City & Zone Picker */}
                            {provider === "pathao" && (
                              <td className="py-3 px-3">
                                <div className="space-y-1.5">
                                  {/* City Selector */}
                                  <select
                                    value={cfg.recipient_city_id || ""}
                                    onChange={(e) => handleCityChange(o.id, Number(e.target.value))}
                                    className="w-full bg-[#161a29] border border-white/10 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#A78BFA]"
                                  >
                                    <option value="">-- Select City --</option>
                                    {pathaoCities.map((c) => (
                                      <option key={c.city_id} value={c.city_id}>
                                        {c.city_name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Zone Selector */}
                                  {cfg.recipient_city_id && (
                                    <select
                                      value={cfg.recipient_zone_id || ""}
                                      onChange={(e) => handleUpdateConfig(o.id, "recipient_zone_id", Number(e.target.value))}
                                      className="w-full bg-[#161a29] border border-white/10 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#A78BFA]"
                                    >
                                      <option value="">-- Select Zone --</option>
                                      {availableZones.map((z) => (
                                        <option key={z.zone_id} value={z.zone_id}>
                                          {z.zone_name}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {!hasCityZone && (
                                    <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Required for Pathao
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* COD Amount */}
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={cfg.cod_amount}
                                onChange={(e) => handleUpdateConfig(o.id, "cod_amount", Number(e.target.value))}
                                className="w-24 text-right bg-[#161a29] border border-white/10 rounded px-2 py-1 font-mono text-xs text-white focus:outline-none focus:border-[#A78BFA]"
                              />
                            </td>

                            {/* Weight */}
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={cfg.weight}
                                onChange={(e) => handleUpdateConfig(o.id, "weight", Number(e.target.value))}
                                className="w-20 text-right bg-[#161a29] border border-white/10 rounded px-2 py-1 font-mono text-xs text-white focus:outline-none focus:border-[#A78BFA]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: DISPATCHING PROGRESS */}
          {stage === "dispatching" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] animate-pulse">
                  <Truck className="w-8 h-8 animate-bounce" />
                </div>
                <RefreshCw className="w-6 h-6 text-[#A78BFA] animate-spin absolute -top-1 -right-1" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Dispatching {orders.length} Parcels to {provider.toUpperCase()}...
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Acquiring OAuth tokens, validating addresses, locking consignments, and registering shipments with carrier logistics servers.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 3: RESULTS & CONSIGNMENT CODES */}
          {stage === "results" && (
            <div className="space-y-6">
              {/* Summary Results KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Processed</span>
                  <p className="text-xl font-black text-white mt-1">{results.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Booked Successfully</span>
                  <p className="text-xl font-black mt-1">{successCount}</p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  failedCount > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Failed / Skipped</span>
                  <p className="text-xl font-black mt-1">{failedCount}</p>
                </div>
              </div>

              {/* Consignments List */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d101a]">
                <div className="px-4 py-3 bg-[#111420] border-b border-white/[0.06] flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Consignment Manifest
                  </h4>
                  {successCount > 0 && onPrintLabels && (
                    <button
                      type="button"
                      onClick={handlePrintSuccessfulLabels}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Thermal Labels ({successCount})</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto max-h-[380px] divide-y divide-white/[0.04]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090b10] text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Consignment ID</th>
                        <th className="py-2.5 px-3">Tracking Link</th>
                        <th className="py-2.5 px-3">Details / Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {results.map((r) => (
                        <tr key={r.order_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            #{r.order_number}
                          </td>
                          <td className="py-3 px-3">
                            {r.success ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Booked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {r.consignment_id ? (
                              <div className="flex items-center gap-1.5">
                                <span>{r.consignment_id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyConsignment(r.consignment_id!)}
                                  className="text-slate-500 hover:text-white transition cursor-pointer p-0.5"
                                  title="Copy Consignment ID"
                                >
                                  {copiedConsignment === r.consignment_id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {r.tracking_url ? (
                              <a
                                href={r.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[#A78BFA] hover:text-purple-300 font-semibold underline underline-offset-2 transition"
                              >
                                <span>Track Live</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                            {r.message || (r.success ? "Consignment registered" : "Failed")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0f121b] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {stage === "configure" && (
              <span>
                Ready: <strong className="text-white">{summary.readyCount}</strong> / {summary.totalOrders}
              </span>
            )}
            {stage === "results" && (
              <span>
                Dispatch batch complete. {successCount} orders updated to <strong>Shipped</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {stage === "configure" && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDispatching}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDispatch}
                  disabled={isDispatching || !summary.canDispatch}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs transition-all shadow-lg cursor-pointer ${
                    summary.canDispatch
                      ? "bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-purple-500/20"
                      : "bg-white/10 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch All ({summary.totalOrders}) to {provider.toUpperCase()}</span>
                </button>
              </>
            )}

            {stage === "results" && (
              <>
                {successCount > 0 && onPrintLabels && (
                  <button
                    type="button"
                    onClick={handlePrintSuccessfulLabels}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Labels</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinishAndRefresh}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & Refresh Orders</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
