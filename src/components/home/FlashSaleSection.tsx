"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { Product, Promotion } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

interface FlashSaleSectionProps {
  products: Product[];
}

export function FlashSaleSection({ products }: FlashSaleSectionProps) {
  const { theme } = useThemeStore();
  const [flashPromo, setFlashPromo] = useState<Promotion | null>(null);

  // If disabled by admin, do not render
  if (theme.flash_deals_enabled === false) return null;

  // Real countdown timer bound to promotion expires_at
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // Load active flash sale promotion
  useEffect(() => {
    let isMounted = true;
    api.getStorefrontPromotions("flash_sale")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        if (isMounted && list.length > 0) {
          setFlashPromo(list[0]);
        }
      })
      .catch((err) => {
        console.warn("Notice: flash sale promotion lookup:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate live countdown strictly from expires_at
  useEffect(() => {
    function calculateRemaining() {
      let targetTime: number;
      if (flashPromo?.expires_at) {
        targetTime = new Date(flashPromo.expires_at).getTime();
      } else {
        // Fallback to midnight tonight if no specific promotion end date configured
        const now = new Date();
        const midnight = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        ).getTime();
        targetTime = midnight;
      }

      const diff = Math.max(0, targetTime - Date.now());
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return { hours, minutes, seconds, isExpired: false };
    }

    setTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      setTimeLeft(calculateRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashPromo?.expires_at]);

  // If promotion has expired, do not show flash sale section
  if (flashPromo?.expires_at && timeLeft.isExpired) {
    return null;
  }

  // Deduplicate products by id
  const uniqueProducts = Array.from(
    new Map((products || []).map((p) => [p.id, p])).values()
  );

  // Filter products with active discounts, or fallback to first 6 products
  const discountedProducts = uniqueProducts
    .filter((p) => p.compare_at_price && p.compare_at_price > p.price)
    .slice(0, 6);

  const displayProducts =
    discountedProducts.length >= 2 ? discountedProducts : uniqueProducts.slice(0, 6);

  if (displayProducts.length === 0) return null;

  const formatDigit = (num: number) => String(num).padStart(2, "0");
  const sectionTitle = flashPromo?.headline || theme.flash_deals_title || "Limited Time Deals";
  const badgeText = flashPromo?.badge || theme.flash_deals_badge || "Flash Deal Drop";
  const discountText =
    flashPromo?.formatted_discount ||
    (flashPromo?.discount_type === "percentage"
      ? `${flashPromo.discount_value}% OFF`
      : flashPromo?.discount_type === "fixed_amount"
      ? `৳${Number(flashPromo.discount_value).toLocaleString()} OFF`
      : "Up to 40% OFF");
  const ctaLink =
    flashPromo?.cta_link ||
    (flashPromo?.slug ? `/promotions/${flashPromo.slug}` : "/products");

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative rounded-2xl theme-card border border-rose-500/20 bg-gradient-to-br from-rose-950/20 via-[#0c101d] to-[#090b14] p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xl">
        {/* Background glow orb */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header with Live Countdown Timer */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <Flame className="w-3 h-3 text-rose-400 fill-rose-500" />
              {badgeText}
            </div>
            <h2
              className="text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2"
              style={{ color: "var(--theme-text-heading, #ffffff)" }}
            >
              {sectionTitle}
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-600 text-white shadow-sm">
                {discountText}
              </span>
            </h2>
            <p
              className="text-xs max-w-lg"
              style={{ color: "var(--theme-text-body, #94a3b8)" }}
            >
              {flashPromo?.subheadline || "High-demand studio units with instant dispatch warranty. Deals refresh periodically."}
            </p>
          </div>

          {/* Flash Timer Pills */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pr-1">
              <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Ends in:</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Hours */}
              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-white/10 shadow-md">
                <span className="text-sm font-black text-white font-mono leading-none">
                  {formatDigit(timeLeft.hours)}
                </span>
                <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Hours
                </span>
              </div>

              <span className="text-rose-400 font-bold text-sm">:</span>

              {/* Mins */}
              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-white/10 shadow-md">
                <span className="text-sm font-black text-white font-mono leading-none">
                  {formatDigit(timeLeft.minutes)}
                </span>
                <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Mins
                </span>
              </div>

              <span className="text-rose-400 font-bold text-sm">:</span>

              {/* Secs */}
              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-b from-rose-950 to-slate-950 border border-rose-500/30 shadow-md">
                <span className="text-sm font-black text-rose-400 font-mono leading-none">
                  {formatDigit(timeLeft.seconds)}
                </span>
                <span className="text-[7.5px] uppercase font-bold text-rose-300 tracking-wider mt-0.5">
                  Secs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-6">
          {displayProducts.map((product, index) => (
            <ProductCard key={`flash-sale-${product.id ?? index}-${index}`} product={product} />
          ))}
        </div>

        {/* Footer View All Link */}
        <div className="relative z-10 pt-6 mt-4 flex items-center justify-center border-t border-white/5">
          <Link
            href={ctaLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs theme-btn-secondary transition-all hover:scale-[1.02]"
          >
            <span>{flashPromo?.cta_text || "Explore All Discounted Drops"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
