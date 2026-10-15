"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Calculator, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Coins, 
  Smartphone, 
  Receipt, 
  User, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw,
  ShoppingBag,
  Clock,
  Sparkles,
  X
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Order, PosReceipt, PosRegister, PosRegisterSession, Product, ProductVariant } from "@/types";

interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  unit_price: number;
  quantity: number;
  discount_amount: number;
}

export default function AdminPosPage() {
  const [registers, setRegisters] = useState<PosRegister[]>([]);
  const [session, setSession] = useState<PosRegisterSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatEnabled, setVatEnabled] = useState<boolean>(true);
  const [vatRate, setVatRate] = useState<number>(8.0);
  const [notes, setNotes] = useState("");

  // Modals
  const [openSessionModal, setOpenSessionModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(100);
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);

  const [closeSessionModal, setCloseSessionModal] = useState(false);
  const [actualClosingCash, setActualClosingCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState("");

  const [cashMovementModal, setCashMovementModal] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<"cash_in" | "cash_out" | "drop">("cash_in");
  const [cashMovementAmount, setCashMovementAmount] = useState<number>(0);
  const [cashMovementReason, setCashMovementReason] = useState("");

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "debit_card" | "mobile_money">("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const [receiptModal, setReceiptModal] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<PosReceipt | null>(null);

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [regs, currentSessionRes, catRes, settingsRes] = await Promise.all([
        adminApi.getPosRegisters(),
        adminApi.getCurrentPosSession(),
        adminApi.getCategories(),
        adminApi.getSettings().catch(() => ({} as Record<string, any>)),
      ]);
      setRegisters(regs);
      setSession(currentSessionRes.session);
      setCategories(catRes);
      if (settingsRes && typeof settingsRes === "object") {
        const s = settingsRes as Record<string, any>;
        if (s.vat_enabled !== undefined) {
          setVatEnabled(s.vat_enabled.value === "1" || s.vat_enabled.value === true);
        }
        if (s.vat_rate?.value !== undefined) {
          setVatRate(parseFloat(s.vat_rate.value) || 0);
        }
      }
      if (regs.length > 0 && !selectedRegisterId) {
        setSelectedRegisterId(regs[0].id);
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to initialize POS terminal.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminApi.getPosProducts({
        search: searchQuery || undefined,
        category_id: selectedCategory !== "all" ? selectedCategory : undefined,
      });
      setProducts(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisterId) return;
    try {
      const res = await adminApi.openPosSession(selectedRegisterId, openingFloat);
      setSession(res.session);
      setOpenSessionModal(false);
      showToast("success", res.message);
      fetchInitialData();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to open register.");
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await adminApi.closePosSession(session.id, actualClosingCash, closingNotes);
      setSession(null);
      setCloseSessionModal(false);
      showToast("success", res.message);
      fetchInitialData();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to close register.");
    }
  };

  const handleCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await adminApi.recordPosCashMovement(session.id, {
        type: cashMovementType,
        amount: cashMovementAmount,
        reason: cashMovementReason,
      });
      setSession(prev => prev ? { ...prev, expected_cash_balance: res.expected_cash_balance } : null);
      setCashMovementModal(false);
      setCashMovementAmount(0);
      setCashMovementReason("");
      showToast("success", res.message);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to record cash movement.");
    }
  };

  // Cart operations
  const addToCart = (product: Product, variant: ProductVariant | null = null) => {
    const existingIndex = cart.findIndex(item => 
      item.product.id === product.id && (item.variant?.id ?? null) === (variant?.id ?? null)
    );

    const price = variant ? (product.price + (variant.price_modifier || 0)) : product.price;

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        product,
        variant,
        unit_price: price,
        quantity: 1,
        discount_amount: 0,
      }]);
    }
  };

  const updateCartQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity - item.discount_amount), 0);
  const orderDiscount = discountType === "percentage"
    ? Math.min(subtotal, (subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
    : Math.min(subtotal, Math.max(0, discountValue));
  const taxAmount = vatEnabled ? Math.max(0, (subtotal - orderDiscount) * (vatRate / 100)) : 0;
  const totalAmount = Math.max(0, subtotal - orderDiscount) + taxAmount;
  const changeDue = Math.max(0, cashReceived - totalAmount);

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      showToast("error", "Cart is empty. Select products to ring up sale.");
      return;
    }
    setCashReceived(Math.ceil(totalAmount));
    setPaymentModal(true);
  };

  const handleExecuteSale = async (openPrintModal: boolean = false) => {
    if (cart.length === 0) {
      showToast("error", "Cart is empty.");
      return;
    }
    if (!session) {
      showToast("error", "Register session is not open.");
      return;
    }

    setIsProcessingSale(true);
    try {
      const payload = {
        pos_register_session_id: session.id,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : totalAmount,
        discount_amount: orderDiscount,
        tax_amount: taxAmount,
        notes: notes || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount_amount: item.discount_amount,
        })),
      };

      const res = await adminApi.checkoutPosSale(payload);
      
      // Update session live cash
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          cash_sales_amount: paymentMethod === "cash" ? prev.cash_sales_amount + totalAmount : prev.cash_sales_amount,
          card_sales_amount: (paymentMethod === "credit_card" || paymentMethod === "debit_card") ? prev.card_sales_amount + totalAmount : prev.card_sales_amount,
          mobile_sales_amount: paymentMethod === "mobile_money" ? prev.mobile_sales_amount + totalAmount : prev.mobile_sales_amount,
          expected_cash_balance: paymentMethod === "cash" ? prev.expected_cash_balance + totalAmount : prev.expected_cash_balance,
        };
      });

      // Clear cart
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountValue(0);
      setDiscountType("fixed");
      setNotes("");
      setPaymentModal(false);

      const invoiceNo = res.receipt?.invoice_number || res.order?.invoice_number || `INV-${res.order?.order_number}`;

      if (openPrintModal) {
        // Open printable invoice receipt modal
        setCompletedReceipt({
          ...res.receipt,
          invoice_number: invoiceNo,
        });
        setReceiptModal(true);
        showToast("success", `Sale Confirmed! Generated Invoice ${invoiceNo}`);
      } else {
        const changeMsg = res.receipt?.change > 0 ? ` • Change Due: $${res.receipt.change.toFixed(2)}` : "";
        showToast("success", `✓ Sale Confirmed & Logged to Sales! ${invoiceNo}${changeMsg}`);
      }

      // Refresh product stock
      fetchProducts();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to process sale.");
    } finally {
      setIsProcessingSale(false);
    }
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-md text-sm font-semibold flex items-center gap-3 border shadow-lg animate-in fade-in slide-in-from-top-2 ${
          statusMessage.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* POS Top Control Bar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-[#0d0f18] p-5 rounded-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">Point of Sale Terminal</h1>
              {session ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {session.register?.name || "Terminal Open"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  Drawer Closed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-speed retail cashier checkout connected directly to FIFO inventory layers and auditable revenue.
            </p>
          </div>
        </div>

        {/* Register Session Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {session ? (
            <>
              <div className="bg-[#151824] px-4 py-2 rounded-md border border-white/10 flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cash Drawer</span>
                  <span className="text-[#A78BFA] font-bold font-mono text-sm">
                    ${session.expected_cash_balance?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Shift Sales</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">
                    ${((session.cash_sales_amount || 0) + (session.card_sales_amount || 0) + (session.mobile_sales_amount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCashMovementModal(true)}
                className="px-3.5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Coins className="w-4 h-4 text-[#A78BFA]" />
                Cash In / Drop
              </button>

              <button
                onClick={() => {
                  setActualClosingCash(session.expected_cash_balance || 0);
                  setCloseSessionModal(true);
                }}
                className="px-4 py-2.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Lock className="w-4 h-4" />
                Close Shift
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpenSessionModal(true)}
              className="px-5 py-2.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#A78BFA]/20 transition"
            >
              <Unlock className="w-4 h-4" />
              Open Register Shift
            </button>
          )}
        </div>
      </div>

      {/* Main POS Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Product Search & Quick Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0d0f18] p-4 rounded-md border border-white/10 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Scan barcode, SKU, or search hardware name..."
                className="w-full bg-[#151824] border border-white/10 rounded-md pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === "all"
                    ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                }`}
              >
                All Departments
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id.toString()
                      ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-[#A78BFA]/20"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Searching inventory matrix...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#0d0f18] p-12 rounded-md border border-white/10 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No hardware found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search keyword or select all departments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {products.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-[#0d0f18] hover:bg-[#151824] p-3.5 rounded-md border border-white/10 hover:border-[#A78BFA]/40 cursor-pointer transition flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-lg"
                >
                  {/* Stock Indicator Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">
                      {product.sku || "PROD"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      product.stock_quantity > 10 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : product.stock_quantity > 0 
                        ? "bg-amber-500/10 text-amber-400" 
                        : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h4 className="text-xs font-bold text-white group-hover:text-[#B9A3FF] transition line-clamp-2 mb-3">
                    {product.name}
                  </h4>

                  {/* Price & Add */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-sm font-black text-[#A78BFA] font-mono">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="w-6 h-6 rounded-md bg-white/5 group-hover:bg-[#A78BFA] group-hover:text-[#090B10] text-slate-400 flex items-center justify-center transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active POS Cart & Billing Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d0f18] rounded-md border border-white/10 shadow-2xl flex flex-col justify-between min-h-[640px] sticky top-6">
          {/* Cart Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#A78BFA]" />
              <h3 className="text-sm font-bold text-white">Current Register Bill</h3>
              <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Customer Quick Lookup */}
          <div className="p-3.5 bg-[#12141e] border-b border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full bg-[#181b28] border border-white/10 rounded-md px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Optional Phone"
                className="w-full bg-[#181b28] border border-white/10 rounded-md px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 text-xs"
              />
            </div>
          </div>

          {/* Cart Item Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">Cart is currently empty</p>
                <p className="text-[11px] text-slate-600">Scan barcode or click items from catalog</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-[#151824] p-3 rounded-md border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ${item.unit_price.toFixed(2)} each {item.variant ? `(${item.variant.name})` : ""}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-[#0b0d14] p-1 rounded-md border border-white/10">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-[#A78BFA]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right font-mono min-w-[60px]">
                    <span className="font-bold text-white text-xs block">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Remove Item */}
                  <button 
                    onClick={() => removeFromCart(idx)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout Execution */}
          <div className="p-4 bg-[#12141e] border-t border-white/10 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
              </div>
              {/* Bill Discount Row: Fixed $ or Percent % */}
              <div className="space-y-1.5 pt-0.5 pb-1">
                <div className="flex justify-between text-slate-400 items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-300">Bill Discount</span>
                    <div className="inline-flex rounded-md bg-[#0b0d14] p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType("fixed");
                          if (discountType === "percentage" && discountValue > 0) {
                            setDiscountValue(parseFloat(orderDiscount.toFixed(2)));
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                          discountType === "fixed"
                            ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Fixed Amount Discount ($)"
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType("percentage");
                          if (discountType === "fixed" && discountValue > 0 && subtotal > 0) {
                            setDiscountValue(parseFloat(((discountValue / subtotal) * 100).toFixed(1)));
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                          discountType === "percentage"
                            ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Percentage Discount (%)"
                      >
                        %
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={discountType === "percentage" ? 100 : subtotal}
                      step={discountType === "percentage" ? "0.5" : "0.01"}
                      value={discountValue || ""}
                      onChange={e => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      className="w-16 bg-[#181b28] border border-white/10 rounded px-2 py-1 text-right text-amber-400 font-mono text-xs font-bold focus:outline-none focus:border-[#A78BFA]/50"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {discountType === "percentage" ? "%" : "$"}
                    </span>
                  </div>
                </div>

                {/* Quick Presets & Live Dollar Reduction Preview */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    {discountType === "percentage" ? (
                      [5, 10, 15, 20, 25].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transition cursor-pointer ${
                            discountValue === pct
                              ? "bg-[#211B32] border-[#A78BFA]/30 text-[#A78BFA]"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {pct}%
                        </button>
                      ))
                    ) : (
                      [5, 10, 20, 50].filter(amt => amt <= subtotal).map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscountValue(amt)}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transition cursor-pointer ${
                            discountValue === amt
                              ? "bg-[#211B32] border-[#A78BFA]/30 text-[#A78BFA]"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))
                    )}
                  </div>

                  {orderDiscount > 0 && (
                    <span className="font-mono text-rose-400 font-bold">
                      -${orderDiscount.toFixed(2)} off
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VAT {vatEnabled ? `(${vatRate}%)` : "(Disabled)"}</span>
                <span className="font-mono text-slate-200">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                <span>Total Payable</span>
                <span className="text-[#A78BFA] font-mono text-base">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              disabled={cart.length === 0 || !session}
              onClick={handleOpenPayment}
              className="w-full py-3.5 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#A78BFA]/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CreditCard className="w-4 h-4" />
              {session ? `PAY $${totalAmount.toFixed(2)} NOW` : "OPEN REGISTER TO CHECKOUT"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Open Register Session */}
      {openSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <Unlock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Open Cash Register Shift</h3>
              </div>
              <button onClick={() => setOpenSessionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Select Register Terminal</label>
                <select
                  value={selectedRegisterId || ""}
                  onChange={e => setSelectedRegisterId(parseInt(e.target.value))}
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#A78BFA]/50"
                >
                  {registers.map(reg => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} ({reg.code}) - {reg.status === "open" ? "Currently in use" : "Ready"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Opening Cash Float ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingFloat}
                  onChange={e => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Count physical bills/coins placed into cash drawer.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenSessionModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-[#A78BFA]/20"
                >
                  Confirm & Open Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Close Register Session */}
      {closeSessionModal && session && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-rose-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Reconcile & Close Register Shift</h3>
              </div>
              <button onClick={() => setCloseSessionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4">
              <div className="bg-[#151824] p-3.5 rounded-md border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Opening Float:</span>
                  <span className="font-mono text-slate-200">${session.opening_balance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Cash Sales:</span>
                  <span className="font-mono text-emerald-400">+${session.cash_sales_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cash In / Paid In:</span>
                  <span className="font-mono text-emerald-400">+${session.cash_in_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cash Out / Drops:</span>
                  <span className="font-mono text-rose-400">-${session.cash_out_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-[#A78BFA] font-mono text-sm">${session.expected_cash_balance?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Actual Physical Cash Counted ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={actualClosingCash}
                  onChange={e => setActualClosingCash(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                />
                <div className="mt-1 flex justify-between text-[11px]">
                  <span className="text-slate-500">Difference:</span>
                  <span className={`font-bold font-mono ${
                    (actualClosingCash - (session.expected_cash_balance || 0)) === 0 
                      ? "text-emerald-400" 
                      : "text-rose-400"
                  }`}>
                    ${(actualClosingCash - (session.expected_cash_balance || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Closing Notes / Discrepancy Reason</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Explain any difference or end-of-shift handover details..."
                  className="w-full bg-[#151824] border border-white/10 rounded-md p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseSessionModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
                >
                  Reconcile & Close Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cash In / Out / Safe Drop */}
      {cashMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <Coins className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Cash Drawer Movement</h3>
              </div>
              <button onClick={() => setCashMovementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCashMovement} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Movement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash_in", label: "Cash In", icon: ArrowDownRight },
                    { id: "cash_out", label: "Cash Out", icon: ArrowUpRight },
                    { id: "drop", label: "Safe Drop", icon: Lock },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCashMovementType(item.id as any)}
                      className={`p-2.5 rounded-md border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        cashMovementType === item.id 
                          ? "bg-[#211B32] border-[#A78BFA] text-[#A78BFA]" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={cashMovementAmount || ""}
                  onChange={e => setCashMovementAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={cashMovementReason}
                  onChange={e => setCashMovementReason(e.target.value)}
                  placeholder="e.g. Mid-day change replenishment, Cash deposit drop"
                  className="w-full bg-[#151824] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashMovementModal(false)}
                  className="flex-1 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-[#A78BFA]/20"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Payment Checkout & Receipt Execution */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Select Tender & Settle Bill</h3>
              </div>
              <button onClick={() => setPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Payable Display */}
            <div className="bg-[#151824] p-4 rounded-md border border-white/10 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Amount Due</span>
              <div className="text-3xl font-black text-[#A78BFA] font-mono">
                ${totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-slate-400">Select Tender Method</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: Coins },
                  { id: "credit_card", label: "Credit Card", icon: CreditCard },
                  { id: "debit_card", label: "Debit Card", icon: CreditCard },
                  { id: "mobile_money", label: "Mobile Pay", icon: Smartphone },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-md border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === m.id
                        ? "bg-[#A78BFA] text-[#090B10] border-[#A78BFA] shadow-lg shadow-[#A78BFA]/20"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === "cash" && (
              <div className="space-y-3 bg-[#12141e] p-4 rounded-md border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Cash Received from Customer ($)</label>
                  {/* Quick bill chips */}
                  <div className="flex items-center gap-1.5">
                    {[Math.ceil(totalAmount), 20, 50, 100].filter((v, i, a) => a.indexOf(v) === i && v >= totalAmount).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashReceived(val)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-[#A78BFA] border border-white/10"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="number"
                  step="0.01"
                  min={totalAmount}
                  value={cashReceived || ""}
                  onChange={e => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181b28] border border-white/10 rounded-md px-3.5 py-2.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-[#A78BFA]/50 text-right"
                />

                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm font-bold">
                  <span className="text-slate-400">Change to Return:</span>
                  <span className="text-emerald-400 font-mono text-base">${changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons: Confirm Sale & Print Invoice */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModal(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Back to Cart
              </button>

              <button
                type="button"
                disabled={isProcessingSale || (paymentMethod === "cash" && cashReceived < totalAmount)}
                onClick={() => handleExecuteSale(false)}
                className="flex-1 w-full py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Confirm sale immediately, update inventory and log to sales without printing modal"
              >
                {isProcessingSale ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Sale
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isProcessingSale || (paymentMethod === "cash" && cashReceived < totalAmount)}
                onClick={() => handleExecuteSale(true)}
                className="flex-1 w-full py-3 rounded-md bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-black text-xs shadow-lg shadow-[#A78BFA]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Confirm sale and open the commercial invoice with printing & download options"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Commercial Invoice & Thermal Slip Print View */}
      {receiptModal && completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Commercial Invoice & Receipt</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {completedReceipt.invoice_number || `INV-${completedReceipt.order_number}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setReceiptModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Slip Simulation */}
            <div className="bg-white text-black p-5 rounded-md shadow-inner font-mono text-[11px] space-y-3 receipt-paper">
              <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-3">
                <h2 className="text-sm font-bold tracking-tight">AETHER INDUSTRIAL AUDIO</h2>
                <p className="text-[10px] text-gray-600">Enterprise High-Performance Studio Hardware</p>
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-gray-900">
                    INVOICE: {completedReceipt.invoice_number || `INV-${completedReceipt.order_number}`}
                  </p>
                  <p className="text-[9px] text-gray-500">Order Ref: {completedReceipt.order_number}</p>
                  <p className="text-[9px] text-gray-500">{completedReceipt.date}</p>
                </div>
              </div>

              <div className="space-y-0.5 text-[10px] border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>Register Terminal:</span>
                  <span>{completedReceipt.register}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier / Rep:</span>
                  <span>{completedReceipt.cashier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedReceipt.customer_name}</span>
                </div>
                {completedReceipt.customer_phone && completedReceipt.customer_phone !== "N/A" && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{completedReceipt.customer_phone}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
                {completedReceipt.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="pr-2">
                      <span className="font-bold">{it.product_name}</span>
                      <div className="text-[9px] text-gray-600">
                        {it.quantity} x ${it.unit_price?.toFixed(2)}
                      </div>
                    </div>
                    <span className="font-bold whitespace-nowrap">${it.total_price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${completedReceipt.subtotal?.toFixed(2)}</span>
                </div>
                {completedReceipt.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-${completedReceipt.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT {completedReceipt.tax > 0 ? `(${vatRate}%)` : ""}:</span>
                  <span>${completedReceipt.tax?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>TOTAL PAID:</span>
                  <span>${completedReceipt.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 pt-1">
                  <span>Tender ({completedReceipt.payment_method?.toUpperCase()}):</span>
                  <span>${completedReceipt.cash_received?.toFixed(2)}</span>
                </div>
                {completedReceipt.change > 0 && (
                  <div className="flex justify-between font-bold text-[10px] text-emerald-700">
                    <span>CHANGE RETURNED:</span>
                    <span>${completedReceipt.change?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[9px] text-gray-500">
                <p>Thank you for outfitting your sound with Aether!</p>
                <p>Warranty valid for 1 year with this invoice.</p>
              </div>
            </div>

            {/* Print & Navigation Options */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerPrintReceipt}
                  className="flex-1 py-2.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
                <Link
                  href="/admin/sales"
                  className="px-3.5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold flex items-center gap-1 transition"
                >
                  Sales Ledger ↗
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setReceiptModal(false)}
                className="w-full py-2.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer transition"
              >
                ✨ Ready for Next Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
