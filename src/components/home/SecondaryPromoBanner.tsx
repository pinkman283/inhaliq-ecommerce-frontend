"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Sparkles, Tag, Flame, ChevronRight, ChevronLeft } from "lucide-react";
import { Banner } from "@/types";
import { api } from "@/lib/api";

interface SecondaryPromoBannerProps {
  banners: Banner[];
}

export function SecondaryPromoBanner({ banners }: SecondaryPromoBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: banners.length > 1,
    duration: 30,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Autoplay (Exact same 6s interval as left carousel, pauses on hover)
  useEffect(() => {
    if (!emblaApi || banners.length <= 1 || isPaused) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [emblaApi, banners.length, isPaused]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const handleBannerClick = (banner: Banner) => {
    if (banner.id) {
      api.trackBannerClick(banner.id);
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div 
      className="relative w-full h-full min-h-[200px] aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-xl group select-none bg-[#0c0f18]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Embla Viewport */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {banners.map((banner, index) => {
            const targetUrl = banner.computed_link || banner.cta_link || "/products";
            const isPriority = index === 0;
            const hasTextOverlay = Boolean(banner.title && banner.title.trim().length > 0);

            return (
              <div
                key={banner.id || index}
                className="relative flex-[0_0_100%] min-w-0 h-full"
              >
                <Link
                  href={targetUrl}
                  onClick={() => handleBannerClick(banner)}
                  className="relative block w-full h-full cursor-pointer group/card"
                >
                  {/* Background Showcase Image */}
                  <picture className="absolute inset-0 w-full h-full">
                    {banner.mobile_image_url && (
                      <source media="(max-width: 640px)" srcSet={banner.mobile_image_url} />
                    )}
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text || banner.title || "Promotional Banner"}
                      loading={isPriority ? "eager" : "lazy"}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-102"
                    />
                  </picture>

                  {/* NO artificial dark overlay - clean natural banner presentation */}

                  {/* Content Overlay (only if real text content is configured) */}
                  {hasTextOverlay && (
                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        {banner.eyebrow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/15 text-white border border-white/20 backdrop-blur-md">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            {banner.eyebrow}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                            <Flame className="w-2.5 h-2.5 text-amber-400" />
                            PROMO
                          </span>
                        )}

                        {banner.badge && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                            {banner.badge}
                          </span>
                        )}
                      </div>

                      {/* Bottom Copy & CTA */}
                      <div className="space-y-1.5 dark-banner-content">
                        {banner.discount_tag && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 border border-amber-400/50 text-amber-300 font-mono text-[9px] sm:text-[10px] font-black backdrop-blur-md shadow-sm">
                            <Tag className="w-2.5 h-2.5 text-amber-400" />
                            <span>{banner.discount_tag}</span>
                          </div>
                        )}

                        <h3
                          style={{ color: "#ffffff" }}
                          className="text-sm sm:text-base lg:text-lg font-black text-white tracking-tight leading-snug line-clamp-2 drop-shadow-md"
                        >
                          {banner.title}
                        </h3>

                        {banner.subtitle && (
                          <p
                            style={{ color: "rgba(226, 232, 240, 0.95)" }}
                            className="text-[10px] sm:text-[11px] text-slate-200 leading-relaxed line-clamp-1 drop-shadow"
                          >
                            {banner.subtitle}
                          </p>
                        )}

                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 group-hover/card:bg-white text-white group-hover/card:text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider border border-white/20 transition-all duration-300 shadow">
                            <span>{banner.cta_text || "Explore Deal"}</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows (Prev / Next on Desktop Hover - same as Left Carousel) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous promo banner"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next promo banner"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bottom Pagination Indicators (Same style as Left Carousel) */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => scrollTo(idx, e)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  selectedIndex === idx
                    ? "w-5 h-1.5 bg-amber-400 shadow-sm shadow-amber-400/50"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
