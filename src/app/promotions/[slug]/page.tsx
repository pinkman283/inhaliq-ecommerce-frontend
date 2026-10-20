"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Tag,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Percent,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Info,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { Promotion, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [campaign, setCampaign] = useState<Promotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function loadCampaign() {
      try {
        setLoading(true);
        const res = await api.getCampaignDetails(slug);
        if (isMounted) {
          if (!res.found || !res.promotion) {
            setNotFound(true);
          } else {
            setCampaign(res.promotion);
            setIsActive(res.is_active);
            setProducts(res.products || []);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCampaign();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Countdown calculation
  useEffect(() => {
    if (!campaign?.expires_at) return;

    function calc() {
      const target = new Date(campaign!.expires_at!).getTime();
      const diff = Math.max(0, target - Date.now());

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      return { days, hours, minutes, seconds, isExpired: false };
    }

    setTimeLeft(calc());
    const interval = setInterval(() => {
      setTimeLeft(calc());
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign?.expires_at]);

  const promoCode = campaign?.primary_code;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success(`Promo code "${promoCode}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded bg-white/10" />
            <Skeleton className="h-4 w-4 rounded bg-white/10" />
            <Skeleton className="h-4 w-32 rounded bg-white/10" />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden space-y-6">
            <Skeleton className="w-full h-64 sm:h-80 bg-white/10" />
            <div className="p-6 sm:p-10 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-32 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-8 sm:h-10 w-3/4 rounded-lg bg-white/10" />
              <Skeleton className="h-4 w-full rounded bg-white/5" />
              <Skeleton className="h-4 w-4/5 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-12 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Campaign Not Found</h1>
            <p className="text-sm text-slate-400">
              The promotional campaign you are looking for may have concluded, changed URL, or is
              no longer active.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/promotions"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md"
            >
              Browse Active Promotions
            </Link>
            <Link
              href="/products"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDigit = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link href="/promotions" className="hover:text-white transition-colors">
            Promotions
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-bold truncate max-w-xs">{campaign.name}</span>
        </nav>

        {/* Campaign Concluded Banner (if inactive or expired) */}
        {(!isActive || timeLeft.isExpired) && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">This Campaign Has Concluded</h4>
                <p className="text-xs text-slate-400">
                  The discount code or campaign window is no longer active. You can still browse the
                  flagship items below.
                </p>
              </div>
            </div>
            <Link
              href="/promotions"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white whitespace-nowrap transition-colors"
            >
              See Active Deals
            </Link>
          </div>
        )}

        {/* Hero Showcase Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-slate-900 via-[#0c121e] to-[#07090e]">
          {campaign.banner_image && (
            <div className="absolute inset-0 z-0 opacity-25">
              <img
                src={campaign.banner_image}
                alt={campaign.image_alt_text || campaign.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/80 to-transparent" />
            </div>
          )}

          <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline & Details */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                  {campaign.formatted_discount ||
                    (campaign.discount_type === "percentage"
                      ? `${campaign.discount_value}% OFF`
                      : `৳${Number(campaign.discount_value).toLocaleString()} OFF`)}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-white/10 text-slate-300 border border-white/10">
                  {campaign.promotion_type.replace(/_/g, " ")}
                </span>

                {campaign.is_stackable && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Stackable
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {campaign.headline || campaign.name}
              </h1>

              {(campaign.subheadline || campaign.description) && (
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                  {campaign.subheadline || campaign.description}
                </p>
              )}

              {/* Promo Code & Action Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {promoCode ? (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-sm font-black transition-all cursor-pointer shadow-lg shadow-amber-400/15 active:scale-95"
                    title="Click to copy voucher code"
                  >
                    <Tag className="w-4 h-4 text-slate-950" />
                    <span>CODE: {promoCode}</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-800 ml-1" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-800 ml-1 opacity-80" />
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Automatic Discount Applied in Cart</span>
                  </div>
                )}

                {campaign.min_order_amount > 0 && (
                  <div className="text-xs text-slate-400 font-medium">
                    Minimum order: <span className="font-bold text-white">৳{Number(campaign.min_order_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Countdown & Rules Card */}
            <div className="lg:col-span-5 space-y-4">
              {/* Countdown Card */}
              {campaign.expires_at && !timeLeft.isExpired && (
                <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>CAMPAIGN ENDS IN</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(campaign.expires_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none block">
                        {formatDigit(timeLeft.days)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Days
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none block">
                        {formatDigit(timeLeft.hours)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Hours
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none block">
                        {formatDigit(timeLeft.minutes)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Mins
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono leading-none block">
                        {formatDigit(timeLeft.seconds)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-amber-300/80 tracking-wider">
                        Secs
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Perks Pill */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authoritative Checkout Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This discount is synchronized with our centralized promotions engine. Applicable
                  directly at checkout with real-time stock allocation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Eligible Products Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Eligible Campaign Hardware</span>
              </h2>
              <p className="text-xs text-slate-400 pt-0.5">
                {campaign.applies_to === "specific_products"
                  ? "Products specifically targeted by this campaign."
                  : campaign.applies_to === "specific_categories"
                  ? "Gear from targeted audio, keyboard, and EDC categories."
                  : "Applicable across our entire flagship hardware catalog."}
              </p>
            </div>

            <Link
              href="/products"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                This discount applies storewide! Browse our hardware catalog to apply it on your next checkout.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Terms & Conditions Section */}
        {campaign.terms_conditions && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Terms & Conditions</span>
            </div>
            <div className="text-xs text-slate-400 whitespace-pre-line leading-relaxed font-sans">
              {campaign.terms_conditions}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
