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
  ArrowRight
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

      if (leadIdParam || storedLead) {
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
    if (lead.notes) setCustomerNote(lead.notes);

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

    toast.success(`Preloaded Lead #${leadNum} cart items and customer info into POS register.`);
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

    toast.info(`Added "${prod.name}" to cart`);
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
    toast.info("Cart cleared.");
  };

  // Reset Customer
  const handleResetCustomer = () => {
    setCustomerPhone("");
    setCustomerName("");
    setCustomerEmail("");
    setDeliveryAddress("");
    handleZoneChange("Inside Dhaka");
    setCustomerNote("");
    setAdminNote("");
    toast.info("Customer details reset.");
  };

  // Apply Promo
  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME10" || code === "SAVE10") {
      setAppliedPromo(code);
      setPromoCodeInput("");
      toast.success(`Promo "${code}" applied (10% off subtotal)`);
    } else if (code === "FREESHIP") {
      setAppliedPromo(code);
      setShippingFee(0);
      setPromoCodeInput("");
      toast.success(`Promo "${code}" applied (Free Shipping)`);
    } else {
      toast.error(`Invalid promo code "${code}"`);
    }
  };

  // Apply Manual Discount
  const handleApplyManualDiscount = () => {
    const val = parseFloat(manualDiscountInput);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid discount amount");
      return;
    }
    setManualDiscount(val);
    setManualDiscountInput("");
    toast.success(`Manual discount of ৳${val} applied.`);
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
      toast.error("Please add at least one product to the cart before checking out.");
      return;
    }

    if (!customerPhone.trim() && !customerName.trim()) {
      toast.error("Please enter customer name or phone number.");
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
        const convertedLeadId = activeLead.leadId;
        setActiveLead(null);
        toast.success(`🎉 Lead #${convertedLeadId} converted into Order #${res.order?.order_number || res.order?.id}!`);
      } else {
        toast.success(`🎉 Order #${res.order?.order_number || res.order?.id} created successfully!`);
      }

      setCompletedOrder(res.order);
      setCompletedReceipt(res.receipt);
      setReceiptModal(true);

      // Reset Cart & Form
      setCart([]);
      handleResetCustomer();
      setAppliedPromo(null);
      setManualDiscount(0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to create order.");
    } finally {
      setIsCheckingOut(false);
    }
  };

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
      <div className="flex items-center justify-between bg-[#0e121e] border border-white/10 rounded-xl px-5 py-3.5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-white tracking-tight">POS System</h1>
              {activeLead && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
                  <Sparkles className="w-3 h-3" />
                  Converting Lead #{activeLead.leadId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              High-speed retail & tele-sales order creation with automated inventory sync.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeLead && (
            <button
              type="button"
              onClick={() => {
                setActiveLead(null);
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("pos_lead_conversion");
                }
                toast.info("Lead detached. Continuing as general POS order.");
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              Detach Lead
            </button>
          )}

          <button
            type="button"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="px-3.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Product Catalog & Search (7 cols on lg, 6 cols on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-6 space-y-4">
          <div className="bg-[#0e121e] border border-white/10 rounded-xl p-4 shadow-xl space-y-3.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by Name, SKU, Code or scan barcode..."
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
                onClick={handleResetCustomer}
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

      {/* Order Confirmation & Receipt Modal */}
      {receiptModal && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-[#0e121e] border border-[#A78BFA]/40 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#211B32] border border-[#A78BFA]/40 flex items-center justify-center text-[#A78BFA]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Order Created Successfully!</h3>
                  <p className="text-xs text-slate-400">
                    Order Number: <strong className="text-[#A78BFA] font-mono">#{completedOrder.order_number}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-[#080a10] border border-white/10 rounded-xl p-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-bold">{completedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-white">{completedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Address:</span>
                <span className="text-white text-right max-w-[240px] truncate">
                  {completedOrder.shipping_address?.address_line1 || "Store Pickup"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Items:</span>
                <span className="text-white">{completedOrder.items?.length || 0} product(s)</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-white/15 pt-2 text-sm font-bold">
                <span className="text-slate-300">Total Charged:</span>
                <span className="text-[#A78BFA]">{formatBDT(completedOrder.total_amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-2">
              <Link
                href="/admin/orders"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <span>View in Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptModal(false)}
                  className="px-5 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition cursor-pointer shadow-md shadow-purple-500/20"
                >
                  Ready for Next Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
