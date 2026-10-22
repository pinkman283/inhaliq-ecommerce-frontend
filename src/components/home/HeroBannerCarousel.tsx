"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Tag } from "lucide-react";
import { Banner } from "@/types";
import { api } from "@/lib/api";

interface HeroBannerCarouselProps {
  banners: Banner[];
}

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
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

  // Autoplay (6s interval, pauses on hover)
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

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div
      className="relative rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-xl group select-none bg-[#090b11] w-full aspect-[16/9] min-h-[200px] max-h-[460px]"
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
                  className="block w-full h-full relative cursor-pointer group/card"
                >
                  {/* Responsive Picture: Desktop vs Mobile Image */}
                  <picture className="absolute inset-0 w-full h-full">
                    {banner.mobile_image_url && (
                      <source
                        media="(max-width: 640px)"
                        srcSet={banner.mobile_image_url}
                      />
                    )}
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text || banner.title || "Promotional Banner"}
                      loading={isPriority ? "eager" : "lazy"}
                      fetchPriority={isPriority ? "high" : "auto"}
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-[1.01]"
                    />
                  </picture>

                  {/* NO artificial dark overlay - natural image composition */}

                  {/* Banner Copy Overlay (only if real text content is configured) */}
                  {hasTextOverlay && (
                    <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 sm:p-6 lg:p-7 max-w-sm sm:max-w-md space-y-1.5 sm:space-y-2 dark-banner-content">
                      {/* Eyebrow & Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {banner.eyebrow && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/10 text-cyan-300 border border-cyan-400/30 backdrop-blur-md shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                            {banner.eyebrow}
                          </span>
                        )}

                        {banner.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                            {banner.badge}
                          </span>
                        )}

                        {banner.discount_tag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/40 backdrop-blur-md">
                            <Tag className="w-2.5 h-2.5 text-purple-400" />
                            {banner.discount_tag}
                          </span>
                        )}
                      </div>

                      {/* Headline */}
                      <h2
                        style={{ color: "#ffffff" }}
                        className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-md line-clamp-2"
                      >
                        {banner.title}
                      </h2>

                      {/* Subtitle */}
                      {banner.subtitle && (
                        <p
                          style={{ color: "rgba(241, 245, 249, 0.95)" }}
                          className="text-[11px] sm:text-xs text-slate-200/90 leading-relaxed line-clamp-1 sm:line-clamp-2 drop-shadow"
                        >
                          {banner.subtitle}
                        </p>
                      )}

                      {/* CTA Button */}
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md bg-white text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider group-hover/card:bg-cyan-400 transition-all duration-300 shadow-lg group-hover/card:translate-x-0.5">
                          <span>{banner.cta_text || "Shop Now"}</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows (Visible on Desktop Hover) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous banner"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next banner"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bottom Pagination Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => scrollTo(idx, e)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  selectedIndex === idx
                    ? "w-5 h-1.5 bg-cyan-400 shadow-sm shadow-cyan-400/50"
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
