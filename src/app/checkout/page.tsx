"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Banknote,
  Tag,
  Plus,
  Minus,
  Trash2,
  LogIn,
  UserPlus,
  Check,
  Info,
  ChevronDown,
  Wallet,
  Gift
} from "lucide-react";
import { useCartStore, getAvailableStock } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { formatPrice } from "@/lib/utils";
import { api } from "@/lib/api";
import { Address, PaymentMethodOption, PromotionClaim } from "@/types";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    promotionEvaluation,
    setPromotionEvaluation,
    useStoreCredit,
    setUseStoreCredit,
    getSubtotal,
    getDiscount,
    validationNotices,
    dismissNotices,
    validateCartWithServer,
    hasInvalidItems,
    isValidating,
  } = useCartStore();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  // Form State (Single-Page Low Friction Checkout)
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [shippingArea, setShippingArea] = useState<string>("");
  const [shippingZones, setShippingZones] = useState<Array<{
    id: string;
    name: string;
    rate: number;
    duration?: string;
    free_threshold?: number;
    is_active?: boolean;
  }>>([]);
  const [fullAddress, setFullAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Payment Method Architecture (Canonical: cash_on_delivery)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash_on_delivery");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([
    {
      code: "cash_on_delivery",
      name: "Cash On Delivery (COD)",
      description: "Pay in cash when your parcel arrives at your doorstep",
      available: true,
      notice: null,
    },
    {
      code: "online_payment",
      name: "Online Payment (Cards / MFS)",
      description: "Debit / Credit Cards, bKash, Nagad",
      available: false,
      notice: "Online payment — Coming soon",
    },
  ]);

  // Load active payment methods from server
  useEffect(() => {
    let mounted = true;
    api.getPaymentMethods().then((res) => {
      if (mounted && res?.methods?.length) {
        setPaymentMethods(res.methods);
        if (res.default) {
          setPaymentMethod(res.default);
        }
      }
    }).catch(() => {
      // Retain secure default fallback
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Promo Code State
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Customer Loyalty & Store Credit
  const [storeCreditBalance, setStoreCreditBalance] = useState<number>(0);
  const [claimedCoupons, setClaimedCoupons] = useState<PromotionClaim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [showClaimedPicker, setShowClaimedPicker] = useState(false);

  // Saved Addresses for Authenticated Customers
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const savedAddressDropdownRef = useRef<HTMLDivElement>(null);

  // Submission & Lead State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);

  // Validate cart against server on checkout mount
  useEffect(() => {
    if (items.length > 0) {
      validateCartWithServer();
    }
  }, [items.length, validateCartWithServer]);

  // Sync logged in user details & wallet
  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadCustomerPromos() {
      try {
        const [creditRes, couponsRes] = await Promise.all([
          api.getMyStoreCredit().catch(() => ({ balance: 0 })),
          api.getMyCoupons().catch(() => ({ claimed: [] })),
        ]);
        if (creditRes && typeof (creditRes as any).balance === "number") {
          setStoreCreditBalance(Number((creditRes as any).balance || 0));
        }
        if ((couponsRes as any)?.claimed) {
          setClaimedCoupons((couponsRes as any).claimed.filter((c: any) => c.status === "claimed"));
        }
      } catch (e) {
        // silent
      }
    }
    loadCustomerPromos();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedAddresses([]);
      return;
    }
    let isMounted = true;
    api.client.get("/addresses")
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setSavedAddresses(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Click outside and Escape key to close saved addresses dropdown
  useEffect(() => {
    if (!showSavedAddresses) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (savedAddressDropdownRef.current && !savedAddressDropdownRef.current.contains(e.target as Node)) {
        setShowSavedAddresses(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSavedAddresses(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSavedAddresses]);

  const handleSelectSavedAddress = (addr: Address) => {
    if (addr.full_name) setCustomerName(addr.full_name);
    if (addr.phone) {
      setCustomerPhone(addr.phone.replace(/\D/g, "").slice(0, 11));
    }

    // Format full address
    const addressParts = [
      addr.address_line1,
      addr.address_line2,
      addr.city,
      addr.postal_code ? `Postal: ${addr.postal_code}` : null,
    ].filter(Boolean);
    setFullAddress(addressParts.join(", "));

    // Intelligently map shippingArea
    if (addr.city) {
      const cityLower = addr.city.toLowerCase();
      if (shippingZones.length > 0) {
        const directMatch = shippingZones.find((z) =>
          z.name.toLowerCase().includes(cityLower) || cityLower.includes(z.name.toLowerCase())
        );
        if (directMatch) {
          setShippingArea(directMatch.id);
        } else if (cityLower === "dhaka") {
          const insideZone = shippingZones.find((z) =>
            z.id.includes("inside") || z.name.toLowerCase().includes("inside") || z.name.toLowerCase().includes("dhaka")
          );
          if (insideZone) setShippingArea(insideZone.id);
        } else {
          const outsideZone = shippingZones.find((z) =>
            z.id.includes("outside") || z.name.toLowerCase().includes("outside")
          );
          if (outsideZone) setShippingArea(outsideZone.id);
        }
      } else {
        if (cityLower === "dhaka") {
          setShippingArea("inside_dhaka");
        } else {
          setShippingArea("outside_dhaka");
        }
      }
    }

    setShowSavedAddresses(false);
    toast.success(`Loaded "${addr.address_name || addr.full_name}" into shipping address`);
  };

  useEffect(() => {
    api.getShippingZones().then((res) => {
      if (res?.zones && res.zones.length > 0) {
        setShippingZones(res.zones);
      }
    }).catch(() => {});
  }, []);

  // Pricing calculations
  const subtotal = getSubtotal();

  const activeZone = shippingZones.find((z) => z.id === shippingArea);
  const baseShippingRate = !shippingArea
    ? 0
    : (activeZone
      ? Number(activeZone.rate)
      : (shippingArea === "inside_dhaka" ? (theme.shipping_inside_dhaka_rate ?? 60) : (theme.shipping_outside_dhaka_rate ?? 120)));

  // Authoritative promotion evaluation
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    const runEvaluation = async () => {
      try {
        const payload = {
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
            price: Number(i.product.price) + (i.variant ? Number(i.variant.price_modifier) : 0),
            category_id: (i.product as any).category_id,
          })),
          code: appliedCoupon?.code || undefined,
          payment_method: paymentMethod,
          shipping_rate: baseShippingRate,
          shipping_method: shippingArea || undefined,
          use_store_credit: useStoreCredit,
        };
        const res = await api.evaluatePromotions(payload);
        if (isMounted && res.valid) {
          setPromotionEvaluation(res);
          if (res.customer_store_credit_balance !== undefined) {
            setStoreCreditBalance(Number(res.customer_store_credit_balance));
          }
        }
      } catch (e) {
        // fallback
      }
    };
    runEvaluation();
    return () => {
      isMounted = false;
    };
  }, [items, appliedCoupon?.code, paymentMethod, shippingArea, baseShippingRate, useStoreCredit, setPromotionEvaluation]);

  // Derived pricing: Delivery charge strictly matches selected shipping area
  const effectiveShipping = !shippingArea ? 0 : baseShippingRate;

  const totalDiscount = promotionEvaluation?.valid
    ? Number(promotionEvaluation.total_discount || 0)
    : getDiscount();

  const vatAmount = promotionEvaluation?.valid && typeof promotionEvaluation.tax_amount === "number"
    ? promotionEvaluation.tax_amount
    : 0;

  const intermediateTotal = Math.max(0, subtotal - totalDiscount) + (shippingArea ? effectiveShipping : 0) + vatAmount;
  const storeCreditDeduction = useStoreCredit ? Math.min(storeCreditBalance, intermediateTotal) : 0;
  const total = Math.max(0, intermediateTotal - storeCreditDeduction);

  // Phone input handler enforcing digits & 11 max chars
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCustomerPhone(val);
  };

  // Coupon handling
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: Number(i.product.price) + (i.variant ? Number(i.variant.price_modifier) : 0),
          category_id: (i.product as any).category_id,
        })),
        code: couponInput.trim(),
        payment_method: paymentMethod,
        shipping_rate: baseShippingRate,
        shipping_method: shippingArea || undefined,
        use_store_credit: useStoreCredit,
      };
      const result = await api.evaluatePromotions(payload);
      if (result.valid) {
        setPromotionEvaluation(result);
        setSelectedClaimId(null);
        applyCoupon({
          valid: true,
          code: couponInput.trim().toUpperCase(),
          discount_type: (result.applied_promotions?.[0]?.discount_type as any) || "fixed",
          value: result.total_discount,
          discount_amount: result.total_discount,
          message: result.message || "Promo code applied!",
        });
        setCouponInput("");
        toast.success(`Promo code applied! Saved ${formatPrice(result.total_discount)}`);
      } else {
        setCouponError(result.error_message || "Invalid or ineligible promo code.");
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || "Failed to validate promo code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyClaimedCode = async (code: string, claimId?: number) => {
    setCouponLoading(true);
    setCouponError(null);
    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: Number(i.product.price) + (i.variant ? Number(i.variant.price_modifier) : 0),
          category_id: (i.product as any).category_id,
        })),
        code: code,
        claimed_coupon_id: claimId || null,
        payment_method: paymentMethod,
        shipping_rate: baseShippingRate,
        shipping_method: shippingArea || undefined,
        use_store_credit: useStoreCredit,
      };
      const result = await api.evaluatePromotions(payload);
      if (result.valid) {
        setPromotionEvaluation(result);
        setSelectedClaimId(claimId || null);
        applyCoupon({
          valid: true,
          code: code,
          discount_type: (result.applied_promotions?.[0]?.discount_type as any) || "fixed",
          value: result.total_discount,
          discount_amount: result.total_discount,
          message: result.message || "Claimed coupon applied!",
        });
        setShowClaimedPicker(false);
        toast.success(`Claimed voucher applied! Saved ${formatPrice(result.total_discount)}`);
      } else {
        setCouponError(result.error_message || "Unable to apply this coupon to current cart.");
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || "Failed to apply claimed coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Background Checkout Abandonment Lead Capture
  useEffect(() => {
    if (!customerName?.trim() || !customerPhone?.trim() || items.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const res = await api.captureLead({
          lead_id: leadId,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || null,
          address: fullAddress.trim() || null,
          city: shippingArea === "inside_dhaka" ? "Inside Dhaka" : (shippingArea ? "Outside Dhaka" : "Not Selected"),
          postal_code: null,
          cart_items: items.map((i) => ({
            product_id: i.product.id,
            title: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.primary_image?.image_url || i.product.images?.[0]?.image_url,
            variant_id: i.variant?.id ?? null,
            variant_name: i.variant?.name ?? null,
          })),
          total_amount: total,
        });
        if (res?.lead_id) {
          setLeadId(res.lead_id);
        }
      } catch (err) {
        // Silently handle background lead capture
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [customerName, customerPhone, customerEmail, fullAddress, shippingArea, items, total, leadId]);

  // Order Submission Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!cleanPhone.startsWith("01") || cleanPhone.length !== 11) {
      toast.error("Please enter a valid 11-digit mobile number starting with 01 (e.g. 017XXXXXXXX).");
      return;
    }

    if (!fullAddress.trim()) {
      toast.error("Please enter your complete delivery address.");
      return;
    }

    if (!shippingArea) {
      toast.error("Please select a delivery area.");
      return;
    }

    if (!agreeTerms) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy to proceed.");
      return;
    }

    if (hasInvalidItems()) {
      toast.error("Please remove or adjust unavailable items in your cart before placing your order.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Authoritative pre-order server validation
      const valResult = await validateCartWithServer();
      if (valResult && (!valResult.is_valid || valResult.summary?.has_out_of_stock || valResult.summary?.has_inactive_items)) {
        const errorMsg = "Some items in your cart need your attention before proceeding.";
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || `${cleanPhone}@guest.store`,
        customer_phone: cleanPhone,
        shipping_address: {
          full_name: customerName.trim(),
          address_line1: fullAddress.trim(),
          address_line2: orderNotes.trim() ? `Note: ${orderNotes.trim()}` : "",
          city: shippingArea === "inside_dhaka" ? "Dhaka" : (shippingArea === "dhaka_suburbs" ? "Gazipur" : "Outside Dhaka"),
          district: shippingArea === "inside_dhaka" ? "Dhaka" : (shippingArea === "dhaka_suburbs" ? "Gazipur" : "Outside Dhaka"),
          postal_code: "1000",
          country: "Bangladesh",
          phone: cleanPhone,
        },
        billing_address: {
          full_name: customerName.trim(),
          address_line1: fullAddress.trim(),
          city: shippingArea === "inside_dhaka" ? "Dhaka" : (shippingArea === "dhaka_suburbs" ? "Gazipur" : "Outside Dhaka"),
          postal_code: "1000",
          country: "Bangladesh",
        },
        payment_method: paymentMethod,
        shipping_method: shippingArea,
        coupon_code: appliedCoupon?.code,
        claimed_coupon_id: selectedClaimId,
        use_store_credit: useStoreCredit,
        notes: orderNotes.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          quantity: item.quantity,
        })),
      };

      const res = await api.createOrder(orderPayload, idempotencyKey);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#06b6d4", "#a855f7", "#ec4899", "#f59e0b"],
        });
      } catch (e) {}

      clearCart();
      if (res.payment_url) {
        toast.success("Order registered. Redirecting to secure payment...");
        window.location.href = res.payment_url;
        return;
      }

      toast.success("Order placed successfully!");
      router.push(`/order-confirmed?order_number=${res.order.order_number}`);
    } catch (err: any) {
      console.warn("Order placement failed:", err);
      const validationErrors = err.response?.data?.errors;
      const errorMsg = validationErrors
        ? Object.values(validationErrors).flat().join(" ")
        : (err.response?.data?.message || "Failed to process order. Please verify your details.");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400">Add products to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md theme-btn-primary text-xs font-bold shadow-lg cursor-pointer"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Top Quick Auth Strip (For Guest Users) */}
      {!isAuthenticated && (
        <div className="p-3 sm:p-4 rounded-xl theme-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Have an account? Please login or register for fast checkout.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="px-4 py-1.5 rounded-md theme-btn-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cart Validation Notices Banner */}
      {validationNotices.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Cart Updated Due to Inventory or Price Changes</span>
            </span>
            <button
              type="button"
              onClick={dismissNotices}
              className="text-[11px] underline hover:opacity-80 cursor-pointer font-medium"
            >
              Dismiss
            </button>
          </div>
          <ul className="list-disc pl-5 text-[11px] space-y-0.5 pt-1">
            {validationNotices.map((n, idx) => (
              <li key={idx}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cart Has Invalid Items Warning */}
      {hasInvalidItems() && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Some items in your cart are no longer available or exceed available stock. Please remove or adjust them in the Order Review list before placing your order.</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        {/* Main 2-Column Responsive Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Order Review & Shipping Address              */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. ORDER REVIEW CARD */}
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <span className="w-1.5 h-4.5 rounded-full bg-cyan-400" />
                <h3 
                  className="text-sm sm:text-base font-black tracking-tight"
                  style={{ color: "#000000" }}
                >
                  Order Review
                </h3>
                <span className="ml-auto text-[11px] font-bold text-slate-400">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 divide-y divide-white/5">
                {items.map((item) => {
                  const itemPrice = Number(item.product.price) + (item.variant ? Number(item.variant.price_modifier) : 0);
                  const imageUrl = item.product.primary_image?.image_url || item.product.images?.[0]?.image_url || "/placeholder.png";
                  const availableStock = item.availableStock !== undefined
                    ? item.availableStock
                    : getAvailableStock(item.product, item.variant);
                  const isOutOfStock = availableStock <= 0 || item.validationStatus === "out_of_stock";
                  const isUnavailable =
                    item.validationStatus === "inactive" ||
                    item.validationStatus === "product_not_found" ||
                    item.validationStatus === "variant_not_found" ||
                    item.validationStatus === "variant_mismatch";
                  const isExceeded = !isUnavailable && !isOutOfStock && item.quantity > availableStock;
                  const isPriceChanged = item.validationStatus === "price_changed" || (item.validationMessage && item.validationMessage.includes("Price updated"));
                  const isQuantityAdjusted = item.validationStatus === "quantity_adjusted";

                  return (
                    <div
                      key={`${item.product.id}-${item.variant?.id ?? "none"}`}
                      className={`pt-3 first:pt-0 flex items-center gap-3 sm:gap-4 ${
                        isOutOfStock || isUnavailable ? "opacity-70" : ""
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className={`w-full h-full object-cover ${isOutOfStock || isUnavailable ? "grayscale" : ""}`}
                        />
                        {(isOutOfStock || isUnavailable) && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-wider px-1 py-0.5 bg-rose-500 rounded">
                              {isOutOfStock ? "Out of Stock" : "Unavailable"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details & Variant */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>

                        {/* Variant / Color pill */}
                        {(item.selectedColor || item.selectedSize || item.variant?.name) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            {item.variant?.name && <span>{item.variant.name}</span>}
                            {item.selectedColor && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                                {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                                {item.selectedSize}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Item Status Messages */}
                        {isOutOfStock ? (
                          <span className="inline-block text-[10px] font-bold text-rose-500">
                            Out of stock
                          </span>
                        ) : isUnavailable ? (
                          <span className="inline-block text-[10px] font-bold text-amber-500">
                            Product unavailable
                          </span>
                        ) : isExceeded ? (
                          <span className="inline-block text-[10px] font-bold text-rose-500">
                            Only {availableStock} available in stock
                          </span>
                        ) : null}

                        {isQuantityAdjusted && item.validationMessage && (
                          <p className="text-[10px] text-amber-500 font-medium">
                            {item.validationMessage}
                          </p>
                        )}

                        {isPriceChanged && item.validationMessage && (
                          <p className="text-[10px] text-cyan-500 font-medium">
                            {item.validationMessage}
                          </p>
                        )}

                        {/* Inline Quantity Stepper */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span 
                            className="text-[11px] font-semibold"
                            style={{ color: "var(--theme-text-body, #64748b)" }}
                          >
                            Qty:
                          </span>
                          <div className="flex items-center border border-black/15 dark:border-white/15 rounded-lg bg-black/5 dark:bg-white/5 overflow-hidden shadow-xs">
                            <button
                              type="button"
                              disabled={item.quantity <= 1 || isOutOfStock || isUnavailable}
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.product.id, item.variant?.id, item.quantity - 1);
                                }
                              }}
                              className="px-2 py-1 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Decrease quantity"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span 
                              className="px-2.5 py-0.5 text-xs font-black font-mono min-w-[22px] text-center"
                              style={{ color: "var(--theme-text-heading, #0f172a)" }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= availableStock || isOutOfStock || isUnavailable}
                              onClick={() => {
                                const res = updateQuantity(item.product.id, item.variant?.id, item.quantity + 1);
                                if (!res.success && res.message) {
                                  toast.warning(res.message);
                                }
                              }}
                              className="px-2 py-1 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={item.quantity >= availableStock ? "Maximum available stock reached" : "Increase quantity"}
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price & Remove Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span 
                          className="text-xs sm:text-sm font-black font-mono"
                          style={{ color: "var(--theme-text-heading, #0f172a)" }}
                        >
                          {formatPrice(itemPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SHIPPING ADDRESS CARD */}
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4.5 rounded-full bg-cyan-400" />
                  <h3 
                    className="text-sm sm:text-base font-black tracking-tight"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Shipping Address
                  </h3>
                </div>

                {/* Saved Addresses Dropdown Trigger */}
                {isAuthenticated && savedAddresses.length > 0 && (
                  <div className="relative" ref={savedAddressDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Saved Addresses</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSavedAddresses ? "rotate-180" : ""}`} />
                    </button>

                    {/* Minimal & Elegant Saved Addresses Dropdown */}
                    {showSavedAddresses && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#111625] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Select a Saved Address
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 overscroll-contain">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => handleSelectSavedAddress(addr)}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                  {addr.address_name || addr.full_name}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {addr.full_name}{addr.phone ? ` • ${addr.phone}` : ""}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {addr.address_line1}, {addr.city}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <label 
                    className="text-[11px] font-bold block"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* 2-Column Row: Phone Number & Shipping Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold block"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      placeholder="01XXXXXXXXX"
                      className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  {/* Shipping Area Dropdown */}
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold block"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Shipping Area <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={shippingArea}
                        onChange={(e) => setShippingArea(e.target.value)}
                        className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs appearance-none pr-8 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                      >
                        <option value="" disabled>
                          Select Shipping Area...
                        </option>
                        {shippingZones.length > 0 ? (
                          shippingZones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name} ({formatPrice(zone.rate)}) {zone.duration ? `• ${zone.duration}` : ""}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="inside_dhaka">
                              Inside Dhaka ({formatPrice(theme.shipping_inside_dhaka_rate ?? 60)})
                            </option>
                            <option value="outside_dhaka">
                              Outside Dhaka ({formatPrice(theme.shipping_outside_dhaka_rate ?? 120)})
                            </option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Email Address (Moved above Full Address per user request) */}
                <div className="space-y-1">
                  <label 
                    className="text-[11px] font-bold block"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Email Address <span className="text-[10px] text-slate-500 font-normal">(Optional - for order receipt)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Full Address Textarea */}
                <div className="space-y-1">
                  <label 
                    className="text-[11px] font-bold block"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Full Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="House number, road/street, area, landmark, city..."
                    className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-400 transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Payment Method & Order Summary              */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">

            {/* 3. PAYMENT METHOD CARD */}
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <span className="w-1.5 h-4.5 rounded-full bg-cyan-400" />
                <h3 
                  className="text-sm sm:text-base font-black tracking-tight"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  Payment Method
                </h3>
              </div>

              {/* Payment Selectable Cards */}
              <div className="space-y-3 text-xs">
                {paymentMethods.map((method) => {
                  const isSelected = paymentMethod === method.code;
                  const isAvailable = method.available;

                  if (isAvailable) {
                    return (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setPaymentMethod(method.code)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-500/10"
                            : "border-black/10 dark:border-white/10 hover:border-cyan-400/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                            <Banknote className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <span 
                              className="font-black block text-xs"
                              style={{ color: "var(--theme-text-heading, #0f172a)" }}
                            >
                              {method.name}
                            </span>
                            <span 
                              className="text-[10px]"
                              style={{ color: "var(--theme-text-body, #64748b)" }}
                            >
                              {method.description}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-400"
                            : "border-slate-300 dark:border-slate-600"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-3" />}
                        </div>
                      </button>
                    );
                  }

                  // Unavailable online payment option (clearly disabled & coming soon)
                  return (
                    <div
                      key={method.code}
                      className="p-3.5 rounded-xl border border-dashed border-black/15 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] opacity-60 cursor-not-allowed flex items-center justify-between text-left select-none"
                      title={method.notice || "Online payment is currently unavailable"}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30 shrink-0">
                          <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="font-bold text-xs"
                              style={{ color: "var(--theme-text-heading, #0f172a)" }}
                            >
                              {method.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Coming soon
                            </span>
                          </div>
                          <span 
                            className="text-[10px] block"
                            style={{ color: "var(--theme-text-body, #64748b)" }}
                          >
                            {method.notice || method.description}
                          </span>
                        </div>
                      </div>
                      <div className="p-1 rounded bg-black/5 dark:bg-white/5 text-slate-400 shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Only verified Cash on Delivery is currently supported. Inspect items upon delivery.</span>
                </div>
              </div>
            </div>

            {/* 4. ORDER SUMMARY CARD */}
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <span className="w-1.5 h-4.5 rounded-full bg-cyan-400" />
                <h3 
                  className="text-sm sm:text-base font-black tracking-tight"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  Order Summary
                </h3>
              </div>

              {/* In-Card Promo Code Form */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-300">{appliedCoupon.code}</span>
                    <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">(-{formatPrice(totalDiscount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setSelectedClaimId(null);
                      setPromotionEvaluation(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-500 font-bold transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Coupon Code"
                        className="w-full theme-input rounded-md pl-8.5 pr-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer border border-white/10"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>

                  {/* Pick from Claimed Coupons */}
                  {claimedCoupons.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowClaimedPicker(!showClaimedPicker)}
                        className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        Select from My Claimed Vouchers ({claimedCoupons.length})
                      </button>

                      {showClaimedPicker && (
                        <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                          {claimedCoupons.map((c: any, idx: number) => {
                            const voucherCode = c.code || c.claimed_code || "";
                            const voucherName = c.name || c.promotion?.name || "Special Voucher";
                            const discountDisplay = c.discount_type === "percentage"
                              ? `${c.discount_value}% OFF`
                              : c.discount_type === "fixed_amount"
                              ? `৳${c.discount_value} OFF`
                              : "Special Discount";
                            const key = c.claim_id || c.id || `claim-${idx}`;
                            const claimId = c.claim_id || c.id;

                            return (
                              <div
                                key={key}
                                onClick={() => handleApplyClaimedCode(voucherCode, claimId)}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#111625] hover:bg-amber-50/50 dark:hover:bg-amber-500/10 border border-gray-200 dark:border-white/10 hover:border-amber-400/50 dark:hover:border-amber-500/30 cursor-pointer transition-colors text-xs shadow-xs"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {voucherName}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                                      {discountDisplay}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {voucherCode && (
                                      <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        {voucherCode}
                                      </span>
                                    )}
                                    {c.min_order_amount > 0 && (
                                      <span className="text-[10px] text-slate-400">
                                        Min spend: ৳{Number(c.min_order_amount).toLocaleString()}
                                      </span>
                                    )}
                                    {c.expires_at && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                        Expires: {new Date(c.expires_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplyClaimedCode(voucherCode);
                                  }}
                                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </div>
              )}

              {/* Store Credit Toggle Card */}
              {storeCreditBalance > 0 && (
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">Use Store Credit</span>
                        <span className="text-[11px] text-cyan-300">Available: ৳{storeCreditBalance.toLocaleString()}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useStoreCredit}
                      onChange={(e) => setUseStoreCredit(e.target.checked)}
                      className="w-4 h-4 rounded border-cyan-500/50 bg-black/40 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                  {useStoreCredit && (
                    <div className="text-[11px] text-slate-300 pt-1.5 border-t border-cyan-500/20 flex justify-between">
                      <span>Store Credit Applied:</span>
                      <span className="font-mono font-bold text-cyan-400">
                        -৳{storeCreditDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Line Items Pricing Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-white/5">
                <div 
                  className="flex justify-between"
                  style={{ color: "var(--theme-text-body, #64748b)" }}
                >
                  <span>Subtotal</span>
                  <span 
                    className="font-bold font-mono"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {/* Itemized Applied Promotions */}
                {promotionEvaluation?.applied_promotions && promotionEvaluation.applied_promotions.length > 0 ? (
                  <div className="space-y-1 py-1 border-t border-dashed border-white/10">
                    {promotionEvaluation.applied_promotions.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-amber-300">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {p.promotion_name} {p.code ? `(${p.code})` : ""}
                        </span>
                        <span className="font-mono font-bold">
                          {p.discount_amount > 0 ? `-${formatPrice(p.discount_amount)}` : "Applied"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : totalDiscount > 0 ? (
                  <div className="flex justify-between text-emerald-500 font-bold font-mono">
                    <span>Discount</span>
                    <span>-{formatPrice(totalDiscount)}</span>
                  </div>
                ) : null}

                <div 
                  className="flex justify-between"
                  style={{ color: "var(--theme-text-body, #64748b)" }}
                >
                  <span>Delivery Charge</span>
                  <span 
                    className="font-bold font-mono"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    {!shippingArea ? (
                      <span className="text-slate-400 font-normal italic">Select area</span>
                    ) : (
                      formatPrice(effectiveShipping)
                    )}
                  </span>
                </div>

                {vatAmount > 0 && (
                  <div 
                    className="flex justify-between"
                    style={{ color: "var(--theme-text-body, #64748b)" }}
                  >
                    <span>VAT ({promotionEvaluation?.vat_rate ?? 8}%)</span>
                    <span 
                      className="font-bold font-mono"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      +{formatPrice(vatAmount)}
                    </span>
                  </div>
                )}

                {useStoreCredit && storeCreditDeduction > 0 && (
                  <div className="flex justify-between text-cyan-400 font-bold font-mono">
                    <span>Store Credit Used</span>
                    <span>-{formatPrice(storeCreditDeduction)}</span>
                  </div>
                )}

                {/* Bold Total Line */}
                <div className="flex justify-between items-center text-sm font-black pt-3 border-t border-black/10 dark:border-white/10">
                  <span style={{ color: "var(--theme-text-heading, #0f172a)" }}>Total</span>
                  <span className="text-lg text-cyan-500 font-mono font-black">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-cyan-400 focus:ring-0 focus:ring-offset-0 bg-white/5 cursor-pointer"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <Link href="/terms" className="text-cyan-400 hover:underline">
                      Terms and Conditions
                    </Link>
                    ,{" "}
                    <Link href="/privacy" className="text-cyan-400 hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    &{" "}
                    <Link href="/refund-policy" className="text-cyan-400 hover:underline">
                      Refund Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {/* Order Notes (Optional) */}
              <div className="space-y-1">
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Order notes (optional) - e.g. landmark, call before arrival..."
                  className="w-full theme-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* High-Conversion Confirm Order CTA */}
              <button
                type="submit"
                disabled={loading || hasInvalidItems() || isValidating}
                className="w-full py-3.5 rounded-md theme-btn-primary hover:opacity-95 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isValidating ? "Validating Cart..." : "Processing Order..."}</span>
                  </>
                ) : hasInvalidItems() ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                    <span>Fix Unavailable Items to Order</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm Order • {formatPrice(total)}</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      </form>

    </div>
  );
}
