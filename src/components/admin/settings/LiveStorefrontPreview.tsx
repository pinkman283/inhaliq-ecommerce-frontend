"use client";

import { useState } from "react";
import { 
  Monitor, 
  Smartphone, 
  Split, 
  Sparkles, 
  Radio, 
  Search, 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  Info,
  ShieldCheck,
  Star,
  Layers
} from "lucide-react";
import { getHexLuminance } from "@/store/useThemeStore";

interface LiveStorefrontPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  cardBgColor: string;
  cardBorderColor?: string;
  textHeadingColor?: string;
  textBodyColor?: string;
  btnPrimaryBg?: string;
  btnPrimaryText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  radius?: string;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementBadge?: string;
  brandName?: string;
  brandTagline?: string;
  brandLogo?: string;
  heroHeadline1?: string;
  heroHeadline2Gradient?: string;
  heroHeadline3?: string;
  heroSubheading?: string;
  heroBadgeText?: string;
  onElementClick?: (section: string) => void;
}

export function LiveStorefrontPreview({
  primaryColor,
  secondaryColor,
  bgColor,
  cardBgColor,
  cardBorderColor = "rgba(255, 255, 255, 0.1)",
  textHeadingColor = "#ffffff",
  textBodyColor = "#94a3b8",
  btnPrimaryBg,
  btnPrimaryText = "#ffffff",
  footerBgColor = "#1f242e",
  footerTextColor = "#94a3b8",
  radius = "rounded-lg",
  announcementEnabled = true,
  announcementText = "Free Express Shipping on orders over $100 • Code: WELCOME20 (-20%)",
  announcementBadge = "Global Shipping Active",
  brandName = "AETHER",
  brandTagline = "Studio & Hardware Lab",
  brandLogo = "",
  heroHeadline1 = "Uncompromising",
  heroHeadline2Gradient = "Industrial Audio",
  heroHeadline3 = "& Tech Ecosystem.",
  heroSubheading = "Engineered with aerospace-grade titanium and custom beryllium drivers for creators who refuse mediocrity.",
  heroBadgeText = "2026 Studio Flagship Release",
  onElementClick,
}: LiveStorefrontPreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPage, setPreviewPage] = useState<"home" | "product" | "cart">("home");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSlider, setCompareSlider] = useState(50);

  const isLightCanvas = getHexLuminance(bgColor) > 0.45;
  const effectivePrimaryBtnBg = btnPrimaryBg || primaryColor;
  const isLightFooter = getHexLuminance(footerBgColor || "#1f242e") > 0.45;
  const footerHeadingColor = isLightFooter ? "#0f172a" : "#ffffff";
  const effectiveFooterTextColor = footerTextColor || (isLightFooter ? "#475569" : "#94a3b8");

  return (
    <div className="space-y-3 sticky top-6">
      
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0b0e17] border border-white/10 text-xs">
        
        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setPreviewDevice("desktop")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              previewDevice === "desktop"
                ? "bg-[#A78BFA] text-[#090B10] font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("mobile")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              previewDevice === "mobile"
                ? "bg-[#A78BFA] text-[#090B10] font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Mobile Phone View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">
          <button
            type="button"
            onClick={() => setPreviewPage("home")}
            className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
              previewPage === "home" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setPreviewPage("product")}
            className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
              previewPage === "product" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Product Detail
          </button>
          <button
            type="button"
            onClick={() => setPreviewPage("cart")}
            className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
              previewPage === "cart" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Checkout
          </button>
        </div>

        {/* Compare Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
            isCompareMode
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
              : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
          }`}
          title="Compare with live storefront"
        >
          <Split className="w-3 h-3" />
          <span>Compare</span>
        </button>

      </div>

      {/* Compare Slider bar */}
      {isCompareMode && (
        <div className="p-2 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-[10px] flex items-center justify-between text-indigo-200">
          <span>Live Storefront</span>
          <input
            type="range"
            min="0"
            max="100"
            value={compareSlider}
            onChange={(e) => setCompareSlider(Number(e.target.value))}
            className="w-32 accent-amber-400 cursor-pointer"
          />
          <span>Draft Theme</span>
        </div>
      )}

      {/* Mockup Canvas Container with Device Frame wrapper */}
      <div className={`transition-all duration-300 ${
        previewDevice === "mobile" 
          ? "max-w-[340px] mx-auto rounded-[32px] border-[6px] border-slate-800 shadow-2xl p-2 bg-slate-950" 
          : "w-full"
      }`}>
        
        {/* Mobile Phone Speaker Notch */}
        {previewDevice === "mobile" && (
          <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-2 opacity-80" />
        )}

        <div
          className={`rounded-md border overflow-hidden shadow-2xl p-4 space-y-3.5 transition-all duration-300 relative ${
            isLightCanvas ? "border-slate-300 text-slate-900 shadow-slate-300/40" : "border-white/15 text-slate-100"
          }`}
          style={{ backgroundColor: bgColor }}
        >
          
          {/* WYSIWYG Hint */}
          <div className="text-[9px] text-slate-500 flex items-center justify-end gap-1 opacity-70">
            <Info className="w-2.5 h-2.5" />
            <span>Interactive live preview</span>
          </div>

          {/* 1. Announcement Bar */}
          {announcementEnabled && (
            <div
              onClick={() => onElementClick?.("announcement")}
              className={`py-1.5 px-3 rounded-md text-[9.5px] font-medium flex items-center justify-between border cursor-pointer hover:ring-2 hover:ring-[#A78BFA]/50 transition-all ${
                isLightCanvas ? "text-slate-800 border-slate-300" : "text-slate-200 border-white/10"
              }`}
              style={{
                background: isLightCanvas
                  ? `linear-gradient(90deg, ${secondaryColor}15, #f8fafc, ${primaryColor}15)`
                  : `linear-gradient(90deg, ${secondaryColor}30, #0a0d18, ${primaryColor}30)`,
              }}
            >
              <span className="font-bold flex items-center gap-1" style={{ color: primaryColor }}>
                <Radio className="w-2.5 h-2.5 animate-pulse" /> {announcementBadge}
              </span>
              <span className="truncate max-w-[170px]">{announcementText}</span>
            </div>
          )}

          {/* 2. Mini Navbar */}
          <div
            onClick={() => onElementClick?.("branding")}
            className={`p-2.5 rounded-md border flex items-center justify-between gap-2 cursor-pointer hover:ring-2 hover:ring-[#A78BFA]/50 transition-all ${
              isLightCanvas ? "bg-white/90 border-slate-200 shadow-sm" : "bg-[#090b14]/90 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {brandLogo ? (
                <div className="h-5 max-w-[110px] flex items-center shrink-0">
                  <img src={brandLogo} alt={brandName} className="max-h-5 w-auto object-contain object-left" />
                </div>
              ) : (
                <span className={`font-black text-xs block leading-tight ${isLightCanvas ? "text-slate-900" : "text-white"}`}>
                  {brandName || "AETHER"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded text-[9px] flex items-center gap-1 border ${
                isLightCanvas ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white/5 border-white/10 text-slate-400"
              }`}>
                <Search className="w-2.5 h-2.5" />
                <span className="truncate">Search...</span>
              </div>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-2.5 h-2.5" />
                <span>$235</span>
              </div>
            </div>
          </div>

          {/* PAGE VIEW: HOMEPAGE */}
          {previewPage === "home" && (
            <div className="space-y-3">
              {/* Hero Banner Mockup */}
              <div
                onClick={() => onElementClick?.("hero")}
                className={`p-4 rounded-md border space-y-2.5 transition-all cursor-pointer hover:ring-2 hover:ring-[#A78BFA]/50 ${
                  isLightCanvas ? "shadow-sm border-slate-200" : "border-white/10"
                }`}
                style={{ backgroundColor: cardBgColor }}
              >
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor,
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{heroBadgeText}</span>
                </div>

                <h4 className={`text-base font-black leading-tight ${isLightCanvas ? "text-slate-900" : "text-white"}`}>
                  {heroHeadline1} <br />
                  <span
                    style={{
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {heroHeadline2Gradient}
                  </span>{" "}
                  {heroHeadline3}
                </h4>

                <p className={`text-[10px] leading-relaxed line-clamp-2 ${isLightCanvas ? "text-slate-600" : "text-slate-400"}`}>
                  {heroSubheading}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-md"
                    style={{
                      backgroundColor: effectivePrimaryBtnBg,
                      color: btnPrimaryText,
                    }}
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Product Card Showcase */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: "AeroPack X-Pac 24L", price: "$235.00", badge: "Flagship" },
                  { name: "CyberDeck Matrix 65%", price: "$189.00", badge: "Hot" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md border space-y-1.5"
                    style={{
                      backgroundColor: cardBgColor,
                      borderColor: cardBorderColor,
                    }}
                  >
                    <div className="h-16 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      [ Hardware Image ]
                    </div>
                    <div>
                      <span className="text-[11px] font-bold block truncate" style={{ color: textHeadingColor }}>
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: primaryColor }}>
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE VIEW: PRODUCT DETAIL */}
          {previewPage === "product" && (
            <div
              className="p-4 rounded-md border space-y-3"
              style={{ backgroundColor: cardBgColor, borderColor: cardBorderColor }}
            >
              <div className="h-28 rounded-md bg-white/5 flex items-center justify-center text-xs text-slate-500 font-mono">
                [ Studio Product Gallery ]
              </div>
              <div>
                <span className="text-xs font-black block" style={{ color: textHeadingColor }}>
                  AeroPack X-Pac 24L Modular Travel Pack
                </span>
                <span className="text-sm font-mono font-bold block mt-0.5" style={{ color: primaryColor }}>
                  $235.00
                </span>
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-md text-xs font-bold uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: effectivePrimaryBtnBg,
                  color: btnPrimaryText,
                }}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          )}

          {/* PAGE VIEW: CHECKOUT */}
          {previewPage === "cart" && (
            <div
              className="p-4 rounded-md border space-y-3"
              style={{ backgroundColor: cardBgColor, borderColor: cardBorderColor }}
            >
              <h5 className="text-xs font-bold" style={{ color: textHeadingColor }}>
                Order Summary
              </h5>
              <div className="p-2.5 rounded-md bg-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span style={{ color: textBodyColor }}>AeroPack X-Pac 24L (x1)</span>
                  <span className="font-mono font-bold" style={{ color: textHeadingColor }}>$235.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-400">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: effectivePrimaryBtnBg,
                  color: btnPrimaryText,
                }}
              >
                <span>Confirm Order • $235.00</span>
              </button>
            </div>
          )}

          {/* MINI LIVE FOOTER PREVIEW */}
          <div
            className="mt-6 pt-3 pb-3 px-3 rounded-md border-t transition-colors text-[10px]"
            style={{
              backgroundColor: footerBgColor || "#1f242e",
              borderColor: isLightFooter ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
              color: effectiveFooterTextColor,
            }}
          >
            {/* Guarantees mini row */}
            <div
              className="grid grid-cols-2 gap-1.5 pb-2 mb-2 border-b"
              style={{ borderColor: isLightFooter ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)" }}
            >
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                <span className="font-semibold truncate text-[9px]" style={{ color: footerHeadingColor }}>
                  Free Express Delivery
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                <span className="font-semibold truncate text-[9px]" style={{ color: footerHeadingColor }}>
                  2-Year Warranty
                </span>
              </div>
            </div>

            {/* Brand and mini copyright */}
            <div className="flex items-center justify-between">
              <span className="font-black text-[10px] tracking-tight" style={{ color: footerHeadingColor }}>
                {brandName || "AETHER"}
              </span>
              <span className="text-[9px] opacity-75">
                © 2026 Storefront
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
