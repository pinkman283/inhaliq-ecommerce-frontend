"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Puzzle, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Mail, 
  MessageCircle, 
  BarChart3, 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Loader2, 
  Settings, 
  Activity, 
  Zap, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ExternalLink,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  Copy,
  AlertTriangle,
  Info,
  Globe,
  Code2,
  Database
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { adminApi } from "@/lib/adminApi";
import { Integration, IntegrationStats } from "@/types";
import { AdminPageHeader, AdminStatStrip, AdminStatusBadge, AdminEmptyState } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { toast } from "sonner";

interface CredentialFieldDef {
  key: string;
  label: string;
  type?: "text" | "password" | "number" | "boolean" | "textarea";
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

interface IntegrationSchema {
  credentials: CredentialFieldDef[];
  settings?: CredentialFieldDef[];
}

const INTEGRATION_SCHEMAS: Record<string, IntegrationSchema> = {
  upstash_redis: {
    credentials: [
      {
        key: "url",
        label: "Upstash REST URL",
        type: "text",
        placeholder: "https://your-db-id.upstash.io",
        required: true,
        helpText: "REST API URL from your Upstash Redis database console.",
      },
      {
        key: "token",
        label: "Upstash REST Token",
        type: "password",
        placeholder: "Enter Upstash REST Bearer Token",
        required: true,
        helpText: "Private REST token. Encrypted at rest (AES-256) and never sent to browser.",
      },
    ],
    settings: [
      {
        key: "default_ttl",
        label: "Default Cache TTL (Seconds)",
        type: "number",
        placeholder: "3600",
        helpText: "Cache retention period in seconds (default: 3600 = 1 hour).",
      },
      {
        key: "cache_navigation",
        label: "Cache Storefront Navigation & Categories",
        type: "boolean",
        helpText: "Caches navbar, menus, and category trees for near-instant page transitions.",
      },
      {
        key: "cache_catalog",
        label: "Cache Public Products & Catalog Pages",
        type: "boolean",
        helpText: "Caches public catalog and featured products for maximum concurrency.",
      },
    ],
  },
  google_tag_manager: {
    credentials: [
      { 
        key: "container_id", 
        label: "GTM Container ID", 
        type: "text", 
        placeholder: "GTM-XXXXXX", 
        required: true,
        helpText: "Standard container ID from Google Tag Manager dashboard."
      },
    ],
    settings: [
      { 
        key: "data_layer_name", 
        label: "Data Layer Object Name", 
        type: "text", 
        placeholder: "dataLayer",
        helpText: "Default is 'dataLayer'. Only change if using custom tag architecture."
      },
    ],
  },
  meta_pixel: {
    credentials: [
      { 
        key: "pixel_id", 
        label: "Meta Pixel / Dataset ID", 
        type: "text", 
        placeholder: "1806216353748383", 
        required: true,
        helpText: "Numeric ID from Meta Events Manager."
      },
      { 
        key: "access_token", 
        label: "Conversions API (CAPI) Access Token", 
        type: "password",
        helpText: "Server-side token for direct CAPI deduplication. Never sent to browser."
      },
      { 
        key: "test_event_code", 
        label: "Test Event Code (Optional)", 
        type: "text", 
        placeholder: "TEST12345",
        helpText: "Temporary code for Meta Events Manager test console verification."
      },
    ],
    settings: [
      { key: "auto_pageview", label: "Track Page Views on Navigation", type: "boolean" },
      { key: "track_view_content", label: "Track Product Views (ViewContent)", type: "boolean" },
      { key: "track_search", label: "Track Search Queries (Search)", type: "boolean" },
      { key: "track_add_to_cart", label: "Track Add to Cart (AddToCart)", type: "boolean" },
      { key: "track_initiate_checkout", label: "Track Checkout Initiation (InitiateCheckout)", type: "boolean" },
      { key: "track_purchase", label: "Track Confirmed Purchases (Purchase)", type: "boolean" },
    ],
  },
  fraud_checker: {
    credentials: [
      { 
        key: "api_key", 
        label: "Fraud Check API Key", 
        type: "password", 
        placeholder: "frd_live_xxxxxxxx", 
        required: true,
        helpText: "Secret key for cross-courier parcel delivery & return verification."
      },
    ],
    settings: [
      { 
        key: "endpoint_url", 
        label: "Lookup Endpoint (Optional)", 
        type: "text", 
        placeholder: "https://api.fraudguard.local/v1/lookup",
        helpText: "Leave blank to use default courier delivery database lookup."
      },
      { 
        key: "auto_flag_threshold_percent", 
        label: "Auto-Flag Return Rate Threshold (%)", 
        type: "number", 
        placeholder: "35",
        helpText: "Flag customers whose historic courier return rate exceeds this percentage."
      },
      { 
        key: "minimum_deliveries_to_evaluate", 
        label: "Minimum Deliveries to Evaluate", 
        type: "number", 
        placeholder: "3",
        helpText: "Customers with fewer courier records will not be penalized."
      },
      { 
        key: "timeout_seconds", 
        label: "Timeout (Seconds)", 
        type: "number", 
        placeholder: "2.5",
        helpText: "Lookup timeout before non-blocking fallback (max 5s)."
      },
    ],
  },
  headless_api: {
    credentials: [
      { 
        key: "primary_api_key", 
        label: "Primary Headless API Key", 
        type: "password", 
        placeholder: "Click 'Rotate Key' to generate new credentials",
        helpText: "Secret token for mobile apps, POS terminals, and external headless storefronts."
      },
      { 
        key: "secondary_api_key", 
        label: "Secondary API Key (Grace Period)", 
        type: "password", 
        placeholder: "Retained during rotation for zero downtime",
        helpText: "Valid until next rotation to allow smooth zero-downtime client updates."
      },
    ],
    settings: [
      { 
        key: "allowed_origins", 
        label: "Allowed Web Origins (CORS)", 
        type: "textarea", 
        placeholder: "http://localhost:3000\nhttps://inhaliq.com\nhttps://aether-ecommerce-frontend.vercel.app",
        helpText: "Exact scheme, domain, and port (one per line). Wildcard '*' is disallowed."
      },
      { 
        key: "api_auth_enabled", 
        label: "Enforce API Key Authentication (X-API-Key)", 
        type: "boolean",
        helpText: "When enabled, incoming headless API requests must pass a valid X-API-Key header."
      },
      { 
        key: "rate_limit_per_minute", 
        label: "Rate Limit (Requests / Min)", 
        type: "number", 
        placeholder: "60",
        helpText: "Maximum headless API requests permitted per minute per client."
      },
    ],
  },
  pathao: {
    credentials: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "e.g. 1024", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Enter client secret", required: true },
      { key: "username", label: "Merchant Email", type: "text", placeholder: "merchant@example.com", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Enter merchant password", required: true },
    ],
    settings: [
      { key: "store_id", label: "Pickup Store ID (Optional)", type: "text", placeholder: "e.g. 84920" },
      { key: "item_type", label: "Item Type", type: "text", placeholder: "Parcel" },
    ],
  },
  steadfast: {
    credentials: [
      { key: "api_key", label: "API Key", type: "text", placeholder: "Enter Steadfast API key", required: true },
      { key: "secret_key", label: "Secret Key", type: "password", placeholder: "Enter Steadfast secret key", required: true },
    ],
    settings: [
      { key: "default_pickup_address", label: "Default Pickup Address", type: "text", placeholder: "e.g. Banani, Dhaka" },
    ],
  },
  redx: {
    credentials: [
      { key: "api_token", label: "API Token", type: "password", placeholder: "Enter RedX API token", required: true },
    ],
    settings: [
      { key: "pickup_store_id", label: "Pickup Store ID", type: "text", placeholder: "e.g. RDX_STR_091" },
    ],
  },
  bkash: {
    credentials: [
      { key: "app_key", label: "App Key", type: "text", required: true },
      { key: "app_secret", label: "App Secret", type: "password", required: true },
      { key: "username", label: "Merchant Username", type: "text", required: true },
      { key: "password", label: "Merchant Password", type: "password", required: true },
    ],
    settings: [
      { key: "currency", label: "Currency", type: "text", placeholder: "BDT" },
      { key: "intent", label: "Payment Intent", type: "text", placeholder: "sale" },
    ],
  },
  nagad: {
    credentials: [
      { key: "merchant_id", label: "Merchant ID", type: "text", required: true },
      { key: "public_key", label: "PG Public Key", type: "password", required: true },
      { key: "private_key", label: "Merchant Private Key", type: "password", required: true },
    ],
  },
  sslcommerz: {
    credentials: [
      { key: "store_id", label: "Store ID", type: "text", required: true },
      { key: "store_passwd", label: "Store Password", type: "password", required: true },
    ],
  },
  stripe: {
    credentials: [
      { key: "publishable_key", label: "Publishable Key", type: "text", required: true },
      { key: "secret_key", label: "Secret Key", type: "password", required: true },
      { key: "webhook_secret", label: "Webhook Secret (Optional)", type: "password" },
    ],
    settings: [
      { key: "capture_method", label: "Capture Method", type: "text", placeholder: "automatic" },
    ],
  },
  cod: {
    credentials: [],
    settings: [
      { key: "max_cod_amount", label: "Max COD Order Amount", type: "number", placeholder: "50000" },
      { key: "extra_fee", label: "COD Extra Processing Fee", type: "number", placeholder: "0" },
    ],
  },
  bulksms_bd: {
    credentials: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "sender_id", label: "Sender ID (Mask)", type: "text", required: true },
    ],
  },
  greenweb: {
    credentials: [
      { key: "token", label: "API Token", type: "password", required: true },
    ],
  },
  twilio: {
    credentials: [
      { key: "account_sid", label: "Account SID", type: "text", required: true },
      { key: "auth_token", label: "Auth Token", type: "password", required: true },
      { key: "from_number", label: "From Phone Number", type: "text", placeholder: "+15550192834" },
    ],
  },
  smtp: {
    credentials: [
      { key: "host", label: "SMTP Host", type: "text", placeholder: "smtp.mailgun.org", required: true },
      { key: "port", label: "Port", type: "text", placeholder: "587", required: true },
      { key: "encryption", label: "Encryption (tls/ssl)", type: "text", placeholder: "tls" },
      { key: "username", label: "SMTP Username", type: "text", required: true },
      { key: "password", label: "SMTP Password", type: "password", required: true },
      { key: "from_name", label: "From Name", type: "text", placeholder: "Store Admin" },
      { key: "from_email", label: "From Email", type: "text", placeholder: "no-reply@store.com" },
    ],
  },
  whatsapp_business: {
    credentials: [
      {
        key: "phone_number_id",
        label: "Phone Number ID",
        type: "text",
        placeholder: "e.g. 109283746591024",
        required: true,
        helpText: "Numeric Phone Number ID from Meta App Dashboard > WhatsApp > API Setup.",
      },
      {
        key: "whatsapp_business_account_id",
        label: "WhatsApp Business Account ID (WABA)",
        type: "text",
        placeholder: "e.g. 992019481726354",
        required: true,
        helpText: "Found in Meta Business Manager Settings > Accounts > WhatsApp Accounts.",
      },
      {
        key: "access_token",
        label: "Permanent System User Access Token",
        type: "password",
        placeholder: "EAAG...",
        required: true,
        helpText: "Permanent System User Token with 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions.",
      },
      {
        key: "webhook_verify_token",
        label: "Webhook Verify Token (Optional)",
        type: "password",
        placeholder: "Enter custom verify token",
        helpText: "Arbitrary secret token for verifying incoming Meta webhooks.",
      },
    ],
    settings: [
      {
        key: "auto_confirm_order",
        label: "Auto-send Order Confirmation WhatsApp",
        type: "boolean",
        helpText: "Instantly sends receipt, order total, and delivery address when an order is placed.",
      },
      {
        key: "auto_dispatch_order",
        label: "Auto-send Dispatch Alert with Tracking Code",
        type: "boolean",
        helpText: "Alerts customer with courier partner name, tracking code, and COD amount when shipped.",
      },
      {
        key: "auto_deliver_order",
        label: "Auto-send Delivery & Thank You Message",
        type: "boolean",
        helpText: "Sends customer feedback & review prompt upon successful parcel handover.",
      },
      {
        key: "auto_cart_recovery",
        label: "Enable 1-Click WhatsApp Abandoned Cart Automation",
        type: "boolean",
        helpText: "Enables instant WhatsApp recovery message action buttons on leads & abandoned checkouts.",
      },
    ],
  },
};

const CATEGORY_TABS = [
  { id: "all", label: "All Integrations", icon: Puzzle },
  { id: "system", label: "System & Cache", icon: Database },
  { id: "analytics", label: "Tracking Pixels", icon: BarChart3 },
  { id: "fraud", label: "Fraud Protection", icon: ShieldCheck },
  { id: "api", label: "Headless API & CORS", icon: Lock },
  { id: "payment", label: "Payment Gateways", icon: CreditCard },
  { id: "courier", label: "Courier Logistics", icon: Truck },
  { id: "sms", label: "SMS & OTP", icon: MessageSquare },
  { id: "email", label: "SMTP Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp Bot", icon: MessageCircle },
];

export default function AdminIntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[#929BAD] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#A78BFA] animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]">
            Loading Integrations Console...
          </span>
        </div>
      }
    >
      <AdminIntegrationsContent />
    </Suspense>
  );
}

function AdminIntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [search, setSearch] = useState("");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [rotatingKey, setRotatingKey] = useState(false);

  // Sync selectedCategory whenever the URL search param changes (e.g. from sidebar clicks or history navigation)
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Configuration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<{
    is_enabled: boolean;
    is_test_mode: boolean;
    credentials: Record<string, any>;
    settings: Record<string, any>;
  }>({
    is_enabled: false,
    is_test_mode: true,
    credentials: {},
    settings: {},
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Live WhatsApp message test states
  const [testRecipientPhone, setTestRecipientPhone] = useState("");
  const [testWhatsAppLoading, setTestWhatsAppLoading] = useState(false);
  const [testWhatsAppResult, setTestWhatsAppResult] = useState<{
    success: boolean;
    message: string;
    message_id?: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getIntegrations();
      setIntegrations(res.integrations || []);
      setStats(res.stats || null);
    } catch (err) {
      toast.error("Failed to load integrations list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryChange = (tabId: string) => {
    setSelectedCategory(tabId);
    if (tabId === "all") {
      router.push("/admin/integrations");
    } else {
      router.push(`/admin/integrations?category=${tabId}`);
    }
  };

  const handleToggle = async (integration: Integration) => {
    try {
      const res = await adminApi.toggleIntegration(integration.provider);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.provider === integration.provider ? { ...item, is_enabled: res.is_enabled } : item
        )
      );
      if (integration.provider === "upstash_redis") {
        fetch("/api/admin/integrations/revalidate-redis", { method: "POST" }).catch(() => {});
      }
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleTest = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const payload =
        isModalOpen && activeIntegration?.provider === provider
          ? { credentials: formData.credentials, settings: formData.settings }
          : undefined;

      const res = await adminApi.testIntegration(provider, payload);
      if (res.success) {
        toast.success(`[${res.latency_ms}ms] ${res.message}`);
      } else {
        toast.error(res.message);
      }
      setIntegrations((prev) =>
        prev.map((item) =>
          item.provider === provider
            ? {
                ...item,
                test_status: res.test_status as any,
                test_message: res.message,
                last_tested_at: res.last_tested_at,
              }
            : item
        )
      );
      if (activeIntegration && activeIntegration.provider === provider) {
        setActiveIntegration((prev) =>
          prev
            ? {
                ...prev,
                test_status: res.test_status as any,
                test_message: res.message,
                last_tested_at: res.last_tested_at,
              }
            : null
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Connection test failed.");
    } finally {
      setTestingProvider(null);
    }
  };

  const handleRotateKey = async () => {
    if (!confirm("Are you sure you want to rotate the Headless API Key? The current key will be shifted to the secondary slot, allowing a zero-downtime transition for your clients.")) {
      return;
    }

    setRotatingKey(true);
    try {
      const res = await adminApi.rotateIntegrationKey("headless_api");
      toast.success(res.message);
      setFormData((prev) => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          primary_api_key: res.primary_api_key,
          secondary_api_key: res.secondary_api_key,
        },
      }));
      // Refresh integrations list
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to rotate API key.");
    } finally {
      setRotatingKey(false);
    }
  };

  const handleOpenConfigure = (integration: Integration) => {
    setActiveIntegration(integration);

    // Format settings if array (e.g. allowed_origins)
    const settings = { ...(integration.settings || {}) };
    if (integration.provider === "headless_api" && Array.isArray(settings.allowed_origins)) {
      settings.allowed_origins = settings.allowed_origins.join("\n");
    }

    if (integration.provider === "whatsapp_business") {
      setTestRecipientPhone("");
      setTestWhatsAppResult(null);
      if (settings.auto_confirm_order === undefined) settings.auto_confirm_order = true;
      if (settings.auto_dispatch_order === undefined) settings.auto_dispatch_order = true;
      if (settings.auto_deliver_order === undefined) settings.auto_deliver_order = true;
      if (settings.auto_cart_recovery === undefined) settings.auto_cart_recovery = true;
    }

    setFormData({
      is_enabled: integration.is_enabled,
      is_test_mode: integration.is_test_mode,
      credentials: { ...(integration.credentials || {}) },
      settings: settings,
    });
    setShowSecrets({});
    setIsModalOpen(true);
  };

  const handleSendTestWhatsApp = async () => {
    if (!testRecipientPhone.trim()) {
      toast.error("Please enter a recipient phone number (e.g. 017xxxxxxxx or 8801xxxxxxxxx)");
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppResult(null);
    try {
      const res = await adminApi.sendTestWhatsApp({
        phone: testRecipientPhone.trim(),
        message: "Hello! This is a test message from your store WhatsApp Cloud API integration.",
      });
      setTestWhatsAppResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to send live test WhatsApp message.";
      setTestWhatsAppResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegration) return;

    setSaving(true);
    try {
      // Validate provider-specific rules
      if (activeIntegration.provider === "upstash_redis") {
        const url = String(formData.credentials.url || "").trim();
        const token = String(formData.credentials.token || "").trim();
        if (formData.is_enabled) {
          if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
            toast.error("Valid Upstash REST URL starting with https:// is required to enable Redis.");
            setSaving(false);
            return;
          }
          if (!token) {
            toast.error("Upstash REST Token is required to enable Redis.");
            setSaving(false);
            return;
          }
        }
      }

      if (activeIntegration.provider === "meta_pixel") {
        const pixelId = String(formData.credentials.pixel_id || "").trim();
        if (formData.is_enabled && !/^\d{6,24}$/.test(pixelId)) {
          toast.error("Meta Pixel ID must be numeric (e.g. 1806216353748383).");
          setSaving(false);
          return;
        }
      }

      if (activeIntegration.provider === "google_tag_manager") {
        const containerId = String(formData.credentials.container_id || "").trim();
        if (formData.is_enabled && !/^GTM-[A-Z0-9]+$/i.test(containerId)) {
          toast.error("GTM Container ID format invalid (expected GTM-XXXXXX).");
          setSaving(false);
          return;
        }
      }

      const payloadSettings = { ...formData.settings };

      // Convert allowed_origins text to array for headless_api
      if (activeIntegration.provider === "headless_api" && typeof payloadSettings.allowed_origins === "string") {
        const lines = payloadSettings.allowed_origins
          .split(/[\r\n,]+/)
          .map((s: string) => s.trim())
          .filter(Boolean);

        const invalidOrigins: string[] = [];
        let hasWildcard = false;

        for (const origin of lines) {
          if (origin === "*") {
            hasWildcard = true;
          } else if (!/^https?:\/\/[a-zA-Z0-9\-\._]+(:[0-9]+)?$/.test(origin.replace(/\/$/, ""))) {
            invalidOrigins.push(origin);
          }
        }

        if (hasWildcard) {
          toast.error("Wildcard origin '*' is not allowed when credentials are supported. Please specify exact origins.");
          setSaving(false);
          return;
        }

        if (invalidOrigins.length > 0) {
          toast.error(`Invalid origin format: ${invalidOrigins[0]}. Expected format: https://example.com or http://localhost:3000`);
          setSaving(false);
          return;
        }

        payloadSettings.allowed_origins = lines;
      }

      const res = await adminApi.updateIntegration(activeIntegration.provider, {
        is_enabled: formData.is_enabled,
        is_test_mode: formData.is_test_mode,
        credentials: formData.credentials,
        settings: payloadSettings,
      });

      if (activeIntegration.provider === "upstash_redis") {
        fetch("/api/admin/integrations/revalidate-redis", { method: "POST" }).catch(() => {});
      }

      toast.success(res.message);
      setIntegrations((prev) =>
        prev.map((item) => (item.provider === activeIntegration.provider ? res.integration : item))
      );
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update integration.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Filter integrations by category and search
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.provider.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [integrations, selectedCategory, search]);

  const getProviderIcon = (provider: string, category: string) => {
    if (provider === "upstash_redis" || category === "system") return Database;
    if (provider === "google_tag_manager" || provider === "meta_pixel") return BarChart3;
    if (provider === "fraud_checker") return ShieldCheck;
    if (provider === "headless_api") return Lock;
    if (category === "payment") return CreditCard;
    if (category === "courier") return Truck;
    if (category === "sms") return MessageSquare;
    if (category === "email") return Mail;
    if (category === "whatsapp") return MessageCircle;
    return Puzzle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Integration Management"
        description="Configure dynamic storefront tracking, fraud prevention, headless APIs, and payment/logistics services."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Integrations" },
        ]}
        actions={
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#11141D] hover:bg-[#171B26] text-[#E5E7EB] border border-[#272B35] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : "text-[#929BAD]"}`} />
            <span>Sync</span>
          </button>
        }
      />

      {/* Stats Strip */}
      {stats && (
        <AdminStatStrip
          stats={[
            {
              label: "Total Services",
              value: stats.total,
              icon: Puzzle,
              variant: "cyan",
            },
            {
              label: "Active Services",
              value: stats.active,
              icon: Activity,
              variant: "emerald",
            },
            {
              label: "Healthy Handshakes",
              value: stats.connected,
              icon: Zap,
              variant: "amber",
            },
            {
              label: "Categories",
              value: stats.categories?.length || 8,
              icon: SlidersHorizontal,
              variant: "purple",
            },
          ]}
        />
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategoryChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-xs font-semibold"
                    : "bg-[#11141D] text-[#929BAD] hover:text-[#E5E7EB] hover:bg-[#171B26] border border-[#272B35]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAD]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full bg-[#11141D] border border-[#272B35] rounded-md pl-9 pr-3 py-2 text-xs text-[#E5E7EB] placeholder-[#929BAD] focus:outline-none focus:border-[#A78BFA]/60 transition-colors"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#A78BFA] animate-spin" />
          <p className="text-xs text-[#929BAD]">Loading integration credentials & status...</p>
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <AdminEmptyState
          icon={Puzzle}
          title="No integrations found"
          description="Try adjusting your category filter or search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((item) => {
            const Icon = getProviderIcon(item.provider, item.category);
            const isTesting = testingProvider === item.provider;

            return (
              <div
                key={item.id}
                className="bg-[#11141D] border border-[#272B35] hover:border-[#A78BFA]/30 rounded-md p-4.5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xl group"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#171B26] border border-[#272B35] flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-[#929BAD] uppercase tracking-wider font-semibold">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.is_enabled}
                        onChange={() => handleToggle(item)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#34D399]"></div>
                    </label>
                  </div>

                  <p className="text-xs text-[#929BAD] line-clamp-2 leading-relaxed">
                    {item.description || "No description configured."}
                  </p>
                </div>

                {/* Bottom Meta & Actions */}
                <div className="space-y-3 pt-3 border-t border-[#272B35]">
                  {/* Status Pills */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.test_status === "connected"
                            ? "bg-[#34D399] animate-pulse"
                            : item.test_status === "failed"
                            ? "bg-[#F87171]"
                            : "bg-[#626B7B]"
                        }`}
                      />
                      <span className="font-semibold text-[#E5E7EB] capitalize">
                        {item.test_status === "connected"
                          ? "Connected"
                          : item.test_status === "failed"
                          ? "Check Configuration"
                          : "Untested"}
                      </span>
                    </div>

                    {item.is_test_mode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                        Sandbox Mode
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
                        Live Mode
                      </span>
                    )}
                  </div>

                  {item.test_message && (
                    <div className="text-[10px] text-[#929BAD] font-mono truncate bg-[#090B10] px-2 py-1 rounded border border-[#272B35]" title={item.test_message}>
                      {item.test_message}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleTest(item.provider)}
                      disabled={isTesting}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#171B26] hover:bg-[#171B26]/80 text-[#E5E7EB] border border-[#272B35] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#A78BFA]" />
                      ) : (
                        <Zap className="w-3 h-3 text-[#929BAD]" />
                      )}
                      <span>{isTesting ? "Testing..." : "Verify"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenConfigure(item)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 transition-all cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-[#A78BFA]" />
                      <span>Configure</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Slide-Over Drawer */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[500px] sm:!max-w-[500px] max-w-full bg-[#11141D] border-l border-[#272B35] p-0 flex flex-col justify-between shadow-2xl text-slate-100 overflow-hidden"
        >
          {activeIntegration && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-[#272B35] bg-[#171B26] flex items-center justify-between shrink-0">
                <SheetTitle asChild>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {activeIntegration.name}
                    </h3>
                    <p className="text-[11px] text-[#929BAD] capitalize">
                      {activeIntegration.category} integration • {activeIntegration.provider}
                    </p>
                  </div>
                </SheetTitle>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-[#929BAD] hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 hover-scrollbar">
                  {/* Status & Mode Toggles */}
                  <div className="bg-[#171B26] border border-[#272B35] rounded-md p-3 space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-xs text-[#E5E7EB] font-medium">Enable Integration</span>
                      <AdminCheckbox
                        checked={formData.is_enabled}
                        onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                      />
                    </label>

                    <div className="h-px bg-[#272B35]" />

                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-xs text-[#E5E7EB] font-medium">Sandbox / Test Mode</span>
                      <AdminCheckbox
                        checked={formData.is_test_mode}
                        onChange={(e) => setFormData({ ...formData, is_test_mode: e.target.checked })}
                      />
                    </label>
                  </div>

                  {/* Provider-Specific Banner Notices */}
                  {activeIntegration.provider === "meta_pixel" && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-300 flex items-start gap-2.5 leading-relaxed">
                      <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                      <div>
                        <strong>Dynamic Storefront Injection:</strong> Meta Pixel is initialized dynamically in the storefront layout. CAPI Access Tokens are kept server-side and never exposed to the browser.
                      </div>
                    </div>
                  )}

                  {activeIntegration.provider === "google_tag_manager" && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-300 flex items-start gap-2.5 leading-relaxed">
                      <BarChart3 className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <strong>GA4 DataLayer Contract:</strong> Standard events (<code className="text-white">view_item</code>, <code className="text-white">add_to_cart</code>, <code className="text-white">begin_checkout</code>, <code className="text-white">purchase</code>) are pushed automatically to the data layer.
                      </div>
                    </div>
                  )}

                  {activeIntegration.provider === "fraud_checker" && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs text-purple-300 flex items-start gap-2.5 leading-relaxed">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                      <div>
                        <strong>Non-Blocking Fallback Policy:</strong> Provider timeouts or network failures never reject legitimate orders. The system marks unverified orders for staff review.
                      </div>
                    </div>
                  )}

                  {activeIntegration.provider === "headless_api" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-300 flex items-start gap-2.5 leading-relaxed">
                      <Lock className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div>
                        <strong>Zero-Downtime Key Rotation:</strong> Rotating your Headless API Key moves your current key to the secondary slot, allowing existing mobile or web apps to transition smoothly.
                      </div>
                    </div>
                  )}

                  {/* Credentials Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#929BAD]">
                        Credentials & Keys
                      </h4>
                      {activeIntegration.provider === "headless_api" && (
                        <button
                          type="button"
                          onClick={handleRotateKey}
                          disabled={rotatingKey}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#A78BFA] hover:text-[#B9A3FF] transition cursor-pointer disabled:opacity-50"
                        >
                          {rotatingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          <span>Rotate Key</span>
                        </button>
                      )}
                    </div>

                    {/* Pre-defined Schema Fields */}
                    {INTEGRATION_SCHEMAS[activeIntegration.provider]?.credentials?.map((field) => {
                      const isSecret = field.type === "password" || /secret|password|token|key|auth/i.test(field.key);
                      const isVisible = showSecrets[field.key] || false;
                      const val = formData.credentials[field.key] ?? "";

                      return (
                        <div key={field.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-[#E5E7EB] font-medium block">
                              {field.label} {field.required && <span className="text-rose-400">*</span>}
                            </label>
                            {val && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(val, field.label)}
                                className="text-[10px] text-[#929BAD] hover:text-[#A78BFA] flex items-center gap-1 transition"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                <span>Copy</span>
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <input
                              type={isSecret && !isVisible ? "password" : "text"}
                              value={val}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  credentials: { ...formData.credentials, [field.key]: e.target.value },
                                })
                              }
                              className={`w-full bg-[#171B26] border border-[#272B35] rounded-md px-3 py-2 text-xs text-white placeholder-[#929BAD] focus:outline-none focus:border-[#A78BFA]/60 font-mono transition-colors ${
                                isSecret ? "pr-9" : ""
                              }`}
                            />
                            {isSecret && (
                              <button
                                type="button"
                                onClick={() => setShowSecrets((prev) => ({ ...prev, [field.key]: !isVisible }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#929BAD] hover:text-white p-1 transition cursor-pointer"
                                title={isVisible ? "Hide" : "Show"}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                          {field.helpText && (
                            <p className="text-[10px] text-[#929BAD] leading-normal">{field.helpText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Settings / Configuration Parameters */}
                  {((INTEGRATION_SCHEMAS[activeIntegration.provider]?.settings && INTEGRATION_SCHEMAS[activeIntegration.provider].settings!.length > 0) ||
                    (formData.settings && Object.keys(formData.settings).length > 0)) && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#929BAD]">
                        Configuration & Options
                      </h4>

                      {/* Schema settings */}
                      {INTEGRATION_SCHEMAS[activeIntegration.provider]?.settings?.map((field) => {
                        if (field.type === "boolean") {
                          return (
                            <label key={field.key} className="flex items-center justify-between p-2.5 bg-[#171B26] rounded-md border border-[#272B35] cursor-pointer select-none">
                              <div>
                                <span className="text-xs text-[#E5E7EB] font-medium block">{field.label}</span>
                                {field.helpText && <span className="text-[10px] text-[#929BAD]">{field.helpText}</span>}
                              </div>
                              <AdminCheckbox
                                checked={Boolean(formData.settings[field.key])}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    settings: { ...formData.settings, [field.key]: e.target.checked },
                                  })
                                }
                              />
                            </label>
                          );
                        }

                        if (field.type === "textarea") {
                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs text-[#E5E7EB] font-medium block">
                                {field.label}
                              </label>
                              <textarea
                                rows={4}
                                value={formData.settings[field.key] ?? ""}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    settings: { ...formData.settings, [field.key]: e.target.value },
                                  })
                                }
                                className="w-full bg-[#171B26] border border-[#272B35] rounded-md px-3 py-2 text-xs text-white placeholder-[#929BAD] focus:outline-none focus:border-[#A78BFA]/60 font-mono transition-colors"
                              />
                              {field.helpText && (
                                <p className="text-[10px] text-[#929BAD] leading-normal">{field.helpText}</p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={field.key} className="space-y-1">
                            <label className="text-xs text-[#E5E7EB] font-medium block">
                              {field.label}
                            </label>
                            <input
                              type={field.type || "text"}
                              value={formData.settings[field.key] ?? ""}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  settings: { ...formData.settings, [field.key]: e.target.value },
                                })
                              }
                              className="w-full bg-[#171B26] border border-[#272B35] rounded-md px-3 py-2 text-xs text-white placeholder-[#929BAD] focus:outline-none focus:border-[#A78BFA]/60 transition-colors"
                            />
                            {field.helpText && (
                              <p className="text-[10px] text-[#929BAD] leading-normal">{field.helpText}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Live WhatsApp Testing Console */}
                  {activeIntegration.provider === "whatsapp_business" && (
                    <div className="p-3.5 bg-[#0D1017] rounded-lg border border-[#272B35] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          <span className="text-xs font-semibold text-[#E5E7EB]">Send Live WhatsApp Test Message</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#25D366]/10 text-[#25D366] font-medium border border-[#25D366]/20">
                          Cloud API v21.0
                        </span>
                      </div>
                      <p className="text-[11px] text-[#929BAD] leading-relaxed">
                        Test your credentials immediately. Enter your phone number below to receive a live verification message on WhatsApp.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={testRecipientPhone}
                          onChange={(e) => setTestRecipientPhone(e.target.value)}
                          placeholder="e.g. 01712345678 or 8801712345678"
                          className="flex-1 bg-[#171B26] border border-[#272B35] rounded-md px-3 py-1.5 text-xs text-white placeholder-[#929BAD] focus:outline-none focus:border-[#A78BFA]/60"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestWhatsApp}
                          disabled={testWhatsAppLoading || !testRecipientPhone.trim()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-[#090B10] transition disabled:opacity-50 cursor-pointer shadow-xs font-semibold"
                        >
                          {testWhatsAppLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#090B10]" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          <span>{testWhatsAppLoading ? "Sending..." : "Send Test"}</span>
                        </button>
                      </div>
                      {testWhatsAppResult && (
                        <div
                          className={`p-2.5 rounded text-[11px] font-mono flex items-start gap-2 ${
                            testWhatsAppResult.success
                              ? "bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366]"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}
                        >
                          {testWhatsAppResult.success ? (
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 break-words">
                            <div>{testWhatsAppResult.message}</div>
                            {testWhatsAppResult.message_id && (
                              <div className="text-[10px] opacity-75 mt-0.5">Message ID: {testWhatsAppResult.message_id}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification result note */}
                  {activeIntegration.test_message && (
                    <div className="p-3 bg-[#090B10] rounded-md border border-[#272B35] text-[11px] text-[#929BAD] font-mono break-words flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#A78BFA] mt-0.5 shrink-0" />
                      <div>{activeIntegration.test_message}</div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3.5 border-t border-[#272B35] bg-[#11141D] flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest(activeIntegration.provider)}
                    disabled={testingProvider === activeIntegration.provider}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#171B26] hover:bg-[#171B26]/80 text-[#E5E7EB] border border-[#272B35] transition cursor-pointer disabled:opacity-50"
                  >
                    {testingProvider === activeIntegration.provider ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#929BAD]" />
                    )}
                    <span>{testingProvider === activeIntegration.provider ? "Verifying..." : "Verify Connection"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-[#929BAD] hover:text-white hover:bg-white/5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#090B10]" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{saving ? "Saving..." : "Save Settings"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
