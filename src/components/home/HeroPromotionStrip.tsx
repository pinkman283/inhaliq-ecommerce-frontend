"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tag, ArrowRight, Copy, Check, Sparkles } from "lucide-react";
import { Banner } from "@/types";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface HeroPromotionStripProps {
  banner: Banner | null;
}

export function HeroPromotionStrip({ banner }: HeroPromotionStripProps) {
  const [copied, setCopied] = useState(false);

  if (!banner) return null;

  // Extract promo code if linked to promotion or written in discount_tag
  const promoCode =
    banner.promotion?.codes?.[0]?.code ||
    (banner.discount_tag?.includes("CODE:")
      ? banner.discount_tag.split("CODE:")[1].trim()
      : null);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success(`Coupon code ${promoCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClick = () => {
    if (banner.id) {
      api.trackBannerClick(banner.id);
    }
  };

  return (
    <div className="w-full bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-purple-500/10 dark:to-cyan-500/15 border-y border-amber-500/25 dark:border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left badge & headline */}
          <Link
            href={banner.computed_link || banner.cta_link || "/products"}
            onClick={handleClick}
            className="flex items-center gap-2 group cursor-pointer"
          >
            {banner.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                {banner.badge}
              </span>
            )}
            <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>{banner.title}</span>
            </span>
            {banner.subtitle && (
              <span className="hidden md:inline text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                — {banner.subtitle}
              </span>
            )}
          </Link>

          {/* Right voucher code & CTA */}
          <div className="flex items-center gap-2">
            {promoCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 hover:bg-amber-200 dark:bg-black/40 dark:hover:bg-black/60 border border-amber-400/60 text-amber-950 dark:text-amber-300 font-mono text-[11px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
                title="Click to copy voucher code"
              >
                <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>CODE: {promoCode}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-1" />
                ) : (
                  <Copy className="w-3 h-3 text-amber-800 dark:text-slate-400 group-hover:text-amber-950 dark:group-hover:text-white ml-1 opacity-80" />
                )}
              </button>
            )}

            <Link
              href={banner.computed_link || banner.cta_link || "/products"}
              onClick={handleClick}
              className="inline-flex items-center gap-1 text-[11px] font-black text-slate-800 dark:text-slate-300 hover:text-[#005826] dark:hover:text-white transition-colors"
            >
              <span>{banner.cta_text || "Claim Discount"}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
