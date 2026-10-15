"use client";

import React from "react";
import { Sparkles, Globe, Search, CheckCircle2 } from "lucide-react";
import { ProductFormData } from "@/types";

interface ProductSeoTabProps {
  formData: ProductFormData;
  onChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  slug?: string;
}

export function ProductSeoTab({ formData, onChange, slug }: ProductSeoTabProps) {
  const displayTitle = formData.meta_title.trim() || formData.name.trim() || "Product Title";
  const displayDescription =
    formData.meta_description.trim() ||
    formData.short_description.trim() ||
    formData.description.trim() ||
    "Comprehensive product specifications, features, and pricing available online.";
  const displaySlug = slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product-url";

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-2.5 pb-2 border-b border-white/[0.06]">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-white tracking-wide">
            Search Engine Optimization (SEO)
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Customize how this product appears on Google, Bing, social media previews, and external search engines. If left blank, default title and description will be used automatically.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* Meta Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 block">SEO Meta Title</label>
            <span
              className={`text-[10.5px] font-mono ${
                formData.meta_title.length > 60 ? "text-amber-400" : "text-slate-500"
              }`}
            >
              {formData.meta_title.length}/60 chars
            </span>
          </div>
          <input
            type="text"
            value={formData.meta_title}
            onChange={(e) => onChange("meta_title", e.target.value)}
            placeholder="Custom title tag (recommended 50-60 characters)..."
            className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-md px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all outline-none"
          />
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 block">SEO Meta Description</label>
            <span
              className={`text-[10.5px] font-mono ${
                formData.meta_description.length > 160 ? "text-amber-400" : "text-slate-500"
              }`}
            >
              {formData.meta_description.length}/160 chars
            </span>
          </div>
          <textarea
            rows={3}
            value={formData.meta_description}
            onChange={(e) => onChange("meta_description", e.target.value)}
            placeholder="Brief search snippet summarizing key features and value proposition..."
            className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-md px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* Live SERP Preview */}
      <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
        <h5 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          Live Search Snippet Preview
        </h5>

        <div className="p-4 rounded-md bg-[#121624] border border-white/10 space-y-1.5 shadow-md max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate text-slate-300 font-mono">
              https://yourstore.com/products/{displaySlug}
            </span>
          </div>
          <h6 className="text-sm font-semibold text-[#8ab4f8] hover:underline cursor-pointer truncate">
            {displayTitle}
          </h6>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>
        </div>
      </div>

      {/* Quick Best Practice Tips */}
      <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-2 text-xs text-slate-400">
        <p className="font-semibold text-white text-[11px] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          SEO Guidelines:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
          <li>Include unique keywords that users search for.</li>
          <li>Keep the title between 40-60 characters for best mobile and desktop display.</li>
          <li>Accurately highlight brand, core utility, and materials in the meta description.</li>
        </ul>
      </div>
    </div>
  );
}
