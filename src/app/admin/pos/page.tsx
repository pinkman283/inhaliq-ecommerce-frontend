"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Package, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  Printer, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  Layers,
  ArrowRight,
  Copy,
  Store
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { getAppCurrencySymbol } from "@/lib/utils";
import { Product, ProductVariant, Order, PosReceipt } from "@/types";
import { toast } from "sonner";

interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  unit_price: number;
  quantity: number;
  discount_amount: number;
}

export default function AdminPosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // Search & Categories
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  // Cart & Customer Details
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"Inside Dhaka" | "Outside Dhaka" | "Sub-city" | "Store Pickup">("Inside Dhaka");
  const [shippingFee, setShippingFee] = useState<number>(60);
  
  // Discounts & Promo
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [manualDiscountInput, setManualDiscountInput] = useState("");

  // Status & Notes
  const [initialOrderStatus, setInitialOrderStatus] = useState<"pending" | "processing" | "delivered" | "shipped">("pending");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "cash" | "credit_card" | "mobile_money">("cash_on_delivery");
  const [customerNote, setCustomerNote] = useState("");
  const [adminNote, setAdminNote] = useState("");

  // Active Lead Conversion
  const [activeLead, setActiveLead] = useState<{
    leadId: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
  } | null>(null);

  // Modals & Variant Selection
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<PosReceipt | null>(null);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptTab, setReceiptTab] = useState<"summary" | "thermal">("summary");
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef<string>("");
  const lastKeystrokeTimeRef = useRef<number>(0);
  const leadInitializedRef = useRef<boolean>(false);
  const [, setCurrencyTick] = useState(0);

  useEffect(() => {
    const onCurrencyChange = () => setCurrencyTick((t) => t + 1);
    window.addEventListener("currency_changed", onCurrencyChange);
    return () => window.removeEventListener("currency_changed", onCurrencyChange);
  }, []);

  // Currency Formatter - Dynamically uses the store's configured currency symbol (৳, $, Tk, etc.)
  const formatBDT = (amount: number | string | undefined | null) => {
    const num = Number(amount || 0);
    const sym = getAppCurrencySymbol();
    return `${sym} ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Delivery Zone -> Shipping Fee Sync
  const handleZoneChange = (zone: "Inside Dhaka" | "Outside Dhaka" | "Sub-city" | "Store Pickup") => {
    setDeliveryZone(zone);
    if (zone === "Inside Dhaka") setShippingFee(60);
    else if (zone === "Outside Dhaka") setShippingFee(120);
    else if (zone === "Sub-city") setShippingFee(100);
    else setShippingFee(0);
  };

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getPosProducts({ per_page: 100 } as any),
        ]);
        setCategories(catsRes || []);
        setProducts(prodsRes.data || []);
      } catch (err: any) {
        console.error("Failed to load POS catalog", err);
        toast.error("Could not load products catalog.");
      } finally {
        setLoading(false);
      }
    };

    init();

    // Check for lead conversion via query param or sessionStorage
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const leadIdParam = params.get("lead_id");
      const storedLeadRaw = sessionStorage.getItem("pos_lead_conversion");

      let storedLead: any = null;
      if (storedLeadRaw) {
        try {
          storedLead = JSON.parse(storedLeadRaw);
        } catch (e) {
          console.error("Failed to parse pos_lead_conversion", e);
        }
      }

      if (!leadInitializedRef.current && (leadIdParam || storedLead)) {
        leadInitializedRef.current = true;
        initLeadConversion(leadIdParam ? Number(leadIdParam) : storedLead?.leadId, storedLead);
      }
    }
  }, []);

  // Filter & Search Products
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredProducts();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  const fetchFilteredProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminApi.getPosProducts({
        search: searchQuery.trim() || undefined,
        category_id: selectedCategory !== "all" ? selectedCategory : undefined,
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Preload Lead Conversion Data
  const initLeadConversion = async (leadId: number, cachedLead?: any) => {
    let lead = cachedLead;
    if (!lead || !lead.cart_items) {
      try {
        lead = await adminApi.getLead(leadId);
      } catch (err) {
        console.error("Could not fetch lead details", err);
        return;
      }
    }
    if (!lead) return;

    const leadNum = lead.id || lead.leadId || leadId;
    setActiveLead({
      leadId: leadNum,
      name: lead.name || "Customer",
      phone: lead.phone || "",
      email: lead.email || "",
      address: lead.address || "",
      city: lead.city || "",
      notes: lead.notes || "",
    });

    if (lead.name) setCustomerName(lead.name);
    if (lead.phone) setCustomerPhone(lead.phone);
    if (lead.email) setCustomerEmail(lead.email);
    if (lead.address) setDeliveryAddress(lead.address);
    if (lead.city) {
      const lower = lead.city.toLowerCase();
      if (lower.includes("outside")) handleZoneChange("Outside Dhaka");
      else if (lower.includes("sub") || lower.includes("savar") || lower.includes("gazipur")) handleZoneChange("Sub-city");
      else handleZoneChange("Inside Dhaka");
    }

    // Map lead cart items into active cart
    const leadCart = lead.cart_items || [];
    if (leadCart.length > 0) {
      const preloaded: CartItem[] = leadCart.map((item: any, idx: number) => {
        const prodId = item.product_id || item.id || (99000 + idx);
        const uPrice = Number(item.price || item.unit_price || 0);
        const qty = Number(item.quantity || 1);
        const title = item.title || item.name || "Lead Cart Item";
        const img = item.image || "/placeholder-product.png";

        const tempProd = {
          id: prodId,
          name: title,
          slug: `lead-item-${prodId}`,
          price: uPrice,
          sku: item.sku || `LEAD-P${idx + 1}`,
          stock_quantity: 999,
          is_active: true,
          category_id: 1,
          primary_image: {
            id: 1,
            product_id: prodId,
            image_url: img,
            is_primary: true,
          },
        } as unknown as Product;

        return {
          product: tempProd,
          variant: item.variant_name ? ({ id: item.variant_id || 1, name: item.variant_name, price_modifier: 0, stock_quantity: 999, is_active: true, sku: '' } as any) : null,
          unit_price: uPrice,
          quantity: qty,
          discount_amount: 0,
        };
      });

      setCart(preloaded);
    }

    toast.success(`Lead #${leadNum} loaded into POS register`, { id: "pos-lead-preload" });
  };

  // Add Product to Cart
  const handleAddToCart = (prod: Product, variant?: ProductVariant | null) => {
    // Check if product has variants and none passed
    if (!variant && prod.variants && prod.variants.length > 0) {
      setVariantModalProduct(prod);
      setSelectedVariant(prod.variants[0]);
      return;
    }

    const price = variant 
      ? Number(variant.price || prod.price) + Number(variant.price_modifier || 0)
      : Number(prod.price);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.product.id === prod.id && (variant ? ci.variant?.id === variant.id : !ci.variant)
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1,
        };
        return next;
      }

      return [
        ...prev,
        {
          product: prod,
          variant: variant || null,
          unit_price: price,
          quantity: 1,
          discount_amount: 0,
        },
      ];
    });

    toast.success(`Added ${prod.name}`, { id: "pos-cart-action", duration: 1500 });
  };

  // Barcode / SKU scan matching helper (Supports product & variant barcodes/SKUs)
  const tryScanMatch = (scannedCode: string) => {
    const raw = scannedCode.trim();
    if (!raw) return false;
    const code = raw.toLowerCase();

    for (const p of products) {
      // Check variants first
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (
            (v.sku && v.sku.toLowerCase() === code) ||
            ((v as any).barcode && (v as any).barcode.toLowerCase() === code)
          ) {
            handleAddToCart(p, v);
            toast.success(`Scanned: ${p.name} (${v.name})`, { id: "pos-scan" });
            return true;
          }
        }
      }

      // Check product SKU, barcode, or exact ID
      if (
        (p.sku && p.sku.toLowerCase() === code) ||
        ((p as any).barcode && (p as any).barcode.toLowerCase() === code) ||
        p.id.toString() === code
      ) {
        handleAddToCart(p, null);
        toast.success(`Scanned: ${p.name}`, { id: "pos-scan" });
        return true;
      }
    }

    return false;
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (idx: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  };

  const handleSetExactQuantity = (idx: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(idx);
      return;
    }
    setCart((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });
  };

  // Remove Item
  const handleRemoveItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // Clear Entire Cart
  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setAppliedPromo(null);
    setManualDiscount(0);
    toast.info("Cart cleared", { id: "pos-cart-clear" });
  };

  // Reset Customer
  const handleResetCustomer = (silent = false) => {
    setCustomerPhone("");
    setCustomerName("");
    setCustomerEmail("");
    setDeliveryAddress("");
    handleZoneChange("Inside Dhaka");
    setCustomerNote("");
    setAdminNote("");
    if (!silent) {
      toast.info("Customer form cleared", { id: "pos-customer-clear" });
    }
  };

  // Apply Promo
  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME10" || code === "SAVE10") {
      setAppliedPromo(code);
      setPromoCodeInput("");
      toast.success(`Promo code applied: ${code}`, { id: "pos-promo" });
    } else if (code === "FREESHIP") {
      setAppliedPromo(code);
      setShippingFee(0);
      setPromoCodeInput("");
      toast.success(`Promo code applied: ${code}`, { id: "pos-promo" });
    } else {
      toast.error(`Invalid promo code: ${code}`, { id: "pos-promo" });
    }
  };

  // Apply Manual Discount
  const handleApplyManualDiscount = () => {
    const val = parseFloat(manualDiscountInput);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid discount amount", { id: "pos-discount" });
      return;
    }
    setManualDiscount(val);
    setManualDiscountInput("");
    toast.success(`Discount applied: ৳${val}`, { id: "pos-discount" });
  };

  // Calculations
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + (item.discount_amount * item.quantity), 0);
  
  let promoDiscount = 0;
  if (appliedPromo === "WELCOME10" || appliedPromo === "SAVE10") {
    promoDiscount = Math.round(subtotal * 0.10);
  }

  const totalDiscount = itemsDiscount + promoDiscount + manualDiscount;
  const netTotal = Math.max(0, subtotal - totalDiscount) + shippingFee;

  // Complete Order Checkout
  const handleExecuteCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Add products to continue.", { id: "pos-val" });
      return;
    }

    if (!customerPhone.trim() && !customerName.trim()) {
      toast.error("Please enter customer name or phone.", { id: "pos-val" });
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        customer_name: customerName.trim() || "Walk-in Customer",
        customer_phone: customerPhone.trim() || "N/A",
        customer_email: customerEmail.trim() || undefined,
        delivery_address: deliveryAddress.trim() || "In-store pickup / Retail POS",
        delivery_zone: deliveryZone,
        shipping_amount: shippingFee,
        discount_amount: totalDiscount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" ? "paid" : "pending",
        order_status: initialOrderStatus,
        customer_note: customerNote.trim() || undefined,
        admin_note: adminNote.trim() || undefined,
        coupon_code: appliedPromo || undefined,
        lead_id: activeLead?.leadId ? Number(activeLead.leadId) : undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount_amount: item.discount_amount,
        })),
      };

      const res = await adminApi.checkoutPosSale(payload);

      // Finalize lead conversion
      if (activeLead) {
        try {
          await adminApi.updateLead(activeLead.leadId, {
            status: "converted",
            converted_order_id: res.order?.id,
          });
        } catch {
          // Handled atomically by backend transaction
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("pos_lead_conversion");
        }
        setActiveLead(null);
      }

      setCompletedOrder(res.order);
      setCompletedReceipt(res.receipt);
      setReceiptModal(true);

      // Reset Cart & Form silently
      setCart([]);
      handleResetCustomer(true);
      setAppliedPromo(null);
      setManualDiscount(0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to process sale.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Global Keyboard Shortcuts (F2, F4, Ctrl+Enter, Esc) & Continuous Hardware Barcode Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Hotkey: F2 (Focus & Select Product Search Box)
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 2. Hotkey: F4 (Quick Exact Cash Payment Selection)
      if (e.key === "F4") {
        e.preventDefault();
        setPaymentMethod("cash");
        toast.info("Cash payment selected (Exact Amount)", { id: "pos-f4" });
        return;
      }

      // 3. Hotkey: Escape (Dismiss modals / Clear search)
      if (e.key === "Escape") {
        if (variantModalProduct) {
          e.preventDefault();
          setVariantModalProduct(null);
          return;
        }
        if (receiptModal) {
          e.preventDefault();
          setReceiptModal(false);
          return;
        }
        if (searchQuery) {
          e.preventDefault();
          setSearchQuery("");
          return;
        }
      }

      // 4. Hotkey: Ctrl+Enter or F9 (Quick Checkout)
      if ((e.ctrlKey && e.key === "Enter") || e.key === "F9") {
        if (!isCheckingOut && cart.length > 0 && !receiptModal) {
          e.preventDefault();
          handleExecuteCheckout();
          return;
        }
      }

      // 5. Continuous Hardware Barcode Scanner stream listener
      // Hardware scanners typically type characters rapidly (< 50ms interval) terminated with "Enter"
      const now = Date.now();
      const elapsed = now - lastKeystrokeTimeRef.current;
      lastKeystrokeTimeRef.current = now;

      // Ignore single modifier keys like Shift, Control, Alt, Meta
      if (e.key.length > 1 && e.key !== "Enter") {
        return;
      }

      if (e.key === "Enter") {
        if (scanBufferRef.current.length >= 2) {
          const buffer = scanBufferRef.current;
          scanBufferRef.current = "";
          const matched = tryScanMatch(buffer);
          if (matched) {
            e.preventDefault();
            setSearchQuery("");
            return;
          }
        }
        scanBufferRef.current = "";
        return;
      }

      // If characters arrived rapidly (< 50ms) or buffer started, append
      if (elapsed < 50 || scanBufferRef.current.length === 0) {
        scanBufferRef.current += e.key;
      } else {
        // Reset buffer if standard human typing speed
        scanBufferRef.current = e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, cart, isCheckingOut, variantModalProduct, receiptModal, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading POS System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between bg-[#11141D] border border-[#272B35] rounded-xl px-4 py-2.5 shadow-sm gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] shrink-0">
            <Store className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0 flex-nowrap">
            <span className="text-sm font-semibold text-white tracking-tight whitespace-nowrap">
              POS Terminal
            </span>

            {activeLead ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#A78BFA]/15 text-[#C4B5FD] border border-[#A78BFA]/30 whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse shrink-0" />
                <span className="truncate max-w-[220px]">
                  Lead #{activeLead.leadId}{activeLead.name && activeLead.name !== "Customer" ? ` · ${activeLead.name}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLead(null);
                    if (typeof window !== "undefined") {
                      sessionStorage.removeItem("pos_lead_conversion");
                    }
                    toast.info("Lead detached. Continuing as regular POS order.");
                  }}
                  className="hover:bg-white/20 p-0.5 rounded-full transition text-[#C4B5FD] hover:text-white cursor-pointer ml-0.5"
                  title="Detach lead"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Hardware Shortcuts & Cart Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Hardware hotkey cheat-sheet */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#090B10]/60 border border-white/5 px-2.5 py-1 rounded-lg select-none">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#1C202F] text-slate-300 font-bold text-[9px] border border-white/10 shadow-xs">F2</kbd>
              <span className="text-[11px] font-sans text-slate-400">Search</span>
            </span>
            <span className="text-white/10">|</span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#1C202F] text-slate-300 font-bold text-[9px] border border-white/10 shadow-xs">F4</kbd>
              <span className="text-[11px] font-sans text-slate-400">Cash</span>
            </span>
            <span className="text-white/10">|</span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#1C202F] text-slate-300 font-bold text-[9px] border border-white/10 shadow-xs">Ctrl+↵</kbd>
              <span className="text-[11px] font-sans text-slate-400">Pay</span>
            </span>
            <span className="text-white/10">|</span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#1C202F] text-slate-300 font-bold text-[9px] border border-white/10 shadow-xs">Esc</kbd>
            </span>
          </div>

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Clear all cart items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Product Catalog & Search (7 cols on lg, 6 cols on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-6 space-y-4">
          <div className="bg-[#0e121e] border border-white/10 rounded-xl p-4 shadow-xl space-y-3.5">
            
            {/* Search Input with Scanner & F2 support */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    const matched = tryScanMatch(searchQuery.trim());
                    if (matched) {
                      e.preventDefault();
                      setSearchQuery("");
                    }
                  }
                }}
                placeholder="Search products by Name, SKU, Code or scan barcode [F2]..."
                className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Horizontal Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-purple-500/20"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === String(cat.id)
                      ? "bg-[#A78BFA] text-[#090B10] shadow-md shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mr-2" />
                Filtering products...
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No products found matching your search</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="mt-2 text-[11px] text-[#A78BFA] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[750px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const inStock = (p.stock_quantity ?? 0) > 0;
                  const imgUrl = p.primary_image?.image_url || p.images?.[0]?.image_url || (p as any).image || "/placeholder-product.png";

                  return (
                    <div
                      key={p.id}
                      className="bg-[#080a10] border border-white/10 hover:border-[#A78BFA]/50 rounded-xl p-2.5 flex flex-col justify-between transition-all duration-150 hover:shadow-lg group"
                    >
                      <div>
                        {/* In Stock Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              inStock
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {inStock ? `In Stock (${p.stock_quantity})` : "Out of Stock"}
                          </span>
                        </div>

                        {/* Image */}
                        <div className="w-full aspect-square rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden mb-2 p-1.5">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>

                        {/* Title */}
                        <h3 className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight min-h-[28px] mb-1" title={p.name}>
                          {p.name}
                        </h3>

                        {/* Code / SKU */}
                        <div className="text-[10px] text-slate-500 font-mono mb-2">
                          Code: {p.sku || `P${String(p.id).padStart(4, "0")}`}
                        </div>
                      </div>

                      <div>
                        {/* Price */}
                        <div className="text-xs font-bold text-[#A78BFA] mb-2 font-mono">
                          {formatBDT(p.price)}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          className="w-full py-1.5 px-2 rounded-lg border border-[#A78BFA]/30 hover:border-[#A78BFA] bg-[#211B32] hover:bg-[#A78BFA] text-[#A78BFA] hover:text-[#090B10] text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Details, Cart, Order Summary, Checkout (5 cols on lg, 6 cols on 2xl) */}
        <div className="lg:col-span-5 2xl:col-span-6 space-y-4">
          
          {/* Card 1: Customer Details */}
          <div className="bg-[#0e121e] border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#A78BFA]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Customer Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleResetCustomer(false)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Row 1: Phone & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Customer Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium transition"
                  />
                </div>
              </div>

              {/* Row 2: Delivery Address */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Delivery Address</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address, apartment, suite..."
                    className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Row 3: Delivery Zone Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Delivery Zone</label>
                  <select
                    value={deliveryZone}
                    onChange={(e) => handleZoneChange(e.target.value as any)}
                    className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition"
                  >
                    <option value="Inside Dhaka">Inside Dhaka ({formatBDT(60)})</option>
                    <option value="Outside Dhaka">Outside Dhaka ({formatBDT(120)})</option>
                    <option value="Sub-city">Sub-city / Gazipur / Savar ({formatBDT(100)})</option>
                    <option value="Store Pickup">Store Pickup ({formatBDT(0)})</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email address (optional)"
                    className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cart Items List (Production POS Card Layout) */}
          <div className="bg-[#0e121e] border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Cart Items ({cart.length})
                </span>
              </div>
              <span className="text-xs text-slate-300 font-mono bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {totalQuantity} {totalQuantity === 1 ? "pc" : "pcs"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-1" />
                Your cart is currently empty.
                <p className="text-[11px] text-slate-500 mt-0.5">Click "+ Add to Cart" on any product from the catalog on the left.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const img = item.product.primary_image?.image_url || item.product.images?.[0]?.image_url || (item.product as any).image || "/placeholder-product.png";
                  const lineTotal = (item.unit_price * item.quantity) - (item.discount_amount * item.quantity);

                  return (
                    <div
                      key={idx}
                      className="bg-[#0b0e17] border border-white/10 hover:border-white/20 rounded-xl p-3.5 transition-all space-y-3 group"
                    >
                      {/* Top Row: Thumbnail + Product Name & Metadata + Remove */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                          <img
                            src={img}
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs font-semibold text-slate-100 truncate" title={item.product.name}>
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                            {item.variant ? (
                              <span className="text-[#A78BFA] font-medium truncate max-w-[160px]">
                                {item.variant.name}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-500 text-[10px]">
                                {item.product.sku || `P${String(item.product.id).padStart(4, "0")}`}
                              </span>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-300 whitespace-nowrap">
                              {formatBDT(item.unit_price)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Row: Quantity Stepper, Per-item Discount, and Line Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleSetExactQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-8 text-center text-xs font-mono font-bold bg-transparent text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Per-Item Discount */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Disc:</span>
                          <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-[#A78BFA]/50 rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min="0"
                              value={item.discount_amount || ""}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCart((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], discount_amount: val };
                                  return next;
                                });
                              }}
                              className="w-11 text-right text-xs font-mono text-white placeholder:text-slate-600 bg-transparent focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono tracking-tight whitespace-nowrap">
                            {formatBDT(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Order Financial Summary Box */}
          <div className="bg-[#080a10] border border-white/15 rounded-xl p-4 shadow-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Quantity</span>
              <span className="text-white font-mono font-semibold">{totalQuantity} pcs</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Sub Total</span>
              <span className="text-white font-mono font-bold text-sm">{formatBDT(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Shipping Fee</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#121624] border border-white/15 focus:border-[#A78BFA]/50 rounded px-2 py-0.5 text-right font-mono text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Discount (-)</span>
              <span className="text-rose-400 font-mono font-semibold">
                {totalDiscount > 0 ? `- ${formatBDT(totalDiscount)}` : formatBDT(0)}
              </span>
            </div>

            <div className="border-t border-dashed border-white/15 pt-2.5 flex justify-between items-center">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Net Total</span>
              <span className="text-lg font-black text-[#A78BFA] font-mono tracking-tight">
                {formatBDT(netTotal)}
              </span>
            </div>
          </div>

          {/* Card 4: Promo Code & Manual Discount Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Promo Code"
                className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3.5 py-1.5 rounded-lg border border-[#A78BFA]/30 hover:border-[#A78BFA] bg-[#211B32] hover:bg-[#A78BFA] text-[#A78BFA] hover:text-[#090B10] font-bold text-xs transition cursor-pointer shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={manualDiscountInput}
                onChange={(e) => setManualDiscountInput(e.target.value)}
                placeholder="Manual Discount"
                className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyManualDiscount}
                className="px-3.5 py-1.5 rounded-lg border border-[#A78BFA]/30 hover:border-[#A78BFA] bg-[#211B32] hover:bg-[#A78BFA] text-[#A78BFA] hover:text-[#090B10] font-bold text-xs transition cursor-pointer shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Card 5: Initial Order Status & Notes */}
          <div className="bg-[#0e121e] border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Initial Order Status
                </label>
                <select
                  value={initialOrderStatus}
                  onChange={(e) => setInitialOrderStatus(e.target.value as any)}
                  className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-medium"
                >
                  <option value="pending">Pending (Default)</option>
                  <option value="processing">Processing (Ready to Pack)</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered / In-Store Handed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-medium"
                >
                  <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                  <option value="cash">Cash (Paid)</option>
                  <option value="credit_card">Card (POS Terminal)</option>
                  <option value="mobile_money">bKash / Nagad / Rocket</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Customer Note</label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Customer instructions / notes"
                  className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Admin Note</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal order notes"
                  className="w-full bg-[#080a10] border border-white/10 focus:border-[#A78BFA]/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Card 6: Complete Order Checkout Button (Admin Purple Signature Action) */}
          <button
            type="button"
            onClick={handleExecuteCheckout}
            disabled={isCheckingOut || cart.length === 0}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#B9A3FF] hover:to-[#A78BFA] text-[#090B10] font-black text-sm tracking-wide transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-[#090B10] border-t-transparent rounded-full animate-spin" />
                <span>Creating Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#090B10] stroke-[2.5]" />
                <span>Complete Order Checkout • {formatBDT(netTotal)}</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Variant Selection Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-[#0e121e] border border-[#A78BFA]/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Select Product Variant / Flavor</h3>
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-white mb-2">{variantModalProduct.name}</div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {variantModalProduct.variants?.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      handleAddToCart(variantModalProduct, v);
                      setVariantModalProduct(null);
                    }}
                    className="w-full p-2.5 rounded-lg border border-white/10 hover:border-[#A78BFA] bg-white/[0.03] hover:bg-[#211B32] text-left flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <span className="font-semibold text-white">{v.name}</span>
                    <span className="font-mono text-[#A78BFA] font-bold">
                      {formatBDT(Number(variantModalProduct.price) + Number(v.price_modifier || 0))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation & 80mm Thermal Receipt Modal */}
      {receiptModal && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          {/* Isolated Clean 80mm Thermal Receipt Print Stylesheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 2mm;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #pos-thermal-receipt-80mm, #pos-thermal-receipt-80mm * {
                visibility: visible !important;
              }
              #pos-thermal-receipt-80mm {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 3mm 4mm !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                border: none !important;
                box-shadow: none !important;
              }
            }
          `}} />

          <div className="w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-[#0e121e] border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#A78BFA]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setReceiptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer print:hidden"
              title="Close modal [Esc]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Success Icon, Title, and Order Number Badge */}
            <div className="flex flex-col items-center text-center pt-1 print:hidden shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-lg shadow-purple-500/15 mb-2.5">
                <CheckCircle2 className="w-6 h-6 text-[#A78BFA]" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Order Processed Successfully!</h3>
              
              <button
                type="button"
                onClick={() => {
                  if (completedOrder?.order_number) {
                    navigator.clipboard.writeText(completedOrder.order_number);
                    setCopiedOrderNumber(true);
                    toast.success("Order number copied", { id: "pos-copy-order" });
                    setTimeout(() => setCopiedOrderNumber(false), 2000);
                  }
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-mono transition group cursor-pointer"
                title="Click to copy order number"
              >
                <span className="text-slate-400">Order:</span>
                <span className="text-[#A78BFA] font-bold">#{completedOrder.order_number}</span>
                {copiedOrderNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-white ml-0.5 transition" />
                )}
              </button>
            </div>

            {/* View Mode Toggle: Summary vs 80mm Thermal */}
            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5 text-xs font-semibold my-3 print:hidden shrink-0">
              <button
                type="button"
                onClick={() => setReceiptTab("summary")}
                className={`flex-1 py-1.5 rounded-md transition text-center cursor-pointer ${
                  receiptTab === "summary"
                    ? "bg-[#A78BFA] text-[#090B10] font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Order Summary
              </button>
              <button
                type="button"
                onClick={() => setReceiptTab("thermal")}
                className={`flex-1 py-1.5 rounded-md transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  receiptTab === "thermal"
                    ? "bg-[#A78BFA] text-[#090B10] font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>80mm Thermal Layout</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto flex-1 custom-scrollbar space-y-3.5 pr-0.5">
              {receiptTab === "summary" ? (
                <>
                  {/* Hero Total Charged Card */}
                  <div className="rounded-xl bg-[#080a10]/80 border border-white/10 p-3.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Amount Charged</span>
                    <div className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                      {formatBDT(completedOrder.total_amount)}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {completedOrder.payment_status === "paid" ? "Payment Completed" : "Order Placed (Pending Payment)"}
                    </div>
                  </div>

                  {/* Key Order & Customer Details */}
                  <div className="space-y-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Customer
                      </span>
                      <span className="text-white font-medium">{completedOrder.customer_name || "Walk-in Customer"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        Phone
                      </span>
                      <span className="text-white font-medium">{completedOrder.customer_phone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-slate-400 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        Delivery
                      </span>
                      <span className="text-white font-medium text-right max-w-[200px] truncate" title={completedOrder.shipping_address?.address_line1 || "Store Pickup"}>
                        {completedOrder.shipping_address?.address_line1 || "Store Pickup"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        Items
                      </span>
                      <span className="text-white font-medium">{completedOrder.items?.length || 0} product(s)</span>
                    </div>
                  </div>
                </>
              ) : null}

              {/* 80mm THERMAL RECEIPT (Shown on screen in thermal tab, always available for print) */}
              <div
                id="pos-thermal-receipt-80mm"
                className={`${receiptTab === "thermal" ? "block" : "hidden print:block"} bg-white text-black p-4 rounded-lg font-mono text-[11px] leading-tight max-w-[80mm] mx-auto border border-gray-300 print:border-none print:p-0 print:m-0 shadow-md`}
              >
                {/* Store Header */}
                <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
                  <h2 className="text-sm font-black tracking-tight uppercase">INHALIQ STORE</h2>
                  <p className="text-[10px] text-gray-700">Official Retail & Tele-Sales</p>
                  <p className="text-[9px] text-gray-600">Hotline: +880 1700-000000</p>
                  <p className="text-[9px] text-gray-600">Dhaka, Bangladesh</p>
                </div>

                {/* Order & Register Metadata */}
                <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>ORDER: #{completedOrder.order_number}</span>
                    <span>{completedReceipt?.invoice_number || `INV-${completedOrder.id}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>DATE: {completedReceipt?.date || new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>CASHIER: {completedReceipt?.cashier || "Admin Staff"}</span>
                    <span>{completedReceipt?.register || "POS Terminal"}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-semibold">
                    <span>CUSTOMER: {completedOrder.customer_name || "Walk-in"}</span>
                    <span>{completedOrder.customer_phone || "—"}</span>
                  </div>
                  {completedOrder.shipping_address?.address_line1 && completedOrder.shipping_address?.address_line1 !== "Store Pickup" && (
                    <div className="text-[9px] text-gray-600 truncate">
                      ADDR: {completedOrder.shipping_address.address_line1}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="py-2 border-b border-dashed border-black">
                  <div className="flex justify-between font-black text-[10px] pb-1 border-b border-black">
                    <span>QTY ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="pt-1.5 space-y-1">
                    {completedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[10px]">
                        <div className="pr-2 max-w-[170px]">
                          <span className="font-bold">{item.quantity}x </span>
                          <span>{item.product_name || (item as any).product?.name || "Product"}</span>
                          {item.variant_name && (
                            <span className="text-[9px] text-gray-600 block">({item.variant_name})</span>
                          )}
                        </div>
                        <span className="font-bold shrink-0">{formatBDT(Number(item.unit_price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="py-2 border-b-2 border-black space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatBDT(completedOrder.subtotal ?? completedReceipt?.subtotal ?? 0)}</span>
                  </div>
                  {Number(completedOrder.shipping_amount ?? completedReceipt?.shipping_fee ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatBDT(completedOrder.shipping_amount ?? completedReceipt?.shipping_fee ?? 0)}</span>
                    </div>
                  )}
                  {Number(completedOrder.discount_amount ?? completedReceipt?.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-800 font-bold">
                      <span>Discount:</span>
                      <span>-{formatBDT(completedOrder.discount_amount ?? completedReceipt?.discount ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-dashed border-black">
                    <span className="uppercase">TOTAL CHARGED:</span>
                    <span>{formatBDT(completedOrder.total_amount)}</span>
                  </div>
                </div>

                {/* Payment Tendered & Change */}
                <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>PAYMENT METHOD:</span>
                    <span className="font-bold uppercase">{completedOrder.payment_method?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="font-bold uppercase">{completedOrder.payment_status}</span>
                  </div>
                  {completedOrder.payment_method === "cash" && (
                    <>
                      <div className="flex justify-between">
                        <span>CASH TENDERED:</span>
                        <span>{formatBDT(completedOrder.cash_received || completedReceipt?.cash_received || completedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>CHANGE RETURNED:</span>
                        <span>{formatBDT(completedOrder.change_returned || completedReceipt?.change || 0)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Barcode & Footer */}
                <div className="pt-2 text-center space-y-1.5">
                  <div className="flex justify-center py-1">
                    <div className="inline-block font-mono tracking-[0.25em] text-xs font-black uppercase py-1 px-3 bg-gray-100 border border-gray-300 rounded">
                      *{completedOrder.order_number}*
                    </div>
                  </div>
                  <p className="text-[9px] font-bold uppercase text-gray-800">
                    THANK YOU FOR SHOPPING WITH US!
                  </p>
                  <p className="text-[8px] text-gray-500">
                    Exchanges accepted within 7 days with original receipt.
                  </p>
                  <p className="text-[8px] text-gray-400 pt-0.5 font-mono">
                    INHALIQ CLOUD POS • 80MM THERMAL
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Clear Hierarchy */}
            <div className="space-y-2 pt-3 border-t border-white/10 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition duration-150 cursor-pointer shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ready for Next Sale</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print 80mm Receipt</span>
                </button>

                <Link
                  href="/admin/orders"
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <span>View in Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
