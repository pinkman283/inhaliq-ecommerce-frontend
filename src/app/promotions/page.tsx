"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Gift,
  Zap,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Percent,
  Truck,
  ShieldCheck,
  Search,
  Flame,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Promotion } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPromos() {
      try {
        setLoading(true);
        const res = await api.getStorefrontPromotions();
        if (isMounted) {
          setPromotions(Array.isArray(res) ? res : (res as any)?.data || []);
        }
      } catch (err) {
        console.warn("Failed to load storefront promotions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPromos();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredPromotions = promotions.filter((p) => {
    if (filter === "codes" && !p.primary_code) return false;
    if (filter === "auto" && p.promotion_type !== "automatic_discount") return false;
    if (filter === "claimable" && p.promotion_type !== "claimable_coupon") return false;
    if (filter === "free_shipping" && p.discount_type !== "free_shipping") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchHeadline = p.headline?.toLowerCase().includes(q);
      const matchCode = p.primary_code?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      return matchName || matchHeadline || matchCode || matchDesc;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900 via-[#0d121f] to-slate-900 p-8 sm:p-12 text-center shadow-2xl">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Offers & Vouchers</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Promotions & Special Campaigns
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Explore authentic seasonal savings, exclusive promo codes, and automated cart rewards
              on flagship studio hardware and precision accessories.
            </p>

            {/* Search & Filter Strip */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search offers by name, keyword, or promo code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 text-xs sm:text-sm">
          {[
            { id: "all", label: "All Offers", icon: Flame, count: promotions.length },
            {
              id: "codes",
              label: "Promo Codes",
              icon: Tag,
              count: promotions.filter((p) => Boolean(p.primary_code)).length,
            },
            {
              id: "auto",
              label: "Automatic Discounts",
              icon: Zap,
              count: promotions.filter((p) => p.promotion_type === "automatic_discount").length,
            },
            {
              id: "claimable",
              label: "Claimable Vouchers",
              icon: Gift,
              count: promotions.filter((p) => p.promotion_type === "claimable_coupon").length,
            },
            {
              id: "free_shipping",
              label: "Free Delivery",
              icon: Truck,
              count: promotions.filter((p) => p.discount_type === "free_shipping").length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10 scale-[1.02]"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-black/20 text-slate-950 font-black" : "bg-white/10 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Promotions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col space-y-4"
              >
                <Skeleton className="w-full h-44 bg-white/10" />
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-16 rounded bg-white/5" />
                    </div>
                    <Skeleton className="h-6 w-4/5 rounded bg-white/10" />
                    <Skeleton className="h-4 w-full rounded bg-white/5" />
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <Skeleton className="h-8 w-28 rounded-lg bg-white/10" />
                    <Skeleton className="h-8 w-20 rounded-lg bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No active promotions found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {search
                ? `No promotions matched "${search}". Try resetting your search query.`
                : "There are no campaigns matching this filter right now. Check back soon for new drop offers!"}
            </p>
            {(search || filter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotions.map((promo) => {
              const code = promo.primary_code;
              const hasCode = Boolean(code);
              const isCopied = copiedCode === code;

              return (
                <div
                  key={promo.id}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-amber-400/40 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Top Image or Header Banner */}
                  {promo.banner_image ? (
                    <div className="relative w-full h-44 overflow-hidden bg-slate-900">
                      <img
                        src={promo.banner_image}
                        alt={promo.image_alt_text || promo.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                          {promo.formatted_discount ||
                            (promo.discount_type === "percentage"
                              ? `${promo.discount_value}% OFF`
                              : `৳${Number(promo.discount_value).toLocaleString()} OFF`)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 p-4 flex items-start justify-between border-b border-white/5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                        {promo.formatted_discount ||
                          (promo.discount_type === "percentage"
                            ? `${promo.discount_value}% OFF`
                            : `৳${Number(promo.discount_value).toLocaleString()} OFF`)}
                      </span>
                      <Percent className="w-8 h-8 text-amber-400/40" />
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
                        <span>{promo.promotion_type.replace(/_/g, " ")}</span>
                        {promo.min_order_amount > 0 && (
                          <>
                            <span>•</span>
                            <span>Min spend: ৳{Number(promo.min_order_amount).toLocaleString()}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                        {promo.headline || promo.name}
                      </h3>

                      {(promo.subheadline || promo.description) && (
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {promo.subheadline || promo.description}
                        </p>
                      )}
                    </div>

                    {/* Expiration or Terms notice */}
                    {promo.expires_at && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Ends {new Date(promo.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Action & Promo Code */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                      {hasCode ? (
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(e, code!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-400/50 text-amber-300 font-mono text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
                          title="Click to copy voucher code"
                        >
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>{code}</span>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <Zap className="w-3.5 h-3.5" />
                          Auto Applied
                        </span>
                      )}

                      <Link
                        href={`/promotions/${promo.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-300 transition-colors"
                      >
                        <span>{promo.cta_text || "Shop Deals"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Rewards / Store Credit Info Strip */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-950/30 via-[#0d121f] to-amber-950/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Gift className="w-4 h-4" />
              <span>Studio Member Privileges</span>
            </div>
            <h4 className="text-lg font-bold text-white">
              Unlock Tier Rewards & Instant Store Credit
            </h4>
            <p className="text-xs text-slate-400">
              Sign in to your customer account to view personalized claimable coupons, cash-back store credits, and next-order discounts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/account/coupons"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer"
            >
              My Claimed Coupons
            </Link>
            <Link
              href="/products"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all cursor-pointer shadow-md"
            >
              Explore Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
