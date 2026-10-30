"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  Save,
  Globe,
  ShieldCheck,
  Share2,
  Check,
  RotateCcw,
  Loader2,
  ExternalLink,
  UploadCloud,
  ImageIcon,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
  Link as LinkIcon,
  Sparkles,
  Info
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { optimizeUploadFile } from "@/lib/imageOptimizer";
import { SeoSettings } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { SitemapManagementCard } from "@/components/admin/settings/SitemapManagementCard";
import { AdminPageHeader, AdminSaveBar } from "@/components/admin/ui";
import { toast } from "sonner";

export default function AdminSeoSettingsPage() {
  const [seo, setSeo] = useState<SeoSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    google_site_verification: "",
    bing_site_verification: "",
    og_image: "",
    canonical_base_url: "",
  });

  const [initialSeo, setInitialSeo] = useState<SeoSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    google_site_verification: "",
    bing_site_verification: "",
    og_image: "",
    canonical_base_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  // Keyword tags interactive state
  const [keywordInput, setKeywordInput] = useState("");

  // Live Preview Tabs: "google" | "twitter" | "facebook"
  const [previewPlatform, setPreviewPlatform] = useState<"google" | "twitter" | "facebook">("google");
  // Google preview device: "desktop" | "mobile"
  const [googleDevice, setGoogleDevice] = useState<"desktop" | "mobile">("desktop");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      if (res.seo_meta) {
        setSeo(res.seo_meta);
        setInitialSeo(res.seo_meta);
        setManualUrl(res.seo_meta.og_image || "");
      }
    } catch (err) {
      toast.error("Failed to load SEO configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(seo) !== JSON.stringify(initialSeo);
  }, [seo, initialSeo]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleDiscard = () => {
    if (!isDirty) return;
    setSeo(initialSeo);
    setManualUrl(initialSeo.og_image || "");
    toast.info("Unsaved SEO changes discarded.");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("seo_meta", seo);
      setInitialSeo(seo);
      toast.success("SEO and Social Meta settings successfully saved.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save SEO configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Keyword tag helpers
  const keywordTags = useMemo(() => {
    if (!seo.meta_keywords) return [];
    return seo.meta_keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }, [seo.meta_keywords]);

  const handleAddKeyword = (val: string) => {
    const trimmed = val.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;
    const current = keywordTags;
    if (current.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    const updated = [...current, trimmed].join(", ");
    setSeo((prev) => ({ ...prev, meta_keywords: updated }));
    setKeywordInput("");
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    const updated = keywordTags.filter((_, idx) => idx !== indexToRemove).join(", ");
    setSeo((prev) => ({ ...prev, meta_keywords: updated }));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddKeyword(keywordInput);
    } else if (e.key === "Backspace" && !keywordInput && keywordTags.length > 0) {
      e.preventDefault();
      handleRemoveKeyword(keywordTags.length - 1);
    }
  };

  // Image Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, or WebP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file exceeds the 20MB size limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const optimizedFile = await optimizeUploadFile(file, { profile: "banner", maxDimension: 1200, label: "OpenGraph social image" });
      const res = await adminApi.uploadProductImage(optimizedFile);
      if (res.image_url) {
        setSeo((prev) => ({ ...prev, og_image: res.image_url }));
        setManualUrl(res.image_url);
        setIsUrlInputMode(false);
        toast.success("Social OpenGraph image uploaded successfully.", {
          description: optimizedFile.reductionText ? `Optimized: ${optimizedFile.reductionText}` : undefined,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload image. You can also paste an image URL.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSeo((prev) => ({ ...prev, og_image: "" }));
    setManualUrl("");
    toast.info("OpenGraph image cleared.");
  };

  const handleApplyManualUrl = () => {
    const trimmed = manualUrl.trim();
    setSeo((prev) => ({ ...prev, og_image: trimmed }));
    setIsUrlInputMode(false);
    toast.success("Image URL applied.");
  };

  // Character calculations & health indicators
  const titleLen = (seo.meta_title || "").length;
  const descLen = (seo.meta_description || "").length;

  const titleStatus = useMemo(() => {
    if (titleLen === 0) return { label: "Empty", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    if (titleLen < 30) return { label: "Short", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (titleLen <= 60) return { label: "Optimal", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    return { label: "May truncate", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  }, [titleLen]);

  const descStatus = useMemo(() => {
    if (descLen === 0) return { label: "Empty", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    if (descLen < 80) return { label: "Short", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (descLen <= 160) return { label: "Optimal", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    return { label: "May truncate", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  }, [descLen]);

  // Derived hostname for previews
  const domainName = useMemo(() => {
    if (!seo.canonical_base_url) return "aether-audio.com";
    try {
      return new URL(seo.canonical_base_url).hostname;
    } catch {
      return seo.canonical_base_url.replace(/^https?:\/\//, "").split("/")[0] || "aether-audio.com";
    }
  }, [seo.canonical_base_url]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto text-slate-100">
      {/* Top Header */}
      <AdminPageHeader
        title="SEO & Search Engine Visibility"
        subtitle="Manage global search metadata, OpenGraph social cards, and crawler verification with live SERP simulations."
        badge={seo.og_image ? "Social Card Active" : "Setup Incomplete"}
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "SEO & Search", href: "/admin/settings/seo" },
        ]}
      />

      <SettingsNavTabs />

      {loading ? (
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-12 space-y-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A78BFA]" />
          <p className="text-xs text-slate-400">Loading search engine configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Clean Settings & Inputs (7 Columns)        */}
          {/* ======================================================== */}
          <div className="xl:col-span-7 space-y-5">
            {/* Card 1: Global Search Meta Tags */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Global Meta Tags & Titles</h3>
                    <p className="text-[11px] text-slate-400">Default fallback metadata for pages without custom SEO.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                  Storefront Fallback
                </span>
              </div>

              {/* Title Tag */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Default Title Tag</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${titleStatus.bg} ${titleStatus.color} ${titleStatus.border}`}>
                      {titleStatus.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {titleLen} / 60
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${titleLen > 60 ? "bg-rose-500" : titleLen >= 30 ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
                  />
                </div>

                <input
                  type="text"
                  value={seo.meta_title || ""}
                  onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                  placeholder="e.g. AETHER | Precision Audio, Hi-Fi Acoustics & Studio Monitors"
                  className="w-full bg-[#121624] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition"
                />
                <p className="text-[11px] text-slate-500">
                  Recommended format: <span className="text-slate-400 font-mono">Store Name | Primary Category or Value Proposition</span>
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Meta Description</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${descStatus.bg} ${descStatus.color} ${descStatus.border}`}>
                      {descStatus.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {descLen} / 160
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${descLen > 160 ? "bg-rose-500" : descLen >= 80 ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
                  />
                </div>

                <textarea
                  rows={3}
                  value={seo.meta_description || ""}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  placeholder="Brief synopsis summarizing your store catalog for search result snippets."
                  className="w-full bg-[#121624] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition resize-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-500">
                  Summarize your storefront catalog clearly. Search engines typically display up to 160 characters.
                </p>
              </div>

              {/* Meta Keywords with Interactive Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Meta Keywords</label>
                  <span className="text-[11px] text-slate-400">{keywordTags.length} tags defined</span>
                </div>

                <div className="bg-[#121624] border border-white/10 rounded-lg p-2.5 flex flex-wrap items-center gap-1.5 focus-within:border-[#A78BFA] transition min-h-[46px]">
                  {keywordTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 text-slate-200 text-xs font-medium transition"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    onBlur={() => {
                      if (keywordInput.trim()) handleAddKeyword(keywordInput);
                    }}
                    placeholder={keywordTags.length === 0 ? "Type keyword and press Enter..." : "Add keyword..."}
                    className="flex-1 min-w-[130px] bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1 py-0.5"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Press <kbd className="font-mono bg-white/5 border border-white/10 px-1 rounded text-[10px] text-slate-300">Enter</kbd> or <kbd className="font-mono bg-white/5 border border-white/10 px-1 rounded text-[10px] text-slate-300">,</kbd> to add tags.
                </p>
              </div>

              {/* Canonical URL */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-200">Canonical Base URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    value={seo.canonical_base_url || ""}
                    onChange={(e) => setSeo({ ...seo, canonical_base_url: e.target.value })}
                    placeholder="https://aether-audio.com"
                    className="w-full bg-[#121624] border border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Defines the authoritative root address for search crawlers to prevent duplicate indexation.
                </p>
              </div>
            </div>

            {/* Card 2: OpenGraph & Social Sharing Image (with Direct Upload) */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">OpenGraph & Social Share Card</h3>
                    <p className="text-[11px] text-slate-400">Shared thumbnail on Facebook, X (Twitter), LinkedIn, and chat apps.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  1200 × 630 px · 1.91:1
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Image Preview & Upload Controls */}
              {seo.og_image ? (
                <div className="space-y-3">
                  <div className="relative aspect-[1.91/1] w-full rounded-lg overflow-hidden border border-white/10 bg-[#121624] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={seo.og_image}
                      alt="Social OpenGraph preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        <span>Change Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
                      Standard Social Aspect 1.91:1
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[320px] font-mono text-[10px] text-slate-400">
                      URL: {seo.og_image}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUrlInputMode(!isUrlInputMode)}
                      className="text-[#A78BFA] hover:underline cursor-pointer font-medium"
                    >
                      {isUrlInputMode ? "Close URL input" : "Edit URL directly"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Dropzone for direct upload */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-[#A78BFA]/50 bg-[#121624]/60 hover:bg-[#121624] rounded-xl p-8 text-center transition cursor-pointer group space-y-2.5"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#A78BFA]/10 border border-white/10 group-hover:border-[#A78BFA]/30 flex items-center justify-center mx-auto transition">
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 text-[#A78BFA] animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#A78BFA] transition" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {uploadingImage ? "Uploading social image..." : "Click to upload OpenGraph image"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Recommended: 1200 × 630 px (1.91:1 ratio) · PNG, JPG, or WebP up to 5MB
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUrlInputMode(!isUrlInputMode);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A78BFA] hover:text-[#B9A3FF] hover:underline cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Or specify external image URL</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct URL input fallback */}
              {isUrlInputMode && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <label className="text-xs font-semibold text-slate-200">External Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyManualUrl}
                      className="px-3.5 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Search Engine Webmaster Verification */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Webmaster Ownership Verification</h3>
                    <p className="text-[11px] text-slate-400">Tokens prove domain ownership to Google Search Console and Bing.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Site Verification */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Google Site Verification</label>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-[#A78BFA] flex items-center gap-1 transition"
                    >
                      <span>Search Console</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={seo.google_site_verification || ""}
                    onChange={(e) => setSeo({ ...seo, google_site_verification: e.target.value })}
                    placeholder="e.g. google-site-verification=abc123xyz..."
                    className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition"
                  />
                </div>

                {/* Bing Webmaster Verification */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Bing Webmaster Token</label>
                    <a
                      href="https://www.bing.com/webmasters"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-[#A78BFA] flex items-center gap-1 transition"
                    >
                      <span>Bing Portal</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={seo.bing_site_verification || ""}
                    onChange={(e) => setSeo({ ...seo, bing_site_verification: e.target.value })}
                    placeholder="e.g. 7A8B9C0D1E2F..."
                    className="w-full bg-[#121624] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: XML Sitemap & Crawling */}
            <div id="sitemap" className="scroll-mt-6">
              <SitemapManagementCard canonicalBaseUrl={seo.canonical_base_url} />
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Realistic Live SERP Previews (5 Columns)   */}
          {/* ======================================================== */}
          <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
            {/* Live Preview Switcher Card */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live SERP & Social Preview</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Real-time
                </span>
              </div>

              {/* Platform Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#121624] p-1 rounded-lg border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("google")}
                  className={`py-1.5 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${previewPlatform === "google"
                      ? "bg-[#A78BFA] text-[#090B10] shadow-sm font-bold"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewPlatform("twitter")}
                  className={`py-1.5 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${previewPlatform === "twitter"
                      ? "bg-[#A78BFA] text-[#090B10] shadow-sm font-bold"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Twitter / X</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewPlatform("facebook")}
                  className={`py-1.5 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${previewPlatform === "facebook"
                      ? "bg-[#A78BFA] text-[#090B10] shadow-sm font-bold"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </button>
              </div>

              {/* 1. GOOGLE SEARCH PREVIEW */}
              {previewPlatform === "google" && (
                <div className="space-y-3">
                  {/* Desktop vs Mobile Toggle */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                    <span className="font-medium">Google Search Snippet</span>
                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/10">
                      <button
                        type="button"
                        onClick={() => setGoogleDevice("desktop")}
                        className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 cursor-pointer transition ${googleDevice === "desktop" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleDevice("mobile")}
                        className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 cursor-pointer transition ${googleDevice === "mobile" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Google SERP Box */}
                  <div className={`p-4 rounded-xl bg-[#202124] border border-white/10 space-y-2 transition-all ${googleDevice === "mobile" ? "max-w-[340px] mx-auto shadow-2xl" : ""
                    }`}>
                    {/* SERP Header: Favicon + Brand Title + Breadcrumbs */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#202124] font-black text-[11px] shadow-sm shrink-0">
                        A
                      </div>
                      <div className="leading-tight overflow-hidden">
                        <div className="text-[12px] font-medium text-white truncate">
                          {seo.meta_title ? seo.meta_title.split("|")[0].trim() : "AETHER Audio"}
                        </div>
                        <div className="text-[11px] text-[#bdc1c6] font-mono truncate flex items-center gap-1">
                          <span>https://{domainName}</span>
                          <span className="text-slate-500">› home</span>
                        </div>
                      </div>
                    </div>

                    {/* Google Blue Link Title */}
                    <div className="text-[#8ab4f8] hover:underline cursor-pointer font-medium text-[15px] sm:text-[16px] leading-snug line-clamp-2 pt-0.5">
                      {seo.meta_title || "AETHER | Precision Audio, Hi-Fi Acoustics & Studio Monitors"}
                    </div>

                    {/* Google Snippet Description */}
                    <div className="text-[#bdc1c6] text-[12px] sm:text-[13px] leading-relaxed line-clamp-2">
                      {seo.meta_description || "Discover studio-grade audiophile equipment, reference headphones, and handcrafted planar magnetic drivers engineered for acoustic clarity."}
                    </div>

                    {/* Authentic Google Sitelinks */}
                    {googleDevice === "desktop" && (
                      <div className="pt-2 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-[#8ab4f8] hover:underline cursor-pointer font-medium">Catalog & Products</div>
                          <div className="text-slate-400 line-clamp-1 text-[10px]">Explore reference headphones & monitors</div>
                        </div>
                        <div>
                          <div className="text-[#8ab4f8] hover:underline cursor-pointer font-medium">Acoustic Engineering</div>
                          <div className="text-slate-400 line-clamp-1 text-[10px]">Precision tuned sound engineering</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. TWITTER / X CARD PREVIEW */}
              {previewPlatform === "twitter" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                    <span className="font-medium">Twitter / X Large Summary Card</span>
                    <span className="font-mono text-[10px]">summary_large_image</span>
                  </div>

                  <div className="bg-[#000000] border border-[#2f3336] rounded-2xl overflow-hidden shadow-2xl">
                    {/* 1.91:1 Card Image */}
                    <div className="relative aspect-[1.91/1] w-full bg-[#16181c] overflow-hidden">
                      {seo.og_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={seo.og_image}
                          alt="Twitter card preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 text-center">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-xs">No OpenGraph image specified</span>
                          <span className="text-[10px] text-slate-600">Upload an image in the left panel</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold border border-white/10">
                        𝕏
                      </div>
                    </div>

                    {/* Card Meta Content */}
                    <div className="p-3.5 space-y-1 bg-[#000000]">
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {domainName}
                      </div>
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {seo.meta_title || "AETHER | Precision Audio, Hi-Fi Acoustics & Studio Monitors"}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {seo.meta_description || "Discover studio-grade audiophile equipment, reference headphones, and handcrafted planar magnetic drivers engineered for acoustic clarity."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. FACEBOOK / LINKEDIN PREVIEW */}
              {previewPlatform === "facebook" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                    <span className="font-medium">Facebook & LinkedIn Card</span>
                    <span className="font-mono text-[10px]">og:image · 1.91:1</span>
                  </div>

                  <div className="bg-[#242526] border border-[#3a3b3c] rounded-xl overflow-hidden shadow-2xl">
                    {/* Image */}
                    <div className="relative aspect-[1.91/1] w-full bg-[#18191a] overflow-hidden">
                      {seo.og_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={seo.og_image}
                          alt="Facebook card preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 text-center">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-xs">No OpenGraph image specified</span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-3 space-y-1 bg-[#242526]">
                      <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                        {domainName.toUpperCase()}
                      </div>
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {seo.meta_title || "AETHER | Precision Audio, Hi-Fi Acoustics & Studio Monitors"}
                      </div>
                      <div className="text-[11px] text-[#b0b3b8] line-clamp-2 leading-tight">
                        {seo.meta_description || "Discover studio-grade audiophile equipment, reference headphones, and handcrafted planar magnetic drivers engineered for acoustic clarity."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Scorecard Checklist */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Search Readiness Checklist
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {titleLen >= 30 && titleLen <= 60 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-slate-300">Title Tag Length</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{titleLen}/60</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {descLen >= 80 && descLen <= 160 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-slate-300">Description Length</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{descLen}/160</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {seo.og_image ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-slate-300">OpenGraph Social Banner</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {seo.og_image ? "Configured" : "Missing"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Floating Contextual Unsaved Changes Dock */}
      <AdminSaveBar
        isDirty={isDirty}
        isSaving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saveLabel="Save SEO Configuration"
        discardLabel="Discard"
        message="Unsaved SEO & Social changes"
      />
    </div>
  );
}
