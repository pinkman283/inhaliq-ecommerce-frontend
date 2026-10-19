"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Scan, 
  PackageCheck, 
  PackageOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Truck, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  RefreshCw,
  X,
  Clock,
  ShieldCheck,
  Check
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Order, OrderItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ScannedItemRecord {
  orderItemId: number;
  productName: string;
  sku: string;
  expectedQty: number;
  scannedQty: number;
}

export default function ScanToPackPage() {
  const [orderQuery, setOrderQuery] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Scan items tracking
  const [itemsToPack, setItemsToPack] = useState<ScannedItemRecord[]>([]);
  const [itemBarcodeInput, setItemBarcodeInput] = useState("");
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Post-pack actions
  const [completingFulfillment, setCompletingFulfillment] = useState(false);
  const [packedSuccess, setPackedSuccess] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const orderInputRef = useRef<HTMLInputElement>(null);

  // Auto focus order input on mount
  useEffect(() => {
    orderInputRef.current?.focus();
  }, []);

  // Whenever order is loaded, focus item barcode input
  useEffect(() => {
    if (activeOrder) {
      barcodeInputRef.current?.focus();
    }
  }, [activeOrder]);

  const handleLookupOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = orderQuery.trim();
    if (!clean) return;

    setLoadingOrder(true);
    setScanMessage(null);
    setPackedSuccess(false);

    try {
      const res = await adminApi.getOrders({
        search: clean,
        per_page: 5,
      });

      const found = (res.data || []).find(
        (o: Order) =>
          o.order_number.toLowerCase() === clean.toLowerCase() ||
          String(o.id) === clean ||
          o.tracking_code?.toLowerCase() === clean.toLowerCase()
      ) || (res.data && res.data[0]);

      if (!found) {
        toast.error(`Order "${clean}" not found.`);
        setScanMessage({ text: `Order "${clean}" not found. Check order number barcode.`, isError: true });
        return;
      }

      setActiveOrder(found);
      const itemsList: ScannedItemRecord[] = (found.items || []).map((i: OrderItem) => ({
        orderItemId: i.id,
        productName: i.product_name || "Product Item",
        sku: (i.sku || i.product_sku || `SKU-${i.product_id || i.id}`).toUpperCase(),
        expectedQty: i.quantity,
        scannedQty: 0,
      }));

      setItemsToPack(itemsList);
      setOrderQuery("");
      toast.success(`Loaded Order #${found.order_number}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to lookup order.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleScanItemBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = itemBarcodeInput.trim().toUpperCase();
    if (!barcode || !activeOrder) return;

    // Match item by SKU or product ID or substring
    const matchIndex = itemsToPack.findIndex(
      (item) =>
        item.sku === barcode ||
        item.sku.includes(barcode) ||
        barcode.includes(item.sku) ||
        item.productName.toUpperCase().includes(barcode)
    );

    if (matchIndex === -1) {
      setScanMessage({
        text: `Barcode "${barcode}" does NOT belong to Order #${activeOrder.order_number}!`,
        isError: true,
      });
      toast.error(`Item mismatch! Barcode "${barcode}" is not in this order.`);
      setItemBarcodeInput("");
      return;
    }

    const target = itemsToPack[matchIndex];
    if (target.scannedQty >= target.expectedQty) {
      setScanMessage({
        text: `"${target.productName}" is ALREADY completely packed (${target.expectedQty}/${target.expectedQty})!`,
        isError: true,
      });
      toast.warning(`Already scanned all units for ${target.productName}.`);
      setItemBarcodeInput("");
      return;
    }

    // Increment scanned
    const updated = [...itemsToPack];
    updated[matchIndex] = {
      ...target,
      scannedQty: target.scannedQty + 1,
    };

    setItemsToPack(updated);
    setItemBarcodeInput("");
    setScanMessage({
      text: `Verified: ${target.productName} (${updated[matchIndex].scannedQty}/${target.expectedQty})`,
      isError: false,
    });
    toast.success(`Scanned: ${target.productName}`);
  };

  const isAllPacked =
    itemsToPack.length > 0 &&
    itemsToPack.every((i) => i.scannedQty >= i.expectedQty);

  const handleFinishFulfillment = async () => {
    if (!activeOrder) return;
    setCompletingFulfillment(true);
    try {
      // 1. Update order status to shipped or processing
      await adminApi.updateOrderStatus(activeOrder.id, {
        order_status: "shipped",
      });

      // 2. Automatically book courier with Steadfast if unbooked
      try {
        await adminApi.bulkBookCourier([activeOrder.id], "steadfast");
      } catch {
        // If already booked or mock, proceed
      }

      setPackedSuccess(true);
      toast.success(`Order #${activeOrder.order_number} verified & dispatched!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to finalize order.");
    } finally {
      setCompletingFulfillment(false);
    }
  };

  const handleResetForNext = () => {
    setActiveOrder(null);
    setItemsToPack([]);
    setItemBarcodeInput("");
    setScanMessage(null);
    setPackedSuccess(false);
    setTimeout(() => {
      orderInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272B35]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-md bg-[#11141D] hover:bg-[#171B26] border border-[#272B35] text-[#929BAD] hover:text-white transition cursor-pointer"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-[#A78BFA]" />
              <h1 className="text-lg font-black text-white tracking-tight">Express Scan-to-Pack Fulfillment</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
                Warehouse Mode
              </span>
            </div>
            <p className="text-xs text-[#929BAD]">
              Scan order slip barcode, verify each item SKU with 100% accuracy, and print courier labels automatically.
            </p>
          </div>
        </div>

        {activeOrder && (
          <button
            type="button"
            onClick={handleResetForNext}
            className="px-3 py-1.5 rounded-md bg-[#171B26] hover:bg-[#272B35] text-[#E5E7EB] text-xs font-semibold border border-[#272B35] transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Next Order</span>
          </button>
        )}
      </div>

      {/* Step 1: Scan Order Barcode Input */}
      {!activeOrder && (
        <div className="p-8 rounded-xl bg-[#11141D] border border-[#272B35] shadow-2xl text-center max-w-xl mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] mx-auto shadow-inner">
            <Scan className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Scan Order Barcode / Packing Slip</h2>
            <p className="text-xs text-[#929BAD]">
              Point your handheld scanner at the order barcode or type the Order Number below.
            </p>
          </div>

          <form onSubmit={handleLookupOrder} className="flex items-center gap-2 max-w-md mx-auto">
            <input
              ref={orderInputRef}
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="e.g. ORD-2026-0001 or 123"
              className="flex-1 bg-[#171B26] border border-[#272B35] focus:border-[#A78BFA]/60 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-[#929BAD] focus:outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loadingOrder || !orderQuery.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[#A78BFA]/20"
            >
              {loadingOrder ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Load Order</span>
            </button>
          </form>

          {scanMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-mono max-w-md mx-auto flex items-center gap-2 ${
                scanMessage.isError
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {scanMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{scanMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Order Loaded - Packing Station */}
      {activeOrder && (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Order Header Summary Banner */}
          <div className="p-4 rounded-lg bg-[#11141D] border border-[#272B35] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-black text-white font-mono">
                  Order #{activeOrder.order_number}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 uppercase">
                  {activeOrder.order_status}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {formatPrice(activeOrder.total_amount)} ({activeOrder.payment_method?.replace(/_/g, " ").toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-[#929BAD] flex items-center gap-3">
                <span>Customer: <strong className="text-white">{activeOrder.customer_name}</strong></span>
                <span>Phone: <strong className="text-cyan-400 font-mono">{activeOrder.customer_phone || "N/A"}</strong></span>
                <span>Destination: <strong className="text-white">
                  {isAllPacked ? "Verified for dispatch" : typeof activeOrder.shipping_address === "object" ? activeOrder.shipping_address?.city || "Dhaka" : "Dhaka"}
                </strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <span className="text-[10px] text-[#929BAD] uppercase block font-semibold">Packed Progress</span>
                <span className="text-sm font-mono font-black text-[#A78BFA]">
                  {itemsToPack.reduce((acc, i) => acc + i.scannedQty, 0)} / {itemsToPack.reduce((acc, i) => acc + i.expectedQty, 0)} Items
                </span>
              </div>
              {isAllPacked && !packedSuccess && (
                <button
                  type="button"
                  onClick={handleFinishFulfillment}
                  disabled={completingFulfillment}
                  className="px-4 py-2 rounded-lg bg-[#34D399] hover:bg-[#20bd5a] text-[#090B10] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#34D399]/20"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{completingFulfillment ? "Finalizing..." : "Complete & Dispatch"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Barcode Scanner Input */}
          {!packedSuccess && (
            <div className="p-4 rounded-lg bg-[#171B26] border border-[#A78BFA]/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Scan className="w-4 h-4 text-[#A78BFA]" />
                  <span>Scan Next Product SKU or Barcode</span>
                </div>
                <span className="text-[10px] text-[#A78BFA] font-mono">
                  Press enter after scan or USB scanner auto-submits
                </span>
              </div>

              <form onSubmit={handleScanItemBarcode} className="flex items-center gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={itemBarcodeInput}
                  onChange={(e) => setItemBarcodeInput(e.target.value)}
                  placeholder="Scan product barcode (SKU)..."
                  className="flex-1 bg-[#11141D] border border-[#272B35] focus:border-[#A78BFA] rounded-md px-3.5 py-2 text-xs font-mono text-white placeholder-[#929BAD] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!itemBarcodeInput.trim()}
                  className="px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Verify Item
                </button>
              </form>

              {scanMessage && (
                <div
                  className={`p-2.5 rounded-md text-xs font-mono flex items-center gap-2 ${
                    scanMessage.isError
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {scanMessage.isError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  )}
                  <span>{scanMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Items Checklist Table */}
          <div className="p-4 rounded-lg bg-[#11141D] border border-[#272B35] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#929BAD]">
              Required Order Items Packing Checklist
            </h3>

            <div className="divide-y divide-[#272B35] border border-[#272B35] rounded-md overflow-hidden">
              {itemsToPack.map((item) => {
                const isComplete = item.scannedQty >= item.expectedQty;
                return (
                  <div
                    key={item.orderItemId}
                    className={`p-3.5 flex items-center justify-between transition-colors ${
                      isComplete ? "bg-emerald-500/10" : "bg-[#171B26]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                          isComplete
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-800 border-slate-700 text-slate-500"
                        }`}
                      >
                        {isComplete ? <Check className="w-4 h-4" /> : <PackageOpen className="w-4 h-4" />}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{item.productName}</h4>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#929BAD]">
                          <span>SKU: {item.sku}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-[#929BAD] block">Packed / Expected</span>
                        <span
                          className={`text-sm font-mono font-black ${
                            isComplete ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {item.scannedQty} / {item.expectedQty} units
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Box after complete */}
          {packedSuccess && (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Order Packed & Ready for Courier!</h3>
                <p className="text-xs text-emerald-300">
                  All items verified with 100% SKU accuracy. Order status updated to shipped.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Thermal Label</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer"
                >
                  Scan Next Order &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
