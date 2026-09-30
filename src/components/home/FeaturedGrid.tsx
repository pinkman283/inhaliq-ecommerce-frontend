"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Trophy } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

interface FeaturedGridProps {
  featuredProducts: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
}

export function FeaturedGrid({ featuredProducts, newArrivals, bestSellers }: FeaturedGridProps) {
  const [activeTab, setActiveTab] = useState<"featured" | "new" | "bestsellers">("featured");
  const [api, setApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rawList =
    activeTab === "featured"
      ? featuredProducts
      : activeTab === "new"
      ? newArrivals
      : bestSellers;
  const displayList = rawList.slice(0, 14);

  // Autoplay function that triggers every 3.5 seconds, pausing when cursor is on any card
  const resetAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    if (isHovered) return;

    autoplayTimerRef.current = setInterval(() => {
      if (!api || isHovered) return;
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 3500);
  }, [api, isHovered]);

  useEffect(() => {
    if (!api) return;
    resetAutoplay();

    api.on("select", resetAutoplay);
    api.on("pointerDown", () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    });
    api.on("pointerUp", resetAutoplay);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [api, resetAutoplay]);

  // When tab changes, reset carousel to start
  useEffect(() => {
    if (api) {
      api.scrollTo(0);
      resetAutoplay();
    }
  }, [activeTab, api, resetAutoplay]);

  if (displayList.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span
            className="text-[11px] font-black uppercase tracking-widest block mb-1"
            style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #006B45)))" }}
          >
            Studio Selection
          </span>
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            Flagship Hardware Showcase
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="flex theme-tab-container rounded-md p-1 border self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab("featured")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "featured"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Sparkles className="w-3 h-3" /> Featured
          </button>

          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "new"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Flame className="w-3 h-3" /> New Arrivals
          </button>

          <button
            onClick={() => setActiveTab("bestsellers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bestsellers"
                ? "theme-tab-pill-active"
                : "theme-tab-pill-inactive"
            }`}
          >
            <Trophy className="w-3 h-3" /> Best Sellers
          </button>
        </div>
      </div>

      {/* Carousel Track with Side Left & Right Navigation Buttons (Pauses on Hover) */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full relative group/carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <CarouselContent className="-ml-3 sm:-ml-3.5">
            {displayList.map((product, index) => (
              <CarouselItem
                key={`featured-${activeTab}-${product.id ?? index}-${index}`}
                className="pl-3 sm:pl-3.5 basis-[200px] sm:basis-[220px] md:basis-[230px] lg:basis-[240px]"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Left Navigation Button */}
          <CarouselPrevious
            onClick={resetAutoplay}
            className="-left-3 sm:-left-5 w-10 h-10"
          />

          {/* Right Navigation Button */}
          <CarouselNext
            onClick={resetAutoplay}
            className="-right-3 sm:-right-5 w-10 h-10"
          />
        </div>
      </Carousel>

      {/* View All CTA */}
      <div className="text-center mt-6 mb-2 sm:mt-8 sm:mb-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 theme-view-all-btn text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.02]"
        >
          <span>Explore All</span> <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
