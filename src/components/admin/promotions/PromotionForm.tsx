"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Check,
  ArrowLeft,
  Save,
  Tag,
  Gift,
  Zap,
  Calendar,
  Layers,
  Users,
  Shield,
  Percent,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Wand2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  X,
  Layout,
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Promotion, Category, Brand, Product, User } from "@/types";
import { AdminPageHeader } from "@/components/admin/ui";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { PromotionPreview } from "./PromotionPreview";
import { toast } from "sonner";

interface PromotionFormProps {
  initialData?: Promotion;
  isEdit?: boolean;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const PromotionForm: React.FC<PromotionFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basic" | "discount" | "scoping" | "schedule" | "codes" | "storefront" | "review"
  >("basic");

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState<boolean>(
    Boolean(initialData?.slug && isEdit)
  );
  const [activeClaimDeadlinePreset, setActiveClaimDeadlinePreset] = useState<string | null>(null);
  const [activeExpiresAtPreset, setActiveExpiresAtPreset] = useState<string | null>(null);

  // Lookup data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);

  // Customer Search & Specific Customer Selection State
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<User[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomersList, setSelectedCustomersList] = useState<User[]>(
    (initialData as any)?.customer_restrictions?.map((r: any) => r.user || { id: r.user_id, name: `Customer #${r.user_id}`, email: "" }) ||
    (initialData as any)?.customerRestrictions?.map((r: any) => r.user || { id: r.user_id, name: `Customer #${r.user_id}`, email: "" }) ||
    []
  );

  // Form State
  const [formData, setFormData] = useState<Omit<Partial<Promotion>, "codes"> & {
    target_product_ids?: number[];
    target_category_ids?: number[];
    target_brand_ids?: number[];
    excluded_product_ids?: number[];
    customer_ids?: number[];
    codes?: Array<{ code: string; usage_limit?: number | null }>;
  }>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    promotion_type: initialData?.promotion_type || "discount_code",
    discount_type: initialData?.discount_type || "percentage",
    discount_value: initialData?.discount_value ?? 10,
    max_discount_amount: initialData?.max_discount_amount || null,
    customer_ids: (initialData as any)?.customer_restrictions?.map((r: any) => r.user_id) ||
      (initialData as any)?.customerRestrictions?.map((r: any) => r.user_id) ||
      [],
    bxgy_buy_quantity: initialData?.bxgy_buy_quantity || 1,
    bxgy_get_quantity: initialData?.bxgy_get_quantity || 1,
    bxgy_reward_discount_percent: initialData?.bxgy_reward_discount_percent ?? 100,
    bxgy_max_applications: initialData?.bxgy_max_applications || null,
    applies_to: initialData?.applies_to || "entire_order",
    status: initialData?.status || "active",
    min_order_amount: initialData?.min_order_amount ?? 0,
    max_order_amount: initialData?.max_order_amount || null,
    min_quantity: initialData?.min_quantity || null,
    max_quantity: initialData?.max_quantity || null,
    customer_eligibility: initialData?.customer_eligibility || "all",
    starts_at: initialData?.starts_at ? initialData.starts_at.slice(0, 16) : "",
    expires_at: initialData?.expires_at ? initialData.expires_at.slice(0, 16) : "",
    claim_deadline: initialData?.claim_deadline ? initialData.claim_deadline.slice(0, 16) : "",
    claim_validity_days: initialData?.claim_validity_days ?? null,
    total_usage_limit: initialData?.total_usage_limit || null,
    per_customer_usage_limit: initialData?.per_customer_usage_limit ?? 1,
    total_claim_limit: initialData?.total_claim_limit || null,
    is_stackable: initialData?.is_stackable ?? false,
    can_combine_with_free_shipping: initialData?.can_combine_with_free_shipping ?? true,
    can_combine_with_order_discounts: initialData?.can_combine_with_order_discounts ?? false,
    can_combine_with_product_discounts: initialData?.can_combine_with_product_discounts ?? false,
    priority: initialData?.priority ?? 10,
    banner_image: initialData?.banner_image || "",
    mobile_banner_image: (initialData as any)?.mobile_banner_image || "",
    thumbnail_image: initialData?.thumbnail_image || "",
    image_alt_text: (initialData as any)?.image_alt_text || "",
    headline: (initialData as any)?.headline || "",
    subheadline: (initialData as any)?.subheadline || "",
    badge_text: initialData?.badge_text || "",
    cta_text: initialData?.cta_text || "Shop Deals",
    cta_destination: initialData?.cta_destination || "/products",
    terms_conditions: (initialData as any)?.terms_conditions || "",
    show_on_storefront: Boolean((initialData as any)?.show_on_storefront),
    storefront_placement: (initialData as any)?.storefront_placement || "primary_hero",
    is_featured: initialData?.is_featured ?? false,
    target_product_ids: initialData?.product_targets?.filter((t) => t.target_type === "product" && !t.is_exclusion).map((t) => t.target_id) || [],
    target_category_ids: initialData?.product_targets?.filter((t) => t.target_type === "category" && !t.is_exclusion).map((t) => t.target_id) || [],
    target_brand_ids: initialData?.product_targets?.filter((t) => t.target_type === "brand" && !t.is_exclusion).map((t) => t.target_id) || [],
    excluded_product_ids: initialData?.product_targets?.filter((t) => t.is_exclusion).map((t) => t.target_id) || [],
    codes: initialData?.codes?.map((c) => ({ code: c.code, usage_limit: c.usage_limit })) || [
      { code: "", usage_limit: null },
    ],
  });

  // Batch code generator state
  const [batchCount, setBatchCount] = useState(10);
  const [batchPrefix, setBatchPrefix] = useState("PROMO-");
  const [batchUsageLimit, setBatchUsageLimit] = useState<number | null>(1);

  // Load ancillary lists
  useEffect(() => {
    async function loadLookups() {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          adminApi.getCategories().catch(() => []),
          adminApi.getBrands().catch(() => []),
          adminApi.getProducts({ per_page: 100 }).catch(() => ({ data: [] })),
        ]);
        setCategories(catRes || []);
        setBrands(brandRes || []);
        setProducts(prodRes?.data || []);
      } catch (err) {
        console.error("Error loading lookups:", err);
      }
    }
    loadLookups();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helper to handle numeric inputs cleanly: removes leading zeroes (e.g. 020 -> 20) and selects on focus
  const handleNumericFieldChange = (
    field: string,
    rawVal: string,
    options?: { isFloat?: boolean; defaultNull?: boolean }
  ) => {
    if (rawVal === "" || rawVal === undefined) {
      handleChange(field, options?.defaultNull ? null : null);
      return;
    }
    // Strip leading zeroes followed by another digit, e.g. "020" -> "20"
    const cleaned = rawVal.replace(/^0+(?=\d)/, "");
    const num = options?.isFloat ? parseFloat(cleaned) : parseInt(cleaned, 10);
    handleChange(field, isNaN(num) ? null : num);
  };

  // Auto-generate slug as user types promotion title
  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      const updates: any = { ...prev, name };
      if (!isSlugManuallyEdited) {
        updates.slug = slugify(name);
      }
      return updates;
    });
  };

  const handleSlugChange = (slug: string) => {
    setIsSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
    }));
  };

  const handleRegenerateSlug = () => {
    const freshSlug = slugify(formData.name || "");
    setIsSlugManuallyEdited(false);
    setFormData((prev) => ({
      ...prev,
      slug: freshSlug,
    }));
    toast.success(`Generated slug: ${freshSlug}`);
  };

  // Shortcut helpers for date settings with toggle / unselect behavior
  const applyClaimDeadlineOffset = (offsetHours: number | null, presetKey?: string) => {
    if (offsetHours === null || (presetKey && activeClaimDeadlinePreset === presetKey)) {
      handleChange("claim_deadline", "");
      setActiveClaimDeadlinePreset(null);
      return;
    }
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    handleChange("claim_deadline", d.toISOString().slice(0, 16));
    setActiveClaimDeadlinePreset(presetKey || null);
  };

  const applyExpiresAtOffset = (offsetDays: number | null, presetKey?: string) => {
    if (offsetDays === null || (presetKey && activeExpiresAtPreset === presetKey)) {
      handleChange("expires_at", "");
      setActiveExpiresAtPreset(null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    handleChange("expires_at", d.toISOString().slice(0, 16));
    setActiveExpiresAtPreset(presetKey || null);
  };

  const handleToggleClaimValidityDays = (days: number) => {
    if (formData.claim_validity_days === days) {
      handleChange("claim_validity_days", null);
    } else {
      handleChange("claim_validity_days", days);
    }
  };

  const handleAddCode = () => {
    setFormData((prev) => ({
      ...prev,
      codes: [...(prev.codes || []), { code: "", usage_limit: null }],
    }));
  };

  const handleRemoveCode = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      codes: (prev.codes || []).filter((_, i) => i !== index),
    }));
  };

  const handleCodeChange = (index: number, field: "code" | "usage_limit", val: any) => {
    setFormData((prev) => {
      const nextCodes = [...(prev.codes || [])];
      nextCodes[index] = { ...nextCodes[index], [field]: val };
      return { ...prev, codes: nextCodes };
    });
  };

  const handleGenerateBatchCodes = () => {
    const generated: Array<{ code: string; usage_limit: number | null }> = [];
    for (let i = 0; i < batchCount; i++) {
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      generated.push({
        code: `${batchPrefix}${randomStr}`,
        usage_limit: batchUsageLimit,
      });
    }
    setFormData((prev) => ({
      ...prev,
      codes: [...(prev.codes || []).filter((c) => c.code.trim() !== ""), ...generated],
    }));
    toast.success(`Generated ${batchCount} unique promotion codes`);
  };

  const handleSearchCustomers = async () => {
    if (!customerSearch.trim()) return;
    setCustomerSearchLoading(true);
    try {
      const res = await adminApi.getCustomers({ search: customerSearch.trim(), per_page: 20 });
      setCustomerSearchResults(res.data || []);
    } catch (err) {
      toast.error("Failed to search customers");
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleDesktopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDesktop(true);
    try {
      const res = await adminApi.uploadPromotionImage(file);
      handleChange("banner_image", res.image_url);
      toast.success("Desktop promotional image uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    try {
      const res = await adminApi.uploadPromotionImage(file);
      handleChange("mobile_banner_image", res.image_url);
      toast.success("Mobile promotional image uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload mobile image");
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Promotion name is required");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        ...formData,
        show_on_storefront: Boolean(formData.show_on_storefront),
        storefront_placement: formData.show_on_storefront ? (formData.storefront_placement || "primary_hero") : null,
        headline: formData.headline || null,
        subheadline: formData.subheadline || null,
        image_alt_text: formData.image_alt_text || null,
        mobile_banner_image: formData.mobile_banner_image || null,
        terms_conditions: formData.terms_conditions || null,
        customer_ids: formData.customer_ids || [],
        min_order_amount: Number(formData.min_order_amount) || 0,
        discount_value: Number(formData.discount_value) || 0,
        max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
        per_customer_usage_limit: Number(formData.per_customer_usage_limit) || 1,
        total_usage_limit: formData.total_usage_limit ? Number(formData.total_usage_limit) : null,
        total_claim_limit: formData.total_claim_limit ? Number(formData.total_claim_limit) : null,
        claim_validity_days: formData.claim_validity_days ? Number(formData.claim_validity_days) : null,
        bxgy_buy_quantity: formData.bxgy_buy_quantity ? Number(formData.bxgy_buy_quantity) : null,
        bxgy_get_quantity: formData.bxgy_get_quantity ? Number(formData.bxgy_get_quantity) : null,
        bxgy_reward_discount_percent: formData.bxgy_reward_discount_percent ? Number(formData.bxgy_reward_discount_percent) : null,
        bxgy_max_applications: formData.bxgy_max_applications ? Number(formData.bxgy_max_applications) : null,
        codes: (formData.codes || [])
          .filter((c) => c.code && c.code.trim() !== "")
          .map((c) => ({
            code: c.code.trim().toUpperCase(),
            usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
          })),
      };

      if (isEdit && initialData) {
        await adminApi.updatePromotion(initialData.id, payload);
        toast.success("Promotion updated successfully");
      } else {
        await adminApi.createPromotion(payload);
        toast.success("Promotion created successfully");
      }
      router.push("/admin/promotions");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save promotion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title={isEdit ? `Edit: ${initialData?.name}` : "Create New Promotion"}
        description="Configure discount rules, product scoping, customer eligibility, claim validity, and automated triggers."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isEdit ? "Update Promotion" : "Publish Promotion"}
            </button>
          </div>
        }
      />

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Container (Col 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 7-Step Navigation Bar */}
          <div className="flex items-center gap-1.5 border-b border-white/10 overflow-x-auto no-scrollbar pb-2 text-xs">
            {[
              { key: "basic", label: "1. Basic Info", icon: Sparkles },
              { key: "discount", label: "2. Discount Rules", icon: Percent },
              { key: "scoping", label: "3. Scope & Audience", icon: Layers },
              { key: "schedule", label: "4. Schedule & Limits", icon: Clock },
              { key: "codes", label: "5. Promo Codes", icon: Tag },
              { key: "storefront", label: "6. Storefront", icon: Layout },
              { key: "review", label: "7. Review & Publish", icon: CheckCircle2 },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Basic Info */}
            {activeTab === "basic" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                      Step 1: Basic Promotion Details
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Set the core identity, public name, URL slug, and evaluation priority for this promotion.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 1 of 7
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Promotion Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eid Mega Sale, Cyber Monday 20% OFF"
                      value={formData.name || ""}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
                    />
                  </div>

                  {/* Auto-Generated Slug */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        URL Slug / Key
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateSlug}
                        className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                        title="Re-generate slug from title"
                      >
                        <Wand2 className="w-3 h-3" />
                        Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. eid-mega-sale"
                      value={formData.slug || ""}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500 font-mono">
                      URL safe identifier for campaign landing page.
                    </p>
                  </div>

                  {/* Promotion Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Promotion Type</label>
                    <select
                      value={formData.promotion_type || "discount_code"}
                      onChange={(e) => handleChange("promotion_type", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-semibold"
                    >
                      <option value="discount_code">Discount Code (Customer enters coupon code)</option>
                      <option value="claimable_coupon">Claimable Coupon (Customer claims voucher to wallet)</option>
                      <option value="automatic_discount">Automatic Discount (Applies automatically in cart)</option>
                      <option value="customer_reward">Customer Reward (Direct customer privilege)</option>
                      <option value="next_order_discount">Next Order Discount (Granted upon order completion)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Customer Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Get 20% discount on all mechanical keyboards on orders above ৳1,500."
                      value={formData.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Evaluation Priority</label>
                    <input
                      type="number"
                      placeholder="Higher = evaluated earlier (e.g. 10)"
                      value={formData.priority ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleNumericFieldChange("priority", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      When multiple promotions are eligible, higher priority promotions evaluate first.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                      <AdminCheckbox
                        checked={Boolean(formData.is_featured)}
                        onChange={(e) => handleChange("is_featured", e.target.checked)}
                      />
                      Feature this promotion prominently across deals & campaign lists
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("discount")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Discount Rules
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Discount Rules */}
            {activeTab === "discount" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#A78BFA]" />
                      Step 2: Discount Calculation Rules
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Define the exact formula, discount amount, maximum cap, and any special Buy X Get Y logic.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 2 of 7
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discount Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Discount Formula</label>
                    <select
                      value={formData.discount_type || "percentage"}
                      onChange={(e) => handleChange("discount_type", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-semibold"
                    >
                      <option value="percentage">Percentage Discount (% OFF)</option>
                      <option value="fixed_amount">Fixed Amount Discount (৳ OFF Order)</option>
                      <option value="free_shipping">Free Shipping</option>
                      <option value="buy_x_get_y">Buy X Get Y (BXGY)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  {formData.discount_type !== "free_shipping" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {formData.discount_type === "percentage" ? "Discount Percentage (%)" : "Fixed Discount Amount (৳)"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        placeholder="0"
                        value={formData.discount_value ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("discount_value", e.target.value, { isFloat: true })}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono font-bold"
                      />
                    </div>
                  )}

                  {/* Max Discount Cap (for percentage) */}
                  {formData.discount_type === "percentage" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          Maximum Discount Cap (৳) <span className="text-slate-500 font-normal">(Optional)</span>
                        </label>
                        {formData.max_discount_amount != null && (
                          <button
                            type="button"
                            onClick={() => handleChange("max_discount_amount", null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Leave blank for uncapped"
                        value={formData.max_discount_amount ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("max_discount_amount", e.target.value, { isFloat: true, defaultNull: true })}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                      />
                    </div>
                  )}

                  {/* BXGY Specific Options */}
                  {formData.discount_type === "buy_x_get_y" && (
                    <div className="md:col-span-2 p-4 rounded-md bg-purple-500/5 border border-purple-500/20 space-y-3">
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        Buy X Get Y (BXGY) Parameters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Buy Quantity (X)</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="1"
                            value={formData.bxgy_buy_quantity ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleNumericFieldChange("bxgy_buy_quantity", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Get Quantity (Y)</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="1"
                            value={formData.bxgy_get_quantity ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleNumericFieldChange("bxgy_get_quantity", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Reward Discount %</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            placeholder="100 for 100% Free"
                            value={formData.bxgy_reward_discount_percent ?? ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleNumericFieldChange("bxgy_reward_discount_percent", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scoping")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Scope & Audience
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Schedule & Limits */}
            {activeTab === "schedule" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Step 4: Time Windows, Safeguards & Limits
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure authoritative campaign start/expiry dates, claim deadlines, wallet validity, usage limits, and stacking rules.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 4 of 7
                  </span>
                </div>

                {/* Timing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Starts At */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Campaign Starts At</label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at || ""}
                      onChange={(e) => handleChange("starts_at", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500">
                      Leave empty to activate immediately upon publishing.
                    </p>
                  </div>

                  {/* Expires At */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Campaign Expires At (Hard Cutoff)</label>
                      {formData.expires_at && (
                        <button
                          type="button"
                          onClick={() => applyExpiresAtOffset(null)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={formData.expires_at || ""}
                      onChange={(e) => {
                        handleChange("expires_at", e.target.value);
                        setActiveExpiresAtPreset(null);
                      }}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { label: "+7 Days", days: 7 },
                        { label: "+14 Days", days: 14 },
                        { label: "+30 Days", days: 30 },
                        { label: "+90 Days", days: 90 },
                      ].map((p) => {
                        const isSelected = activeExpiresAtPreset === p.label;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyExpiresAtOffset(p.days, p.label)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/25 text-emerald-300 border-emerald-400/50 font-bold ring-1 ring-emerald-400/30"
                                : "bg-[#12151f] hover:bg-white/10 text-slate-300 border-white/10"
                            }`}
                            title={isSelected ? "Click to unselect and clear" : `Set ${p.label}`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Claim Deadline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Claim Window Deadline (Storefront Cutoff)</label>
                      {formData.claim_deadline && (
                        <button
                          type="button"
                          onClick={() => applyClaimDeadlineOffset(null)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={formData.claim_deadline || ""}
                      onChange={(e) => {
                        handleChange("claim_deadline", e.target.value);
                        setActiveClaimDeadlinePreset(null);
                      }}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { label: "+24h", hours: 24 },
                        { label: "+3d", hours: 72 },
                        { label: "+7d", hours: 168 },
                        { label: "+14d", hours: 336 },
                      ].map((p) => {
                        const isSelected = activeClaimDeadlinePreset === p.label;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyClaimDeadlineOffset(p.hours, p.label)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/50 font-bold ring-1 ring-[#A78BFA]/30"
                                : "bg-[#12151f] hover:bg-white/10 text-slate-300 border-white/10"
                            }`}
                            title={isSelected ? "Click to unselect and clear" : `Set ${p.label}`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Claim Validity Days */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Valid After Claim (Days)</label>
                      {formData.claim_validity_days != null && (
                        <button
                          type="button"
                          onClick={() => handleChange("claim_validity_days", null)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 7"
                      value={formData.claim_validity_days || ""}
                      onChange={(e) =>
                        handleChange(
                          "claim_validity_days",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[3, 7, 14, 30].map((days) => {
                        const isSelected = formData.claim_validity_days === days;
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => handleToggleClaimValidityDays(days)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-purple-500/30 text-purple-200 border-purple-400/60 font-bold ring-1 ring-purple-400/40"
                                : "bg-[#12151f] hover:bg-white/10 text-slate-300 border-white/10"
                            }`}
                            title={isSelected ? "Click to unselect and clear" : `Set ${days} days`}
                          >
                            {days}d
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Safeguards & Order Limits */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Order Spend & Usage Limits
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Minimum Order Subtotal (৳)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={formData.min_order_amount ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("min_order_amount", e.target.value, { isFloat: true })}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Max Order Subtotal Limit (৳)</label>
                        {formData.max_order_amount != null && (
                          <button
                            type="button"
                            onClick={() => handleChange("max_order_amount", null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min={0}
                        placeholder="Unlimited"
                        value={formData.max_order_amount ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("max_order_amount", e.target.value, { isFloat: true, defaultNull: true })}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Total Campaign Usage Limit</label>
                        {formData.total_usage_limit != null && (
                          <button
                            type="button"
                            onClick={() => handleChange("total_usage_limit", null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={formData.total_usage_limit ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("total_usage_limit", e.target.value, { defaultNull: true })}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                      />
                      <p className="text-[10px] text-slate-500">
                        Total redemptions across all customers before promotion locks.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Per-Customer Usage Limit</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={formData.per_customer_usage_limit ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleNumericFieldChange("per_customer_usage_limit", e.target.value)}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                      />
                      <p className="text-[10px] text-slate-500">
                        Times an individual customer (or guest email/phone) can use this.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stacking Rules */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Stacking & Combination Rules
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <AdminCheckbox
                        checked={Boolean(formData.is_stackable)}
                        onChange={(e) => handleChange("is_stackable", e.target.checked)}
                      />
                      Allow this promotion to be stacked with other eligible discounts
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <AdminCheckbox
                        checked={Boolean(formData.can_combine_with_free_shipping)}
                        onChange={(e) => handleChange("can_combine_with_free_shipping", e.target.checked)}
                      />
                      Can combine with Free Shipping promotions
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("scoping")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("codes")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Promo Codes
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Scope & Audience */}
            {activeTab === "scoping" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#A78BFA]" />
                      Step 3: Target Scoping & Customer Audience
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose which products, categories, or brands qualify, and specify which customers are eligible.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 3 of 7
                  </span>
                </div>

                {/* Section A: Product Catalog Scope */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    A. Catalog Scope
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Applies To Scope</label>
                    <select
                      value={formData.applies_to || "entire_order"}
                      onChange={(e) => handleChange("applies_to", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                    >
                      <option value="entire_order">Entire Order (All eligible catalog)</option>
                      <option value="specific_categories">Specific Categories</option>
                      <option value="specific_products">Specific Products</option>
                      <option value="specific_brands">Specific Brands</option>
                    </select>
                  </div>

                  {formData.applies_to === "specific_categories" && (
                    <div className="p-4 rounded-md bg-[#12151f] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#A78BFA]">
                          Target Categories ({formData.target_category_ids?.length || 0} selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange("target_category_ids", categories.map((c) => c.id))}
                            className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          {(formData.target_category_ids?.length || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => handleChange("target_category_ids", [])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                        {categories.map((cat) => {
                          const isSelected = formData.target_category_ids?.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                const current = formData.target_category_ids || [];
                                handleChange(
                                  "target_category_ids",
                                  isSelected ? current.filter((id) => id !== cat.id) : [...current, cat.id]
                                );
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/40 shadow-sm"
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                              }`}
                            >
                              <span className="truncate">{cat.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.applies_to === "specific_products" && (
                    <div className="p-4 rounded-md bg-[#12151f] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#A78BFA]">
                          Target Products ({formData.target_product_ids?.length || 0} selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange("target_product_ids", products.map((p) => p.id))}
                            className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          {(formData.target_product_ids?.length || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => handleChange("target_product_ids", [])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto no-scrollbar">
                        {products.map((prod) => {
                          const isSelected = formData.target_product_ids?.includes(prod.id);
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                const current = formData.target_product_ids || [];
                                handleChange(
                                  "target_product_ids",
                                  isSelected ? current.filter((id) => id !== prod.id) : [...current, prod.id]
                                );
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/40 shadow-sm"
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                              }`}
                            >
                              <span className="truncate">{prod.name} (৳{prod.price})</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.applies_to === "specific_brands" && (
                    <div className="p-4 rounded-md bg-[#12151f] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#A78BFA]">
                          Target Brands ({formData.target_brand_ids?.length || 0} selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange("target_brand_ids", brands.map((b) => b.id))}
                            className="text-[10px] text-[#A78BFA] hover:text-[#B9A3FF] font-semibold cursor-pointer"
                          >
                            Select All
                          </button>
                          {(formData.target_brand_ids?.length || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => handleChange("target_brand_ids", [])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                        {brands.map((brand) => {
                          const isSelected = formData.target_brand_ids?.includes(brand.id);
                          return (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => {
                                const current = formData.target_brand_ids || [];
                                handleChange(
                                  "target_brand_ids",
                                  isSelected ? current.filter((id) => id !== brand.id) : [...current, brand.id]
                                );
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/40 shadow-sm"
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                              }`}
                            >
                              <span className="truncate">{brand.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section B: Customer Audience Eligibility */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      B. Customer Audience Eligibility
                    </label>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Access Control
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: "all", label: "All Customers", desc: "Open to all shoppers & guests" },
                      { key: "first_order_only", label: "First Order Only", desc: "Strictly new customers" },
                      { key: "existing_customers", label: "Returning Customers", desc: "Prior orders required" },
                      { key: "specific_customers", label: "Specific Customers", desc: "Designated accounts only" },
                    ].map((opt) => {
                      const isSelected = (formData.customer_eligibility || "all") === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleChange("customer_eligibility", opt.key)}
                          className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-500/20 border-blue-500/50 text-white ring-1 ring-blue-400/30"
                              : "bg-[#12151f] hover:bg-white/5 border-white/10 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${isSelected ? "text-blue-300" : "text-white"}`}>
                              {opt.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Customer Multi-Selector when specific_customers is chosen */}
                  {formData.customer_eligibility === "specific_customers" && (
                    <div className="p-3.5 rounded-md bg-[#12151f] border border-blue-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-blue-300">
                          Designated Customers ({formData.customer_ids?.length || 0} selected)
                        </label>
                        {(formData.customer_ids?.length || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleChange("customer_ids", []);
                              setSelectedCustomersList([]);
                            }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                          >
                            Clear Selected Customers
                          </button>
                        )}
                      </div>

                      {/* Search Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchCustomers();
                            }
                          }}
                          placeholder="Search by name, email, or phone number..."
                          className="flex-1 px-3 py-1.5 rounded-md bg-[#0c0e14] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-blue-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSearchCustomers}
                          disabled={customerSearchLoading || !customerSearch.trim()}
                          className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {customerSearchLoading ? "Searching..." : "Search"}
                        </button>
                      </div>

                      {/* Search Results */}
                      {customerSearchResults.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border border-white/10 rounded-md divide-y divide-white/5 bg-[#0c0e14]">
                          {customerSearchResults.map((cust) => {
                            const isSelected = formData.customer_ids?.includes(cust.id);
                            return (
                              <div key={cust.id} className="flex items-center justify-between p-2 text-xs">
                                <div>
                                  <span className="font-bold text-white block">{cust.name}</span>
                                  <span className="text-[10px] text-slate-400">{cust.email} {cust.phone ? `• ${cust.phone}` : ""}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = formData.customer_ids || [];
                                    if (isSelected) {
                                      handleChange("customer_ids", current.filter((id) => id !== cust.id));
                                      setSelectedCustomersList((prev) => prev.filter((c) => c.id !== cust.id));
                                    } else {
                                      handleChange("customer_ids", [...current, cust.id]);
                                      if (!selectedCustomersList.some((c) => c.id === cust.id)) {
                                        setSelectedCustomersList((prev) => [...prev, cust]);
                                      }
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                                  }`}
                                >
                                  {isSelected ? "Remove" : "+ Add Customer"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected Customer Badges */}
                      {selectedCustomersList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedCustomersList.map((cust) => (
                            <span
                              key={cust.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200"
                            >
                              <span>{cust.name} ({cust.email})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleChange("customer_ids", (formData.customer_ids || []).filter((id) => id !== cust.id));
                                  setSelectedCustomersList((prev) => prev.filter((c) => c.id !== cust.id));
                                }}
                                className="hover:text-rose-400 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("discount")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("schedule")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Schedule & Limits
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Promo Codes */}
            {activeTab === "codes" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#A78BFA]" />
                      Step 5: Promo Code Management
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Add specific coupon codes customers type at checkout, or batch-generate unique single-use codes.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 5 of 7
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Active Promo Codes ({formData.codes?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] text-xs font-bold border border-[#A78BFA]/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Code
                  </button>
                </div>

                {/* Codes List */}
                <div className="space-y-3">
                  {(formData.codes || []).map((codeItem, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="e.g. SUMMER20"
                        value={codeItem.code}
                        onChange={(e) => handleCodeChange(index, "code", e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono uppercase font-bold focus:border-[#A78BFA]/50 outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Limit (Optional)"
                        value={codeItem.usage_limit || ""}
                        onChange={(e) => handleCodeChange(index, "usage_limit", e.target.value ? Number(e.target.value) : null)}
                        className="w-32 px-3 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                      />
                      {(formData.codes || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCode(index)}
                          className="p-2 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Batch Code Generator Box */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Batch Code Generator
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Prefix</label>
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={batchCount}
                        onChange={(e) => setBatchCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Usage Limit</label>
                      <input
                        type="number"
                        min={1}
                        value={batchUsageLimit ?? 1}
                        onChange={(e) => setBatchUsageLimit(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-1.5 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateBatchCodes}
                      className="px-4 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Generate Codes
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("schedule")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("storefront")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Storefront Presentation
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Storefront Presentation */}
            {activeTab === "storefront" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#A78BFA]" />
                      Step 6: Storefront Presentation & Banners
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Control homepage visibility, promotional banner artwork, headlines, CTA buttons, and campaign terms.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 whitespace-nowrap">
                    Step 6 of 7
                  </span>
                </div>

                {/* Master Storefront Toggle */}
                <div className="p-4 rounded-md border border-[#A78BFA]/30 bg-[#A78BFA]/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[#A78BFA]" />
                        Display on Customer Storefront
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When enabled, this promotion publishes to homepage banners, voucher strips, or promotional slots.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.show_on_storefront)}
                        onChange={(e) => handleChange("show_on_storefront", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A78BFA]"></div>
                    </label>
                  </div>
                </div>

                {formData.show_on_storefront ? (
                  <div className="space-y-5">
                    {/* Placement Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Storefront Placement Slot <span className="text-rose-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { key: "primary_hero", label: "Primary Hero Banner", desc: "Main carousel at top of homepage (1920x600px)" },
                          { key: "top_strip", label: "Top Announcement Strip", desc: "Sliding promo bar below navbar (1200x300px)" },
                          { key: "voucher_carousel", label: "Voucher Strip / Carousel", desc: "Interactive voucher cards showcase" },
                          { key: "flash_sale", label: "Flash Sale Banner", desc: "Countdown deals section banner (1400x400px)" },
                          { key: "product_grid", label: "Product Grid Banner", desc: "Banner within product listings" },
                        ].map((p) => {
                          const isSelected = (formData.storefront_placement || "primary_hero") === p.key;
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => handleChange("storefront_placement", p.key)}
                              className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#211B32] border-[#A78BFA]/50 text-white ring-1 ring-[#A78BFA]/30"
                                  : "bg-[#12151f] hover:bg-white/5 border-white/10 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${isSelected ? "text-[#A78BFA]" : "text-white"}`}>
                                  {p.label}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#A78BFA]" />}
                              </div>
                              <span className="text-[10px] text-slate-400 block leading-tight">{p.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image Upload Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Desktop Banner Image */}
                      <div className="space-y-2 p-4 rounded-md bg-[#12151f] border border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
                            Desktop Banner Artwork
                          </label>
                          {formData.banner_image && (
                            <button
                              type="button"
                              onClick={() => handleChange("banner_image", "")}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {formData.banner_image ? (
                          <div className="relative rounded-md overflow-hidden border border-white/10 aspect-video bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.banner_image}
                              alt={formData.image_alt_text || "Banner preview"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs text-slate-300 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span>{uploadingDesktop ? "Uploading..." : "Upload Desktop Image"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingDesktop}
                              onChange={handleDesktopImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Or paste image URL (e.g. /banners/hero.jpg)"
                          value={formData.banner_image || ""}
                          onChange={(e) => handleChange("banner_image", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md bg-[#0c0e14] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none font-mono"
                        />
                      </div>

                      {/* Mobile Banner Image */}
                      <div className="space-y-2 p-4 rounded-md bg-[#12151f] border border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                            Mobile Banner Artwork (Optional)
                          </label>
                          {formData.mobile_banner_image && (
                            <button
                              type="button"
                              onClick={() => handleChange("mobile_banner_image", "")}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {formData.mobile_banner_image ? (
                          <div className="relative rounded-md overflow-hidden border border-white/10 aspect-video bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.mobile_banner_image}
                              alt={formData.image_alt_text || "Mobile banner preview"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs text-slate-300 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{uploadingMobile ? "Uploading..." : "Upload Mobile Image"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingMobile}
                              onChange={handleMobileImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Or paste mobile image URL"
                          value={formData.mobile_banner_image || ""}
                          onChange={(e) => handleChange("mobile_banner_image", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md bg-[#0c0e14] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Image Alt Text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Image Alt Text (SEO & Accessibility)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Eid Mega Sale with 20% discount on mechanical keyboards"
                        value={formData.image_alt_text || ""}
                        onChange={(e) => handleChange("image_alt_text", e.target.value)}
                        className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
                      />
                    </div>

                    {/* Banner Copy Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Banner Headline
                        </label>
                        <input
                          type="text"
                          placeholder="Defaults to promotion name if blank"
                          value={formData.headline || ""}
                          onChange={(e) => handleChange("headline", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Banner Subheadline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Up to 20% OFF top gaming & mechanical keyboards"
                          value={formData.subheadline || ""}
                          onChange={(e) => handleChange("subheadline", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Callout Badge Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HOT DEAL, 20% OFF, LIMITED TIME"
                          value={formData.badge_text || ""}
                          onChange={(e) => handleChange("badge_text", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          placeholder="Shop Deals"
                          value={formData.cta_text || ""}
                          onChange={(e) => handleChange("cta_text", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-300">
                          CTA Destination URL
                        </label>
                        <input
                          type="text"
                          placeholder="/products or /promotions/eid-mega-sale"
                          value={formData.cta_destination || ""}
                          onChange={(e) => handleChange("cta_destination", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Terms & Conditions
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Valid only on mechanical keyboards. Cannot be combined with other coupons. Limit one per customer."
                          value={formData.terms_conditions || ""}
                          onChange={(e) => handleChange("terms_conditions", e.target.value)}
                          className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-md border border-white/10 bg-[#12151f] text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-slate-300">Storefront display is disabled for this promotion.</p>
                    <p>
                      This promotion functions strictly as a coupon code or targeted reward. It will not occupy any homepage banner slots or carousel slides.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("codes")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] transition-all cursor-pointer"
                  >
                    Next: Review & Publish
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: Review & Publish */}
            {activeTab === "review" && (
              <div className="p-6 rounded-md border border-white/[0.08] bg-[#0c0e14] space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Step 7: Final Review & Publishing
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Verify all promotion settings before publishing live to customers and storefront.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    Step 7 of 7
                  </span>
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-md border border-white/10 bg-[#12151f] space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{formData.name || "Untitled Promotion"}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Slug: {formData.slug || "auto-generated"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30">
                      {formData.promotion_type?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Discount Rule</span>
                      <span className="font-bold text-white">
                        {formData.discount_type === "percentage"
                          ? `${formData.discount_value}% OFF`
                          : formData.discount_type === "fixed_amount"
                          ? `৳${formData.discount_value} OFF`
                          : formData.discount_type === "free_shipping"
                          ? "Free Shipping"
                          : "Buy X Get Y"}
                      </span>
                      {formData.max_discount_amount && (
                        <span className="text-[10px] text-slate-400 block">Cap: ৳{formData.max_discount_amount}</span>
                      )}
                    </div>

                    <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Catalog Scope</span>
                      <span className="font-bold text-white capitalize">
                        {formData.applies_to?.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Audience: {formData.customer_eligibility?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Schedule</span>
                      <span className="font-bold text-emerald-300">
                        {formData.expires_at ? `Until ${new Date(formData.expires_at).toLocaleDateString()}` : "No expiry"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formData.claim_deadline ? `Claim by ${new Date(formData.claim_deadline).toLocaleDateString()}` : "No claim cutoff"}
                      </span>
                    </div>

                    <div className="p-3 rounded-md bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Storefront Status</span>
                      <span className={`font-bold ${formData.show_on_storefront ? "text-[#A78BFA]" : "text-slate-400"}`}>
                        {formData.show_on_storefront ? `Visible: ${formData.storefront_placement?.replace(/_/g, " ")}` : "Hidden (Back-office)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Priority: {formData.priority ?? 10}
                      </span>
                    </div>
                  </div>

                  {/* Promo Codes Snapshot */}
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-400 font-semibold">Promo Codes:</span>
                    {(formData.codes || []).filter((c) => c.code.trim()).length > 0 ? (
                      (formData.codes || [])
                        .filter((c) => c.code.trim())
                        .map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[#A78BFA] font-bold"
                          >
                            {c.code} {c.usage_limit ? `(${c.usage_limit} uses)` : ""}
                          </span>
                        ))
                    ) : (
                      <span className="text-slate-500 italic">No code required (Automatic / Claimable)</span>
                    )}
                  </div>
                </div>

                {/* Status Selector Before Publish */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Set Promotion Status</label>
                  <select
                    value={formData.status || "active"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none font-semibold"
                  >
                    <option value="active">Active (Live Immediately)</option>
                    <option value="scheduled">Scheduled (Activates on Starts At date)</option>
                    <option value="paused">Paused (Inactive)</option>
                    <option value="draft">Draft (Unpublished)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("storefront")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Storefront Presentation
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : isEdit ? "Update Promotion" : "Publish Promotion Live"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Sidebar (Col 1) */}
        <div className="lg:col-span-1">
          <PromotionPreview form={formData} />
        </div>
      </div>
    </div>
  );
};
