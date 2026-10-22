"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 1:1 Dimension-Accurate Product Card Skeleton.
 * Matches exact aspect ratio, padding, typography rhythm, and cart button sizing of ProductCard.tsx
 * Eliminates Cumulative Layout Shift (CLS) when products hydrate.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "group relative w-full rounded-[var(--theme-card-radius,10px)] theme-card p-2 sm:p-2.5 lg:p-3 flex flex-col justify-between border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0e121e] shadow-2xs",
        className
      )}
    >
      <div>
        {/* Aspect-Square Image Container */}
        <div className="relative aspect-square w-full rounded-[calc(var(--theme-card-radius,10px)-2px)] overflow-hidden bg-gray-100 dark:bg-white/[0.04] mb-2 sm:mb-2.5 border border-gray-100 dark:border-white/5 animate-shimmer">
          {/* Subtle placeholder icon / watermark hint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />
        </div>

        {/* Category & Rating Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>

          {/* Product Title (Matches 2-line clamp height) */}
          <Skeleton className="h-3.5 w-4/5 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
        </div>
      </div>

      {/* Price & Add to Cart Bottom Bar */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 dark:border-white/5">
        <div className="space-y-1">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-2.5 w-10 rounded" />
        </div>
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

/**
 * Exact Primary Hero Carousel Banner Skeleton.
 * Uses identical classes: aspect-[16/9] min-h-[200px] max-h-[460px] rounded-lg sm:rounded-xl border border-white/10
 */
export function SkeletonBannerCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-xl bg-[#090b11] w-full aspect-[16/9] min-h-[200px] max-h-[460px] animate-shimmer",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-white/[0.02] to-transparent" />
      
      {/* Visual Content Hint */}
      <div className="absolute bottom-6 left-6 right-6 space-y-3 pointer-events-none">
        <Skeleton className="h-4 w-28 rounded-full bg-white/10" />
        <Skeleton className="h-7 sm:h-9 w-2/3 max-w-sm rounded-lg bg-white/10" />
        <Skeleton className="h-4 w-1/2 max-w-xs rounded bg-white/5" />
      </div>

      {/* Carousel dots indicator hint */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 pointer-events-none">
        <div className="w-6 h-1.5 rounded-full bg-white/20" />
        <div className="w-2 h-1.5 rounded-full bg-white/10" />
        <div className="w-2 h-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

/**
 * 1:1 Pixel-Perfect Hero Section Skeleton.
 * Replicates the exact grid layout, padding, aspect ratios, and mobile responsive behavior
 * of HeroSection.tsx (Carousel + Secondary Promo Banner).
 */
export function HeroSectionSkeleton() {
  return (
    <div className="w-full space-y-3 sm:space-y-4 pt-3 sm:pt-4.5">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          {/* Left Primary Hero Carousel Skeleton (8 cols on lg) */}
          <div className="lg:col-span-8 h-full">
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-xl bg-[#090b11] w-full aspect-[16/9] min-h-[200px] max-h-[460px] animate-shimmer">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-white/[0.02] to-transparent" />
              
              <div className="absolute bottom-6 left-5 sm:left-7 right-5 sm:right-7 space-y-2.5 sm:space-y-3 pointer-events-none">
                <div className="h-4 w-24 sm:w-28 rounded-full bg-white/10" />
                <div className="h-6 sm:h-8 w-3/4 max-w-sm rounded-lg bg-white/10" />
                <div className="h-3.5 sm:h-4 w-1/2 max-w-xs rounded bg-white/5" />
              </div>

              {/* Carousel Pagination Dots */}
              <div className="absolute bottom-4 right-4 sm:right-6 flex items-center gap-1.5 pointer-events-none">
                <div className="w-6 h-1.5 rounded-full bg-white/25" />
                <div className="w-2 h-1.5 rounded-full bg-white/10" />
                <div className="w-2 h-1.5 rounded-full bg-white/10" />
              </div>
            </div>
          </div>

          {/* Right Secondary Promotional Card Skeleton (4 cols on lg, stacks on mobile/tablet) */}
          <div className="lg:col-span-4 h-full">
            <div className="relative w-full h-full min-h-[200px] aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-xl bg-[#0c0f18] animate-shimmer flex flex-col justify-end p-5">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-white/[0.02] to-transparent" />
              
              <div className="relative space-y-2 pointer-events-none">
                <div className="h-3.5 w-20 rounded bg-white/10" />
                <div className="h-5 w-3/4 rounded-lg bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 1:1 Pixel-Perfect Category Exploration Pills Skeleton.
 * Matches ExploreCategoriesSection.tsx
 */
export function ExploreCategoriesSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-3.5 w-64 max-w-full rounded" />
        </div>
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      {/* Categories Row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] animate-shimmer">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-white/[0.04]" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 1:1 Pixel-Perfect Trust Ribbon Skeleton.
 * Matches TrustRibbon.tsx
 */
export function TrustRibbonSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] flex items-center gap-3 animate-shimmer">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.04] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
