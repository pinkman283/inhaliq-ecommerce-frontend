"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Headphones, Keyboard, Briefcase, Sparkles, Watch, Layers } from "lucide-react";
import { Category } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CategoryBentoProps {
  categories: Category[];
}

export function CategoryBento({ categories }: CategoryBentoProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const iconMap: Record<string, any> = {
    Headphones: Headphones,
    Keyboard: Keyboard,
    Briefcase: Briefcase,
    Sparkles: Sparkles,
    Watch: Watch,
    Layers: Layers,
  };

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

  // Group categories into pairs (Row 1 on top, Row 2 on bottom)
  const categoryPairs: { top: Category; bottom: Category | null }[] = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryPairs.push({
      top: categories[i],
      bottom: categories[i + 1] || null,
    });
  }

  const renderCard = (cat: Category) => {
    const Icon = iconMap[cat.icon || "Sparkles"] || Sparkles;

    return (
      <motion.div
        key={cat.id}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative rounded-lg overflow-hidden theme-card transition-all duration-300 h-[115px] sm:h-[125px] flex flex-col justify-between p-3 sm:p-3.5 shadow-md"
      >
        {/* Background Image & Dynamic Theme Gradient Overlay */}
        {cat.image && (
          <img
            src={cat.image}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
          />
        )}
        <div className="absolute inset-0 theme-category-overlay bg-gradient-to-t from-[#090b12]/95 via-[#090b12]/60 to-transparent transition-all" />

        {/* Top Header: Badge / Product Count & Arrow */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" style={{ color: "var(--theme-primary, #006B45)" }}>
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              {cat.products_count ?? 0} Products
            </span>
          </div>

          <div className="theme-category-arrow w-5.5 h-5.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:border-cyan-400/40 transition-all">
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Bottom Title & Description */}
        <div className="relative z-10 space-y-0.5">
          <h3 className="theme-category-title text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
            {cat.name}
          </h3>
          {cat.description && (
            <p className="theme-category-desc text-[10px] text-slate-400 line-clamp-1 leading-snug">
              {cat.description}
            </p>
          )}
        </div>

        <Link href={`/products?category=${cat.slug}`} className="absolute inset-0 z-20" />
      </motion.div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <span
            className="text-[11px] font-black uppercase tracking-widest block mb-1"
            style={{ color: "var(--theme-primary, #006B45)" }}
          >
            Curated Ecosystems
          </span>
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            Explore By Hardware Category
          </h2>
        </div>

        <Link
          href="/products"
          className="text-xs font-bold flex items-center gap-1 group mr-1 self-start sm:self-auto transition-colors hover:opacity-80"
          style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #006B45)))" }}
        >
          View All Categories <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Carousel Track with Left & Right Navigation Buttons (Pauses on Hover) */}
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
        <div className="relative px-1">
          {/* Carousel Content with 2-Row Stacked Items */}
          <CarouselContent className="-ml-3 sm:-ml-3.5">
            {categoryPairs.map((pair, idx) => (
              <CarouselItem
                key={idx}
                className="pl-3 sm:pl-3.5 basis-[185px] min-[380px]:basis-[210px] sm:basis-[250px] md:basis-[270px] lg:basis-[290px]"
              >
                <div className="flex flex-col gap-2.5 sm:gap-3 h-full">
                  {pair.top && renderCard(pair.top)}
                  {pair.bottom && renderCard(pair.bottom)}
                </div>
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
    </section>
  );
}
