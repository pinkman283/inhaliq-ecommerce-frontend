"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, 
  Save, 
  Store, 
  DollarSign, 
  Truck, 
  RotateCcw, 
  Loader2,
  Palette,
  GitCommit,
  Search,
  Smartphone,
  Bell,
  Cpu,
  Puzzle,
  LayoutTemplate,
  ChevronRight,
  ArrowUpRight,
  FileText,
  BookOpen,
  Layers,
  ExternalLink,
  Mail,
  Boxes,
  ShoppingBag,
  Phone,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { setAppCurrencySymbol } from "@/lib/utils";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminSaveBar } from "@/components/admin/ui";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [storeName, setStoreName] = useState("AETHER Hardware Labs");
  const [supportEmail, setSupportEmail] = useState("ops@aether-audio.test");
  const [supportPhone, setSupportPhone] = useState("+1 (555) 019-2834");
  const [storeAddress, setStoreAddress] = useState("San Francisco, CA, USA");
  const [currency, setCurrency] = useState("BDT");
  const [currencySymbol, setCurrencySymbol] = useState("৳");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState("8.0");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("100.0");
  const [standardShippingRate, setStandardShippingRate] = useState("15.0");
  const [priorityShippingRate, setPriorityShippingRate] = useState("25.0");

  // Product & Order Rules
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [reviewsAutoApprove, setReviewsAutoApprove] = useState(false);
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(true);
  const [otpShieldEnabled, setOtpShieldEnabled] = useState(true);
  const [orderInvoicePrefix, setOrderInvoicePrefix] = useState("INV-");

  const [initialSettings, setInitialSettings] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("aether_admin_token") : null;
        if (!token) return;

        const data = await adminApi.getSettings();
        const isVatOn = data.vat_enabled !== undefined
          ? (data.vat_enabled?.value === "true" || data.vat_enabled?.value === "1" || data.vat_enabled?.value === true)
          : (data.tax_enabled !== undefined
              ? (data.tax_enabled?.value === "true" || data.tax_enabled?.value === "1" || data.tax_enabled?.value === true)
              : true);
        const loadedVatRate = data.vat_rate?.value || data.tax_rate?.value || "8.0";
        const isReviewsAutoOn = data.reviews_auto_approve?.value === "true" || data.reviews_auto_approve?.value === "1" || data.reviews_auto_approve?.value === true;
        const isGuestCheckoutOn = data.guest_checkout_enabled !== undefined 
          ? (data.guest_checkout_enabled?.value === "true" || data.guest_checkout_enabled?.value === "1" || data.guest_checkout_enabled?.value === true)
          : true;
        const isOtpShieldOn = data.otp_shield_enabled !== undefined
          ? (data.otp_shield_enabled?.value === "true" || data.otp_shield_enabled?.value === "1" || data.otp_shield_enabled?.value === true)
          : true;

        const loadedCurrency = data.currency?.value || "BDT";
        const loadedSymbol = data.currency_symbol?.value || (loadedCurrency === "BDT" ? "৳" : (loadedCurrency === "USD" ? "$" : (loadedCurrency === "EUR" ? "€" : (loadedCurrency === "GBP" ? "£" : "$"))));

        const loadedStoreName = data.store_name?.value || "INHALIQ";
        const loadedSupportEmail = data.support_email?.value || "support@inhaliq.com";
        const loadedSupportPhone = data.support_phone?.value || "+880 1711-521098";
        const loadedStoreAddress = data.store_address?.value || "Dhaka, Bangladesh";
        const loadedFreeShipping = data.free_shipping_threshold?.value || "150";
        const loadedStandardShipping = data.standard_shipping_rate?.value || "60";
        const loadedPriorityShipping = data.priority_shipping_rate?.value || "120";
        const loadedLowStock = data.low_stock_threshold?.value || "5";
        const loadedInvoicePrefix = data.order_invoice_prefix?.value || "INV-";

        const init = {
          store_name: loadedStoreName,
          support_email: loadedSupportEmail,
          support_phone: loadedSupportPhone,
          store_address: loadedStoreAddress,
          currency: loadedCurrency,
          currency_symbol: loadedSymbol,
          vat_enabled: isVatOn,
          vat_rate: loadedVatRate,
          free_shipping_threshold: loadedFreeShipping,
          standard_shipping_rate: loadedStandardShipping,
          priority_shipping_rate: loadedPriorityShipping,
          low_stock_threshold: loadedLowStock,
          reviews_auto_approve: isReviewsAutoOn,
          guest_checkout_enabled: isGuestCheckoutOn,
          otp_shield_enabled: isOtpShieldOn,
          order_invoice_prefix: loadedInvoicePrefix,
        };

        setStoreName(loadedStoreName);
        setSupportEmail(loadedSupportEmail);
        setSupportPhone(loadedSupportPhone);
        setStoreAddress(loadedStoreAddress);
        setCurrency(loadedCurrency);
        setCurrencySymbol(loadedSymbol);
        setAppCurrencySymbol(loadedSymbol);
        setVatEnabled(isVatOn);
        setVatRate(loadedVatRate);
        setFreeShippingThreshold(loadedFreeShipping);
        setStandardShippingRate(loadedStandardShipping);
        setPriorityShippingRate(loadedPriorityShipping);
        setLowStockThreshold(loadedLowStock);
        setReviewsAutoApprove(isReviewsAutoOn);
        setGuestCheckoutEnabled(isGuestCheckoutOn);
        setOtpShieldEnabled(isOtpShieldOn);
        setOrderInvoicePrefix(loadedInvoicePrefix);
        setInitialSettings(init);
      } catch (err: any) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error("Failed to load settings:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const isDirty = Boolean(
    initialSettings && (
      storeName !== initialSettings.store_name ||
      supportEmail !== initialSettings.support_email ||
      supportPhone !== initialSettings.support_phone ||
      storeAddress !== initialSettings.store_address ||
      currency !== initialSettings.currency ||
      currencySymbol !== initialSettings.currency_symbol ||
      vatEnabled !== initialSettings.vat_enabled ||
      vatRate !== initialSettings.vat_rate ||
      freeShippingThreshold !== initialSettings.free_shipping_threshold ||
      standardShippingRate !== initialSettings.standard_shipping_rate ||
      priorityShippingRate !== initialSettings.priority_shipping_rate ||
      lowStockThreshold !== initialSettings.low_stock_threshold ||
      reviewsAutoApprove !== initialSettings.reviews_auto_approve ||
      guestCheckoutEnabled !== initialSettings.guest_checkout_enabled ||
      otpShieldEnabled !== initialSettings.otp_shield_enabled ||
      orderInvoicePrefix !== initialSettings.order_invoice_prefix
    )
  );

  const handleReset = () => {
    if (!isDirty || !initialSettings) return;
    setStoreName(initialSettings.store_name);
    setSupportEmail(initialSettings.support_email);
    setSupportPhone(initialSettings.support_phone);
    setStoreAddress(initialSettings.store_address);
    setCurrency(initialSettings.currency);
    setCurrencySymbol(initialSettings.currency_symbol);
    setAppCurrencySymbol(initialSettings.currency_symbol);
    setVatEnabled(initialSettings.vat_enabled);
    setVatRate(initialSettings.vat_rate);
    setFreeShippingThreshold(initialSettings.free_shipping_threshold);
    setStandardShippingRate(initialSettings.standard_shipping_rate);
    setPriorityShippingRate(initialSettings.priority_shipping_rate);
    setLowStockThreshold(initialSettings.low_stock_threshold);
    setReviewsAutoApprove(initialSettings.reviews_auto_approve);
    setGuestCheckoutEnabled(initialSettings.guest_checkout_enabled);
    setOtpShieldEnabled(initialSettings.otp_shield_enabled);
    setOrderInvoicePrefix(initialSettings.order_invoice_prefix);
    toast.info("Settings reverted.");
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty) {
      toast.info("No changes were made.");
      return;
    }
    setSaving(true);

    const payload = {
      store_name: storeName,
      support_email: supportEmail,
      support_phone: supportPhone,
      store_address: storeAddress,
      currency,
      currency_symbol: currencySymbol,
      vat_enabled: vatEnabled ? "true" : "false",
      vat_rate: vatRate,
      tax_rate: vatRate,
      tax_enabled: vatEnabled ? "true" : "false",
      free_shipping_threshold: freeShippingThreshold,
      standard_shipping_rate: standardShippingRate,
      priority_shipping_rate: priorityShippingRate,
      low_stock_threshold: lowStockThreshold,
      reviews_auto_approve: reviewsAutoApprove ? "true" : "false",
      guest_checkout_enabled: guestCheckoutEnabled ? "true" : "false",
      otp_shield_enabled: otpShieldEnabled ? "true" : "false",
      order_invoice_prefix: orderInvoicePrefix,
    };

    try {
      await adminApi.updateSettings(payload);
      setAppCurrencySymbol(currencySymbol);
      setInitialSettings({
        ...payload,
        vat_enabled: vatEnabled,
        reviews_auto_approve: reviewsAutoApprove,
        guest_checkout_enabled: guestCheckoutEnabled,
        otp_shield_enabled: otpShieldEnabled,
      });
      toast.success("Store configurations updated successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <SettingsNavTabs />
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded bg-white/10" />
            <Skeleton className="h-4 w-72 rounded bg-white/5" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg bg-white/10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-[#0c0e17] p-6 space-y-4">
            <Skeleton className="h-5 w-36 rounded bg-white/10" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0c0e17] p-6 space-y-4">
            <Skeleton className="h-5 w-40 rounded bg-white/10" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      
      {/* Settings Navigation Tabs */}
      <SettingsNavTabs />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">General Store Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure official store identity, currency, VAT policies, and default shipping rates</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings/seo#sitemap"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all shadow-xs"
            title="View & Re-sync Dynamic Sitemap"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Dynamic Sitemap (Live)</span>
          </Link>
        </div>
      </div>

      {/* Quick Jump Bar - Direct access to all settings sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/5 no-scrollbar">
        <a
          href="#store-identity"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition-colors shrink-0"
        >
          <Store className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>Store Identity</span>
        </a>
        <a
          href="#product-rules"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition-colors shrink-0"
        >
          <Boxes className="w-3.5 h-3.5 text-purple-400" />
          <span>Products & Reviews</span>
        </a>
        <a
          href="#order-rules"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] hover:text-[#C4B5FD] border border-[#A78BFA]/30 text-[11px] font-bold transition-colors shrink-0 shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>Order Rules & OTP Shield</span>
        </a>
        <a
          href="#currency-vat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition-colors shrink-0"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Currency & VAT</span>
        </a>
        <a
          href="#shipping-rates"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition-colors shrink-0"
        >
          <Truck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Shipping Rates</span>
        </a>
        <Link
          href="/admin/settings/seo#sitemap"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold transition-colors shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span>SEO &amp; Sitemap</span>
        </Link>
        <a
          href="#workspaces"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition-colors shrink-0"
        >
          <Puzzle className="w-3.5 h-3.5 text-amber-400" />
          <span>Workspaces Directory</span>
        </a>
      </div>

      {/* Form */}
      <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
        
        {/* 1. Store Identity */}
        <div id="store-identity" className="p-5 rounded-md bg-[#0b0e17] border border-white/10 space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <Store className="w-4 h-4 text-[#A78BFA]" />
            <h3 className="text-sm font-bold text-white">General Store Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Official Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Support Phone Number</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Store Physical / Operating Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Street address, city, country"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
          </div>
        </div>

        {/* 2. Product & Inventory Rules */}
        <div id="product-rules" className="p-5 rounded-md bg-[#0b0e17] border border-white/10 space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <Boxes className="w-4 h-4 text-[#A78BFA]" />
            <h3 className="text-sm font-bold text-white">Product & Review Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Low Stock Warning Threshold</label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
              />
              <p className="text-[10px] text-slate-500">Alert admin when product variant inventory drops below this level</p>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Auto-Approve Customer Reviews</span>
                  <span className="text-[10px] text-slate-400">Instantly publish verified customer reviews without manual moderation</span>
                </div>
                <Switch
                  checked={reviewsAutoApprove}
                  onCheckedChange={(checked) => setReviewsAutoApprove(checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Order & Checkout Rules */}
        <div id="order-rules" className="p-5 rounded-md bg-[#0b0e17] border border-white/10 space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Order & Checkout Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Invoice / Order Number Prefix</label>
              <input
                type="text"
                value={orderInvoicePrefix}
                onChange={(e) => setOrderInvoicePrefix(e.target.value)}
                placeholder="e.g. INV-"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
              />
              <p className="text-[10px] text-slate-500">Appended to generated invoice numbers (e.g. INV-2026-0001)</p>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Allow Guest Checkout</span>
                  <span className="text-[10px] text-slate-400">Permit customers to place orders without creating an account</span>
                </div>
                <Switch
                  checked={guestCheckoutEnabled}
                  onCheckedChange={(checked) => setGuestCheckoutEnabled(checked)}
                />
              </div>
            </div>

            <div className="space-y-1 flex flex-col justify-center sm:col-span-2">
              <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Require Email OTP for Customer Registration (OTP Shield)</span>
                  <span className="text-[10px] text-slate-400">When enabled, customers must verify a 6-digit email OTP before account activation. Disable to allow instant 1-step signup without email verification.</span>
                </div>
                <Switch
                  checked={otpShieldEnabled}
                  onCheckedChange={(checked) => setOtpShieldEnabled(checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Financial & Currency */}
        <div id="currency-vat" className="p-5 rounded-md bg-[#0b0e17] border border-white/10 space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Currency & VAT Policies</h3>
              <p className="text-[11px] text-slate-400">Configure store operating currency and VAT calculations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between min-h-[22px]">
                <label className="text-[11px] font-bold text-slate-300 block">Operational Currency</label>
              </div>
              <select
                value={currency}
                onChange={(e) => {
                  const newCurr = e.target.value;
                  setCurrency(newCurr);
                  if (newCurr === "BDT") setCurrencySymbol("৳");
                  else if (newCurr === "USD") setCurrencySymbol("$");
                  else if (newCurr === "EUR") setCurrencySymbol("€");
                  else if (newCurr === "GBP") setCurrencySymbol("£");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white focus:outline-none focus:border-[#A78BFA]/50"
              >
                <option value="BDT" className="bg-[#0e121e]">BDT (৳) - Bangladeshi Taka</option>
                <option value="USD" className="bg-[#0e121e]">USD ($) - US Dollar</option>
                <option value="EUR" className="bg-[#0e121e]">EUR (€) - Euro</option>
                <option value="GBP" className="bg-[#0e121e]">GBP (£) - British Pound</option>
                <option value="CUSTOM" className="bg-[#0e121e]">Custom Currency Sign</option>
              </select>
              <p className="text-[11px] text-slate-500">Preset currency configuration</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between min-h-[22px]">
                <label className="text-[11px] font-bold text-slate-300 block">Currency Sign / Symbol</label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30">
                  Preview: {currencySymbol} 1,250
                </span>
              </div>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. ৳, $, Tk, BDT, AED"
                maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-bold font-mono focus:outline-none focus:border-[#A78BFA]/50 transition-all"
              />
              <p className="text-[11px] text-slate-500">Change dollar ($) to taka (৳) or any custom symbol</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between min-h-[22px]">
                <label className="text-[11px] font-bold text-slate-300 block">Default VAT Rate (%)</label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                    vatEnabled 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                    {vatEnabled ? `Charging ${vatRate || 0}%` : "Turned Off"}
                  </span>
                  <Switch
                    checked={vatEnabled}
                    onCheckedChange={(checked) => setVatEnabled(checked)}
                  />
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required={vatEnabled}
                disabled={!vatEnabled}
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50 transition-all ${
                  !vatEnabled ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5" : ""
                }`}
                placeholder="e.g. 8.0"
              />
              <p className="text-[11px] text-slate-400">
                {vatEnabled
                  ? `Automatically calculated (${vatRate || 0}%) and added to customer orders during checkout.`
                  : "VAT is turned off. Orders will NOT add any VAT to the order price."}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Logistics & Shipping */}
        <div id="shipping-rates" className="p-5 rounded-md bg-[#0b0e17] border border-white/10 space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Logistics & Default Shipping Rates</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Free Shipping Threshold ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Standard Delivery Rate ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={standardShippingRate}
                onChange={(e) => setStandardShippingRate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Priority Express Rate ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={priorityShippingRate}
                onChange={(e) => setPriorityShippingRate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Settings Hub Directory Grid */}
      <div id="workspaces" className="pt-6 border-t border-white/[0.08] space-y-4 scroll-mt-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Configuration Workspaces</h3>
          <p className="text-xs text-slate-400">Direct access to specialized store settings modules</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              title: "Theme & UI Studio",
              desc: "Color palette, dark/light mode, typography, button styles & radius",
              href: "/admin/content/theme",
              icon: Palette,
              color: "text-[#A78BFA]",
            },
            {
              title: "Branding & Store Logo",
              desc: "Store mark, brand typography, favicon, and brand metadata",
              href: "/admin/content/branding",
              icon: Store,
              color: "text-cyan-400",
            },
            {
              title: "Storefront & Hero Layout",
              desc: "Announcement bar, hero headline, trust ribbon & flash deals",
              href: "/admin/content/theme?tab=messaging",
              icon: LayoutTemplate,
              color: "text-emerald-400",
            },
            {
              title: "Homepage Showcase Sections",
              desc: "Configure dynamic category & product show carousels, tabs, sorting, and ordering",
              href: "/admin/content/homepage",
              icon: Layers,
              color: "text-cyan-400",
            },
            {
              title: "CMS Static Pages",
              desc: "Manage legal notices, terms of service, privacy policy, FAQ & about pages",
              href: "/admin/content/pages",
              icon: FileText,
              color: "text-cyan-400",
            },
            {
              title: "Blog & Editorial",
              desc: "Manage published articles, knowledge base, categories, tags & reader comments",
              href: "/admin/content/blog",
              icon: BookOpen,
              color: "text-[#A78BFA]",
            },
            {
              title: "Navigation & Footer",
              desc: "Header navigation menus, footer link columns, copyright & badges",
              href: "/admin/content/footer",
              icon: Layers,
              color: "text-violet-400",
            },
            {
              title: "Social Links & Outreach",
              desc: "Configure WhatsApp, Instagram, Facebook, Twitter & support channels",
              href: "/admin/content/social",
              icon: ExternalLink,
              color: "text-pink-400",
            },
            {
              title: "Shipping Zones & Rates",
              desc: "Regional delivery fees, courier integrations, and free shipping triggers",
              href: "/admin/orders/shipping",
              icon: Truck,
              color: "text-blue-400",
            },
            {
              title: "Order Pipeline Statuses",
              desc: "Lifecycle stages, notification triggers, and fulfillment states",
              href: "/admin/orders/statuses",
              icon: GitCommit,
              color: "text-purple-400",
            },
            {
              title: "SEO & Search Metadata",
              desc: "Global meta titles, descriptions, Open Graph images & sitemap",
              href: "/admin/settings/seo",
              icon: Search,
              color: "text-pink-400",
            },
            {
              title: "Mobile & PWA Studio",
              desc: "Progressive Web App manifest, offline caching, and app icons",
              href: "/admin/settings/pwa",
              icon: Smartphone,
              color: "text-indigo-400",
            },
            {
              title: "Notification Templates",
              desc: "Transactional email & SMS customer notification templates",
              href: "/admin/settings/notifications",
              icon: Bell,
              color: "text-[#A78BFA]",
            },
            {
              title: "Mail Configuration",
              desc: "Configure SMTP transport for system outbound emails",
              href: "/admin/settings/mail",
              icon: Mail,
              color: "text-rose-400",
            },
            {
              title: "Integrations & Tracking",
              desc: "Google Tag Manager, Meta Pixel, webhooks, and analytics scripts",
              href: "/admin/integrations",
              icon: Puzzle,
              color: "text-teal-400",
            },
            {
              title: "System & Cache Hub",
              desc: "Application cache purge, sitemap generation & health checks",
              href: "/admin/settings/system",
              icon: Cpu,
              color: "text-slate-400",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group p-4 rounded-md bg-[#0f121b] hover:bg-[#131722] border border-white/[0.08] hover:border-[#A78BFA]/30 transition-all flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white group-hover:text-[#B9A3FF] transition-colors">
                      {item.title}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-[#A78BFA] transition-colors shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSaveSettings}
        onDiscard={handleReset}
        saveLabel="Save Settings"
        discardLabel="Discard"
        message="Unsaved store settings"
      />
    </div>
  );
}
