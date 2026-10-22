"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Banner, HomepageBannersResponse } from "@/types";
import { HeroBannerCarousel } from "./HeroBannerCarousel";
import { SecondaryPromoBanner } from "./SecondaryPromoBanner";
import { HeroPromotionStrip } from "./HeroPromotionStrip";
import { HeroSectionSkeleton } from "@/components/ui/skeleton-card";

export function HeroSection({ initialData }: { initialData?: HomepageBannersResponse | null }) {
  const [data, setData] = useState<HomepageBannersResponse | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    let isMounted = true;

    async function loadBanners() {
      if (initialData) return;
      try {
        const res = await api.getHomepageBanners();
        if (isMounted && res) {
          setData(res);
        }
      } catch (err) {
        console.warn("Notice: Storefront homepage banners fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  const primaryBanners = data?.primary_banners || [];
  const secondaryBanners = data?.secondary_banners || [];
  const topStrip = data?.top_strip || null;

  if (loading) {
    return <HeroSectionSkeleton />;
  }

  if (primaryBanners.length === 0 && secondaryBanners.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 pt-3 sm:pt-4.5">
      {/* 1. Micro Promotion Strip (if configured and returned by API) */}
      {topStrip && <HeroPromotionStrip banner={topStrip} />}

      {/* 2. Main Hero Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          {/* Left / Center: Primary Hero Carousel */}
          <div className={`${secondaryBanners.length > 0 ? "lg:col-span-8" : "lg:col-span-12"} h-full`}>
            <HeroBannerCarousel banners={primaryBanners} />
          </div>

          {/* Right: Secondary Promotional Card (SECOND promotional banner) */}
          {secondaryBanners.length > 0 && (
            <div className="lg:col-span-4 h-full">
              <SecondaryPromoBanner banners={secondaryBanners} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
