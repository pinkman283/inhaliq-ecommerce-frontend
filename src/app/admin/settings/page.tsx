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
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminSaveBar } from "@/components/admin/ui";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [storeName, setStoreName] = useState("AETHER Hardware Labs");
  const [supportEmail, setSupportEmail] = useState("ops@aether-audio.test");
  const [supportPhone, setSupportPhone] = useState("+1 (555) 019-2834");
  const [storeAddress, setStoreAddress] = useState("San Francisco, CA, USA");
  const [currency, setCurrency] = useState("USD");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState("8.0");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("100.0");
  const [standardShippingRate, setStandardShippingRate] = useState("15.0");
  const [priorityShippingRate, setPriorityShippingRate] = useState("25.0");

  // Product & Order Rules
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [reviewsAutoApprove, setReviewsAutoApprove] = useState(false);
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(true);
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

        const init = {
          store_name: data.store_name?.value || "AETHER Sound Systems",
          support_email: data.support_email?.value || "support@aether-audio.test",
          support_phone: data.support_phone?.value || "+1 (555) 019-2834",
          store_address: data.store_address?.value || "San Francisco, CA, USA",
          currency: data.currency?.value || "USD",
          vat_enabled: isVatOn,
          vat_rate: loadedVatRate,
          free_shipping_threshold: data.free_shipping_threshold?.value || "150",
          standard_shipping_rate: data.standard_shipping_rate?.value || "15",
          priority_shipping_rate: data.priority_shipping_rate?.value || "35",
          low_stock_threshold: data.low_stock_threshold?.value || "5",
          reviews_auto_approve: isReviewsAutoOn,
          guest_checkout_enabled: isGuestCheckoutOn,
          order_invoice_prefix: data.order_invoice_prefix?.value || "INV-",
        };
        setInitialSettings(init);
        if (data.store_name?.value) setStoreName(data.store_name.value);
        if (data.support_email?.value) setSupportEmail(data.support_email.value);
        if (data.support_phone?.value) setSupportPhone(data.support_phone.value);
        if (data.store_address?.value) setStoreAddress(data.store_address.value);
        if (data.currency?.value) setCurrency(data.currency.value);
        setVatEnabled(isVatOn);
        setVatRate(loadedVatRate);
        if (data.free_shipping_threshold?.value) setFreeShippingThreshold(data.free_shipping_threshold.value);
        if (data.standard_shipping_rate?.value) setStandardShippingRate(data.standard_shipping_rate.value);
        if (data.priority_shipping_rate?.value) setPriorityShippingRate(data.priority_shipping_rate.value);
        if (data.low_stock_threshold?.value) setLowStockThreshold(data.low_stock_threshold.value);
        setReviewsAutoApprove(isReviewsAutoOn);
        setGuestCheckoutEnabled(isGuestCheckoutOn);
        if (data.order_invoice_prefix?.value) setOrderInvoicePrefix(data.order_invoice_prefix.value);
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
      vatEnabled !== initialSettings.vat_enabled ||
      vatRate !== initialSettings.vat_rate ||
      freeShippingThreshold !== initialSettings.free_shipping_threshold ||
      standardShippingRate !== initialSettings.standard_shipping_rate ||
      priorityShippingRate !== initialSettings.priority_shipping_rate ||
      lowStockThreshold !== initialSettings.low_stock_threshold ||
      reviewsAutoApprove !== initialSettings.reviews_auto_approve ||
      guestCheckoutEnabled !== initialSettings.guest_checkout_enabled ||
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
    setVatEnabled(initialSettings.vat_enabled);
    setVatRate(initialSettings.vat_rate);
    setFreeShippingThreshold(initialSettings.free_shipping_threshold);
    setStandardShippingRate(initialSettings.standard_shipping_rate);
    setPriorityShippingRate(initialSettings.priority_shipping_rate);
    setLowStockThreshold(initialSettings.low_stock_threshold);
    setReviewsAutoApprove(initialSettings.reviews_auto_approve);
    setGuestCheckoutEnabled(initialSettings.guest_checkout_enabled);
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
      order_invoice_prefix: orderInvoicePrefix,
    };

    try {
      await adminApi.updateSettings(payload);
      setInitialSettings({
        ...payload,
        vat_enabled: vatEnabled,
        reviews_auto_approve: reviewsAutoApprove,
        guest_checkout_enabled: guestCheckoutEnabled,
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
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Loading Store Configurations...
        </span>
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
      </div>

      {/* Form */}
      <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
        
        {/* 1. Store Identity */}
        <div className="p-5 rounded-xl bg-[#0b0e17] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <Store className="w-4 h-4 text-amber-400" />
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Official Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Support Phone Number</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Store Physical / Operating Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Street address, city, country"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Product & Inventory Rules */}
        <div className="p-5 rounded-xl bg-[#0b0e17] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
            <Boxes className="w-4 h-4 text-amber-400" />
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-500">Alert admin when product variant inventory drops below this level</p>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
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
        <div className="p-5 rounded-xl bg-[#0b0e17] border border-white/10 space-y-4">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-500">Appended to generated invoice numbers (e.g. INV-2026-0001)</p>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
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
          </div>
        </div>

        {/* 2. Financial & Currency */}
        <div className="p-5 rounded-xl bg-[#0b0e17] border border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Currency & VAT Policies</h3>
                <p className="text-[11px] text-slate-400">Configure store operating currency and VAT calculations</p>
              </div>
            </div>
            <Switch
              checked={vatEnabled}
              onCheckedChange={(checked) => setVatEnabled(checked)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Operational Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="USD" className="bg-[#0e121e]">USD ($) - US Dollar</option>
                <option value="BDT" className="bg-[#0e121e]">BDT (৳) - Bangladeshi Taka</option>
                <option value="EUR" className="bg-[#0e121e]">EUR (€) - Euro</option>
                <option value="GBP" className="bg-[#0e121e]">GBP (£) - British Pound</option>
              </select>
              <p className="text-[11px] text-slate-500">Primary currency for product pricing and transactions</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 block">Default VAT Rate (%)</label>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  vatEnabled 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                }`}>
                  {vatEnabled ? `Charging ${vatRate || 0}%` : "Turned Off (0% applied)"}
                </span>
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
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400 transition-all ${
                  !vatEnabled ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5" : ""
                }`}
                placeholder="e.g. 8.0"
              />
              <p className="text-[11px] text-slate-400">
                {vatEnabled
                  ? "Automatically calculated and added to customer orders during checkout."
                  : "VAT is turned off. Orders will NOT add any VAT to the order price."}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Logistics & Shipping */}
        <div className="p-5 rounded-xl bg-[#0b0e17] border border-white/10 space-y-4">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Settings Hub Directory Grid */}
      <div className="pt-6 border-t border-white/[0.08] space-y-4">
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
              color: "text-amber-400",
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
              color: "text-amber-400",
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
              color: "text-yellow-400",
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
                className="group p-4 rounded-xl bg-[#0f121b] hover:bg-[#131722] border border-white/[0.08] hover:border-amber-400/30 transition-all flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
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
