"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Code
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { SeoSettings } from "@/types";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminPageHeader, AdminSaveBar } from "@/components/admin/ui";
import { ImageUploadGuidance } from "@/components/admin/ui/ImageUploadGuidance";
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

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExtendedSettings();
      if (res.seo_meta) {
        setSeo(res.seo_meta);
        setInitialSeo(res.seo_meta);
      }
    } catch (err) {
      toast.error("Failed to load SEO settings.");
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
    toast.info("Unsaved SEO changes discarded.");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await adminApi.updateSettingsGroup("seo_meta", seo);
      setInitialSeo(seo);
      toast.success("SEO and Webmaster settings successfully saved.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save SEO configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Settings & System Studio"
        subtitle="Manage global search engine metadata, OpenGraph social cards, and Google/Bing search verification tokens."
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "SEO & Search", href: "/admin/settings/seo" },
        ]}
      />

      <SettingsNavTabs />

      {loading ? (
        <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-[#161a26] rounded-md" />
          <div className="h-32 bg-[#161a26] rounded-md" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Input Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meta Tags Card */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#A78BFA]" />
                  Global Meta Tags & Titles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Applied as default fallback across all storefront pages without custom page-specific metadata.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Default Title Tag</label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(seo.meta_title || "").length} / 60 chars recommended
                  </span>
                </div>
                <input
                  type="text"
                  value={seo.meta_title || ""}
                  onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                  placeholder="e.g. AETHER | Precision Audio, Hi-Fi Acoustics & Studio Monitors"
                  className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Meta Description</label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(seo.meta_description || "").length} / 160 chars recommended
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seo.meta_description || ""}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  placeholder="Brief synopsis summarizing your store catalog for search result snippets."
                  className="w-full bg-[#161a26] border border-white/10 rounded-md p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={seo.meta_keywords || ""}
                  onChange={(e) => setSeo({ ...seo, meta_keywords: e.target.value })}
                  placeholder="audiophile, planar magnetic, headphones, DAC, hi-fi"
                  className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Canonical Base URL</label>
                  <input
                    type="url"
                    value={seo.canonical_base_url || ""}
                    onChange={(e) => setSeo({ ...seo, canonical_base_url: e.target.value })}
                    placeholder="https://aether-audio.com"
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">OpenGraph Default Image URL</label>
                    <ImageUploadGuidance slotKey="admin_seo_og" imageUrl={seo.og_image} layout="inline" />
                  </div>
                  <input
                    type="url"
                    value={seo.og_image || ""}
                    onChange={(e) => setSeo({ ...seo, og_image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Webmaster Search Verification */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Search Console & Webmaster Ownership Verification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Insert ownership verification tokens to automatically verify with search crawler portals.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Google Site Verification Token</label>
                <div className="relative">
                  <input
                    type="text"
                    value={seo.google_site_verification || ""}
                    onChange={(e) => setSeo({ ...seo, google_site_verification: e.target.value })}
                    placeholder="google-site-verification=..."
                    className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Bing Webmaster Authentication Tag</label>
                <input
                  type="text"
                  value={seo.bing_site_verification || ""}
                  onChange={(e) => setSeo({ ...seo, bing_site_verification: e.target.value })}
                  placeholder="bing-site-auth-..."
                  className="w-full bg-[#161a26] border border-white/10 rounded-md px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Previews */}
          <div className="space-y-6">
            {/* Google Snippet Simulator */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
                  Google Search Snippet Preview
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">SERP Simulator</span>
              </div>

              <div className="p-4 bg-[#161a26] rounded-md border border-white/5 space-y-1.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono truncate">
                  <span>{seo.canonical_base_url || "https://aether-audio.com"}</span>
                </div>
                <div className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer line-clamp-1">
                  {seo.meta_title || "AETHER Storefront"}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {seo.meta_description || "Precision engineered high fidelity sound equipment."}
                </div>
              </div>
            </div>

            {/* Social Share Card Preview */}
            <div className="bg-[#0f121b] border border-white/[0.08] rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  Social Card Preview (Facebook / X)
                </span>
              </div>

              <div className="bg-[#161a26] rounded-md border border-white/5 overflow-hidden">
                {seo.og_image ? (
                  <div 
                    className="h-32 bg-cover bg-center"
                    style={{ backgroundImage: `url(${seo.og_image})` }}
                  />
                ) : (
                  <div className="h-32 bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                    No OG Image URL Provided
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    {seo.canonical_base_url ? new URL(seo.canonical_base_url).hostname : "aether-audio.com"}
                  </span>
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {seo.meta_title || "AETHER Audio Labs"}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {seo.meta_description || "Studio-grade acoustics and high fidelity components."}
                  </p>
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
        message="Unsaved SEO settings"
      />
    </div>
  );
}
