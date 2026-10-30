"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Headphones, 
  Keyboard, 
  Briefcase, 
  Sparkles, 
  Watch, 
  Flame, 
  Layers 
} from "lucide-react";
import { Category } from "@/types";
import { useThemeStore } from "@/store/useThemeStore";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ExploreCategoriesSectionProps {
  categories?: Category[];
}

// LuLu inspired soft pastel background tints for category tiles
const PASTEL_TINTS = [
  "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/40",
  "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/40",
  "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800/40",
  "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800/40",
  "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800/40",
  "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/40",
];

const ICON_MAP: Record<string, any> = {
  Headphones: Headphones,
  Keyboard: Keyboard,
  Briefcase: Briefcase,
  Sparkles: Sparkles,
  Watch: Watch,
  Layers: Layers,
};

export function ExploreCategoriesSection({ categories = [] }: ExploreCategoriesSectionProps) {
  const { theme } = useThemeStore();
  const { t, isBangla } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Safely normalize categories to an array (handles Array, object with .data, or keyed dictionary)
  const categoryList: Category[] = Array.isArray(categories)
    ? categories
    : categories && typeof categories === "object"
      ? Array.isArray((categories as any).data)
        ? (categories as any).data
        : Object.values(categories).filter((item): item is Category => Boolean(item && typeof item === "object" && "id" in item))
      : [];

  // Strictly filter to only main/parent categories (exclude subcategories)
  const displayCategories = categoryList.filter((c) => c && !c.parent_id);

  if (displayCategories.length === 0 && categoryList.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {isBangla ? "ক্যাটাগরি সমূহ" : "Explore Categories"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Curated collections for your daily hardware & workspace needs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="theme-view-all-btn text-xs font-black uppercase tracking-wider hover:underline flex items-center gap-1 transition-colors"
          >
            <span>{t("common.viewAll")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Desktop Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                canScrollLeft
                  ? "border-gray-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                  : "border-gray-200 dark:border-white/5 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed"
              }`}
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                canScrollRight
                  ? "border-gray-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                  : "border-gray-200 dark:border-white/5 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed"
              }`}
              aria-label="Next categories"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track with Aspect-Ratio Adaptive Tiles */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
      >
        {/* Featured "Top Deals" Tile (Admin Configurable) */}
        {theme.category_deals_card_enabled !== false && (
          <Link
            href={theme.category_deals_card_link || "/products?discounted=true"}
            className="shrink-0 w-auto min-w-[76px] sm:min-w-[84px] max-w-[130px] flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="h-[64px] sm:h-[72px] w-[64px] sm:w-[72px] rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2 flex flex-col items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-rose-400">
              <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600 fill-rose-600 animate-pulse" />
            </div>
            <span className="mt-2 text-xs font-black text-rose-600 group-hover:underline line-clamp-1 max-w-full px-1">
              {theme.category_deals_card_title || "Top Deals"}
            </span>
            <span className="text-[10px] font-bold text-rose-500 mt-0.5">
              {theme.category_deals_card_subtitle || "Up to 20% Off"}
            </span>
          </Link>
        )}

        {/* Dynamic Aspect-Ratio Proportional Category Tiles */}
        {(displayCategories.length > 0 ? displayCategories : categoryList).map((cat, idx) => {
          const Icon = ICON_MAP[cat.icon || "Sparkles"] || Sparkles;
          const tint = PASTEL_TINTS[idx % PASTEL_TINTS.length];

          return (
            <Link
              key={cat.id || idx}
              href={`/products?category=${cat.slug}`}
              className="shrink-0 w-auto min-w-[76px] sm:min-w-[84px] max-w-[150px] sm:max-w-[170px] flex flex-col items-center text-center group cursor-pointer"
            >
              {/* Content-Driven Card: Takes exact shape and size of image without border padding frame */}
              {cat.image ? (
                <div className="h-[64px] sm:h-[72px] w-auto max-w-[140px] sm:max-w-[160px] rounded-2xl overflow-hidden shadow-xs border border-gray-100/80 dark:border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={160}
                    height={72}
                    sizes="(max-width: 640px) 140px, 160px"
                    className="h-full w-auto max-w-[140px] sm:max-w-[160px] object-contain rounded-2xl block"
                  />
                </div>
              ) : (
                <div
                  className={`h-[64px] sm:h-[72px] w-[64px] sm:w-[72px] rounded-2xl border p-2.5 flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${tint}`}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" />
                </div>
              )}

              {/* Category Title - Naturally aligned underneath */}
              <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#005826] dark:group-hover:text-emerald-400 transition-colors line-clamp-1 max-w-full px-1">
                {cat.name}
              </span>

              {/* Product Count */}
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {cat.products_count !== undefined ? `${cat.products_count} items` : "Explore"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
