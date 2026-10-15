"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Sparkles,
  Calendar,
  Smartphone,
  Monitor,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Banner } from "@/types";
import { bannerService } from "@/services/bannerService";
import { toast } from "sonner";

export interface BannerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  banner: Banner | null;
  initialPlacement?: string | null;
}

export const BANNER_PLACEMENTS = [
  {
    id: "primary_hero",
    label: "Hero Slider",
    location: "Homepage Top Carousel",
    dimensions: "1920 × 640 px",
    ratio: "3:1 Landscape",
    description: "Main flagship banner slider at the top of the homepage.",
  },
  {
    id: "top_strip",
    label: "Promo Bar",
    location: "Header Announcement Strip",
    dimensions: "1920 × 80 px",
    ratio: "24:1 Ultra-wide",
    description: "Compact notice bar above or below the main navigation.",
  },
  {
    id: "category_banner",
    label: "Category Banner",
    location: "Catalog & Collection Header",
    dimensions: "1200 × 400 px",
    ratio: "3:1 Landscape",
    description: "Banner displayed on category, brand, or collection pages.",
  },
  {
    id: "popup",
    label: "Popup Ad",
    location: "Promotional Modal Overlay",
    dimensions: "800 × 600 px",
    ratio: "4:3 Box",
    description: "Timed or exit-intent promotional lightbox overlay.",
  },
  {
    id: "secondary_hero",
    label: "Side Promo",
    location: "Beside Hero Slider",
    dimensions: "600 × 600 px",
    ratio: "1:1 Square",
    description: "Companion card beside the hero carousel.",
  },
  {
    id: "bottom_banner",
    label: "Bottom Banner",
    location: "Mid-page / Footer Campaign Strip",
    dimensions: "1200 × 400 px",
    ratio: "3:1 Landscape",
    description: "Seasonal voucher strip or bottom campaign showcase.",
  },
];

export function BannerFormDrawer({
  isOpen,
  onClose,
  onSuccess,
  banner,
  initialPlacement,
}: BannerFormDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewTab, setPreviewTab] = useState<"desktop" | "mobile">("desktop");
  const [enableMobileImage, setEnableMobileImage] = useState(false);

  // Form Fields (100% backed by Laravel database schema)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [placement, setPlacement] = useState("primary_hero");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/products");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Advanced / Optional Fields
  const [eyebrow, setEyebrow] = useState("");
  const [badge, setBadge] = useState("");
  const [discountTag, setDiscountTag] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [altText, setAltText] = useState("");

  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on banner change or drawer open
  useEffect(() => {
    if (!isOpen) return;

    if (banner) {
      setTitle(banner.title || "");
      setSubtitle(banner.subtitle || "");
      setPlacement(banner.placement || "primary_hero");
      setImageUrl(banner.image_url || "");
      setMobileImageUrl(banner.mobile_image_url || "");
      setCtaText(banner.cta_text || "Shop Now");
      setCtaLink(banner.cta_link || "/products");
      setIsActive(banner.is_active ?? true);
      setStartsAt(banner.starts_at ? banner.starts_at.slice(0, 16) : "");
      setExpiresAt(banner.expires_at ? banner.expires_at.slice(0, 16) : "");
      setEyebrow(banner.eyebrow || "");
      setBadge(banner.badge || "");
      setDiscountTag(banner.discount_tag || "");
      setSortOrder(String(banner.sort_order ?? 0));
      setAltText(banner.alt_text || "");
      setEnableMobileImage(Boolean(banner.mobile_image_url));
      setShowAdvanced(
        Boolean(banner.eyebrow || banner.badge || banner.discount_tag || (banner.sort_order && banner.sort_order > 0))
      );
    } else {
      // Reset for new creation
      setTitle("");
      setSubtitle("");
      setPlacement(initialPlacement && initialPlacement !== "all" ? initialPlacement : "primary_hero");
      setImageUrl("");
      setMobileImageUrl("");
      setCtaText("Shop Now");
      setCtaLink("/products");
      setIsActive(true);
      setStartsAt("");
      setExpiresAt("");
      setEyebrow("");
      setBadge("");
      setDiscountTag("");
      setSortOrder("0");
      setAltText("");
      setEnableMobileImage(false);
      setShowAdvanced(false);
    }
  }, [banner, isOpen, initialPlacement]);

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    if (isMobile) setUploadingMobile(true);
    else setUploadingDesktop(true);

    try {
      const res = await bannerService.uploadImage(file);
      if (isMobile) {
        setMobileImageUrl(res.image_url);
        toast.success("Mobile banner uploaded successfully.");
      } else {
        setImageUrl(res.image_url);
        toast.success("Desktop banner uploaded successfully.");
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Failed to upload image.";
      toast.error(errMsg);
    } finally {
      if (isMobile) setUploadingMobile(false);
      else setUploadingDesktop(false);
      // Reset file input
      if (e.target) e.target.value = "";
    }
  };

  const currentPlacementInfo = BANNER_PLACEMENTS.find((p) => p.id === placement) || BANNER_PLACEMENTS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Banner title is required.");
      return;
    }

    if (placement !== "top_strip" && !imageUrl.trim()) {
      toast.error("Please upload or provide a desktop image for this banner.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Banner> = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        placement,
        image_url: imageUrl.trim() || (placement === "top_strip" ? "" : ""),
        mobile_image_url: enableMobileImage && mobileImageUrl.trim() ? mobileImageUrl.trim() : null,
        cta_text: ctaText.trim() || "Shop Now",
        cta_link: ctaLink.trim() || "/products",
        destination_type: "custom",
        is_active: isActive,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        eyebrow: eyebrow.trim() || null,
        badge: badge.trim() || null,
        discount_tag: discountTag.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 0,
        alt_text: altText.trim() || title.trim(),
      };

      if (banner) {
        await bannerService.updateBanner(banner.id, payload);
        toast.success(`Banner "${title}" updated successfully.`);
      } else {
        await bannerService.createBanner(payload);
        toast.success(`Banner "${title}" created successfully.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save banner.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#0b0e17] border-l border-white/[0.08] shadow-2xl flex flex-col h-full text-slate-100 overflow-hidden animate-in slide-in-from-right duration-200">
          
          {/* Drawer Top Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#080b12] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {banner ? "Edit Banner & Ad" : "Create New Banner & Ad"}
                </h2>
                <p className="text-xs text-slate-400">
                  {banner
                    ? `Update configuration for #${banner.id} · ${banner.title}`
                    : "Add visual marketing or promotional banner to your storefront."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Form Body (Scrollable) */}
          <form
            id="banner-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* Placement & Dimension Notice Box */}
            <div className="p-3.5 rounded-md bg-[#211B32]/40 border border-[#A78BFA]/30 flex items-start gap-3">
              <Layers className="w-4 h-4 text-[#A78BFA] mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#A78BFA]">
                  {currentPlacementInfo.label} ({currentPlacementInfo.location})
                </span>
                <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Recommended size: <span className="font-mono font-bold text-white">{currentPlacementInfo.dimensions}</span> · Ratio: <span className="font-bold text-[#A78BFA]">{currentPlacementInfo.ratio}</span>. {currentPlacementInfo.description}
                </p>
              </div>
            </div>

            {/* SECTION 1: CORE DETAILS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>1. Core Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Placement / Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Banner Placement <span className="text-rose-400">*</span></span>
                  </label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 font-medium"
                  >
                    {BANNER_PLACEMENTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {p.location} ({p.dimensions})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Banner Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Banner Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Flash Sale"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Subtitle / Promotional Copy</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Up to 50% discount on all premium electronics this weekend"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>
            </div>

            {/* SECTION 2: CREATIVE ASSETS / IMAGES */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>2. Visual Creative Images</span>
                </h3>

                {/* Desktop / Mobile Preview Switcher */}
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-md border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("desktop")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      previewTab === "desktop"
                        ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("mobile")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      previewTab === "mobile"
                        ? "bg-[#A78BFA] text-[#090B10] shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Desktop Image Section */}
              {previewTab === "desktop" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Desktop Creative Image <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: {currentPlacementInfo.dimensions}
                    </span>
                  </div>

                  {/* Desktop Preview Card */}
                  <div className="relative rounded-md overflow-hidden bg-slate-900 border border-white/[0.1] aspect-[3/1] max-h-48 flex items-center justify-center group">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={altText || title || "Banner preview"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => desktopFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
                          >
                            Replace Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="p-1.5 rounded-md bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 transition cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">
                          No desktop image selected yet
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Upload a high-resolution banner ({currentPlacementInfo.dimensions})
                        </p>
                      </div>
                    )}

                    {uploadingDesktop && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 text-[#A78BFA] text-xs font-bold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading desktop banner...
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & Direct URL Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      ref={desktopFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, false)}
                    />
                    <button
                      type="button"
                      onClick={() => desktopFileInputRef.current?.click()}
                      disabled={uploadingDesktop}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{imageUrl ? "Upload Replacement" : "Upload Image File"}</span>
                    </button>

                    <input
                      type="text"
                      placeholder="Or paste direct image URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Image Section */}
              {previewTab === "mobile" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-300">
                        Dedicated Mobile Creative
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Optional specialized portrait or square banner for smartphones.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                      <input
                        type="checkbox"
                        checked={enableMobileImage}
                        onChange={(e) => setEnableMobileImage(e.target.checked)}
                        className="rounded accent-amber-400 w-4 h-4 cursor-pointer"
                      />
                      <span>Enable Mobile Variant</span>
                    </label>
                  </div>

                  {enableMobileImage ? (
                    <div className="space-y-3">
                      <div className="relative rounded-md overflow-hidden bg-slate-900 border border-white/[0.1] w-48 mx-auto aspect-[9/16] max-h-56 flex items-center justify-center group">
                        {mobileImageUrl ? (
                          <>
                            <img
                              src={mobileImageUrl}
                              alt="Mobile banner preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => mobileFileInputRef.current?.click()}
                                className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold backdrop-blur-sm transition cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => setMobileImageUrl("")}
                                className="p-1 rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 transition cursor-pointer"
                                title="Remove mobile image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 space-y-1">
                            <Smartphone className="w-6 h-6 text-slate-600 mx-auto" />
                            <p className="text-[11px] text-slate-400 font-medium">
                              No mobile image uploaded
                            </p>
                          </div>
                        )}

                        {uploadingMobile && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-1.5 text-[#A78BFA] text-[11px] font-bold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          ref={mobileFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, true)}
                        />
                        <button
                          type="button"
                          onClick={() => mobileFileInputRef.current?.click()}
                          disabled={uploadingMobile}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4 text-sky-400" />
                          <span>{mobileImageUrl ? "Replace Mobile Image" : "Upload Mobile File"}</span>
                        </button>

                        <input
                          type="text"
                          placeholder="Or paste mobile image URL..."
                          value={mobileImageUrl}
                          onChange={(e) => setMobileImageUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06] text-center text-xs text-slate-400">
                      Using desktop image automatically resized for mobile devices. Check the box above if you have a separate mobile banner ratio.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: CALL TO ACTION & TARGET LINK */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>3. Call to Action & Target Link</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Button Text */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Now"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>

                {/* Target URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Target URL Destination</span>
                    <span className="text-[10px] text-slate-500">Internal route or full link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="/products or https://..."
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Destination Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 mr-1">Quick Links:</span>
                {[
                  { label: "All Products", url: "/products" },
                  { label: "Sale / Promotions", url: "/promotions" },
                  { label: "Categories", url: "/categories" },
                  { label: "New Arrivals", url: "/products?sort=newest" },
                ].map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => setCtaLink(s.url)}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-slate-300 hover:text-[#A78BFA] transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4: SCHEDULE & STATUS */}
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>4. Visibility & Scheduling</span>
              </h3>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Banner Active Status
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isActive
                      ? "Banner is enabled and visible according to its schedule."
                      : "Banner is disabled and hidden from storefront visitors."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Start Date (Schedule)
                    </span>
                    <span className="text-[10px] text-slate-500">Optional</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      Expiry Date (Schedule)
                    </span>
                    <span className="text-[10px] text-slate-500">Optional</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Leave both start and expiry dates empty if this banner should remain visible continuously.
              </p>
            </div>

            {/* SECTION 5: ADVANCED OPTIONS (COLLAPSIBLE) */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white/[0.04] text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>5. Advanced Attributes (Display Priority, Badges, SEO)</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-3 pl-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Sort Order */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Display Priority / Order
                      </label>
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 block">Lower appears first (e.g. 0, 1, 2)</span>
                    </div>

                    {/* Badge */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Header Badge Pill
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NEW or HOT"
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                      />
                    </div>

                    {/* Discount Tag */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Discount Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 30% OFF"
                        value={discountTag}
                        onChange={(e) => setDiscountTag(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                      />
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Image Alt Text (Accessibility & SEO)</span>
                      <span className="text-[10px] text-slate-500">Defaults to title</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Descriptive text for search engines and screen readers"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Drawer Bottom Action Bar */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#080b12] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-md text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="banner-form"
              disabled={saving || uploadingDesktop || uploadingMobile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-[#A78BFA]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Banner...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {banner ? "Update Banner" : "Save & Publish Banner"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
